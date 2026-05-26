"""AutoVideo Studio worker — FastAPI entry point.

Endpoints:
    POST   /jobs                 — create job (multipart: images[] + scenes JSON + config)
    GET    /jobs                 — list jobs
    GET    /jobs/{id}            — get status + progress
    GET    /jobs/{id}/output     — download exported video
    POST   /jobs/{id}/cancel
    GET    /voices               — list Studio-supported voices

Multi-job: ThreadPoolExecutor (default 2 concurrent renders).

Run:
    .venv/Scripts/uvicorn main:app --reload --port 8021
"""
from __future__ import annotations

import json
import shutil
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from pipeline.runner import JobProgress, JobSpec, SceneSpec, run_job
from pipeline.storage_backend import publish_output, storage_status
from pipeline.tts import list_vi_voices

app = FastAPI(title="AutoVideo Studio Worker", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3021",
        "http://127.0.0.1:3021",
        "https://p0021-autovideo-studio.vercel.app",
        "https://p0021.infix1.io.vn",
    ],
    allow_origin_regex=r"https://p0021-autovideo-studio(?:-[a-z0-9]+)*-[a-z0-9-]+\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_ROOT = Path(__file__).resolve().parent / "storage" / "jobs"
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

MAX_CONCURRENT = 2
executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT, thread_name_prefix="render")


# ─────────────────────────────────────────────────── Persistence
def _persist_job(job: "Job") -> None:
    """Save job to storage/jobs/{id}/job.json (survives worker restart)."""
    job_dir = STORAGE_ROOT / job.id
    job_dir.mkdir(parents=True, exist_ok=True)
    (job_dir / "job.json").write_text(job.model_dump_json(indent=2), encoding="utf-8")


def _load_jobs() -> dict[str, "Job"]:
    """Scan storage/jobs/*/job.json on startup, restore in-memory state."""
    out: dict[str, "Job"] = {}
    for job_json in STORAGE_ROOT.glob("J*/job.json"):
        try:
            j = Job.model_validate_json(job_json.read_text(encoding="utf-8"))
            # Jobs left mid-render get marked error (process died, not resumable)
            if j.status not in ("done", "error"):
                j.status = "error"
                j.error = "worker restarted while rendering"
            out[j.id] = j
        except Exception as e:
            print(f"  [persist] skip {job_json}: {e}")
    return out


# ─────────────────────────────────────────────────── Models
Status = Literal["pending", "tts", "audio", "compose", "done", "error"]


class JobConfig(BaseModel):
    aspect: Literal["9:16", "16:9", "1:1"] = "9:16"
    voice: str = "vi-VN-HoaiMyNeural"
    fps: int = 30
    resolution: Literal["720p", "1080p", "2k", "4k"] = "1080p"
    video_quality: Literal["auto", "low", "medium", "high"] = "auto"
    output_format: Literal["mp4", "mov"] = "mp4"
    rate: str = "+0%"
    tts_provider: Literal["edge", "elevenlabs", "omnivoice-local"] = "edge"
    # v0.3 features
    subtitle_style: Literal["off", "line", "word_capcut"] = "off"
    bgm_volume: float = 0.18  # 0.0 – 1.0


class SceneIn(BaseModel):
    text: str
    image_index: int  # index vào files[] upload
    duration_ms: int | None = None
    effect: str | None = None
    transition: str | None = None


class Job(BaseModel):
    id: str
    status: Status
    progress: int = 0
    message: str = ""
    config: JobConfig
    scenes_count: int = 0
    created_at: str
    output_url: str | None = None
    error: str | None = None


JOBS: dict[str, Job] = {}


@app.on_event("startup")
def _restore_jobs():
    """Load persisted jobs from disk."""
    JOBS.update(_load_jobs())
    print(f"  [startup] restored {len(JOBS)} jobs from disk")


def new_job_id() -> str:
    return f"J{datetime.now():%y%m%d}-{uuid.uuid4().hex[:6]}"


# ─────────────────────────────────────────────────── Routes
@app.get("/")
def root():
    return {
        "name": "AutoVideo Studio Worker",
        "version": "0.2.0",
        "jobs": len(JOBS),
        "concurrent_limit": MAX_CONCURRENT,
        "storage": storage_status(),
    }


@app.get("/voices")
async def voices():
    return await list_vi_voices()


# ──────────────────── Voice preview (listen test before render) ────────
import asyncio as _asyncio
import hashlib as _hashlib
from fastapi import Query

PREVIEW_DIR = Path(__file__).resolve().parent / "storage" / "preview"
PREVIEW_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/voices/preview")
async def voice_preview(
    text: str = Query(..., description="Text to synthesize, max 200 chars"),
    voice: str = Query("vi-VN-HoaiMyNeural"),
    rate: str = Query("+0%"),
):
    """Synthesize a short preview MP3 — cached by content hash.

    Reuses pipeline.tts.synthesize for consistency with full render path.
    Returns audio/mpeg stream.
    """
    if not text.strip():
        raise HTTPException(400, "empty text")
    if len(text) > 200:
        text = text[:200]
    # Cache key
    key = _hashlib.sha1(f"{voice}|{rate}|{text}".encode("utf-8")).hexdigest()[:16]
    out = PREVIEW_DIR / f"{key}.mp3"
    if not out.exists():
        from pipeline.tts import synthesize
        await synthesize(text, out, voice=voice, rate=rate)
    return FileResponse(out, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=3600"})


@app.post("/jobs", response_model=Job)
async def create_job(
    scenes: str = Form(..., description="JSON array of SceneIn"),
    config: str = Form(..., description="JSON of JobConfig"),
    files: list[UploadFile] = File(...),
    bgm: UploadFile | None = File(default=None),
):
    cfg = JobConfig.model_validate_json(config)
    raw_scenes = [SceneIn.model_validate(s) for s in json.loads(scenes)]
    if not raw_scenes:
        raise HTTPException(400, "scenes empty")
    if not files:
        raise HTTPException(400, "no files uploaded")

    job_id = new_job_id()
    job_dir = STORAGE_ROOT / job_id
    img_dir = job_dir / "images"
    img_dir.mkdir(parents=True, exist_ok=True)

    saved: list[Path] = []
    for i, uf in enumerate(files):
        ext = Path(uf.filename or f"img_{i}.jpg").suffix or ".jpg"
        dest = img_dir / f"img_{i:03d}{ext}"
        with open(dest, "wb") as f:
            shutil.copyfileobj(uf.file, f)
        saved.append(dest)

    # Save optional BGM
    bgm_path: str | None = None
    if bgm and bgm.filename:
        ext = Path(bgm.filename).suffix.lower() or ".mp3"
        if ext not in (".mp3", ".m4a", ".aac", ".wav", ".ogg"):
            ext = ".mp3"
        bgm_dest = job_dir / f"bgm{ext}"
        with open(bgm_dest, "wb") as f:
            shutil.copyfileobj(bgm.file, f)
        bgm_path = str(bgm_dest)

    scene_specs = [
        SceneSpec(
            text=s.text,
            image_path=str(saved[min(s.image_index, len(saved) - 1)]),
            duration_ms=s.duration_ms,
            effect=s.effect,
            transition=s.transition,
        )
        for s in raw_scenes
    ]

    job = Job(
        id=job_id,
        status="pending",
        config=cfg,
        scenes_count=len(scene_specs),
        created_at=datetime.utcnow().isoformat() + "Z",
    )
    JOBS[job_id] = job
    _persist_job(job)

    spec = JobSpec(
        job_id=job_id,
        scenes=scene_specs,
        voice=cfg.voice,
        aspect=cfg.aspect,
        fps=cfg.fps,
        resolution=cfg.resolution,
        video_quality=cfg.video_quality,
        output_format=cfg.output_format,
        rate=cfg.rate,
        tts_provider=cfg.tts_provider,
        bgm_path=bgm_path,
        bgm_volume=cfg.bgm_volume,
        subtitle_style=cfg.subtitle_style,
    )

    def progress_cb(p: JobProgress):
        j = JOBS.get(job_id)
        if j:
            j.status = p.step  # type: ignore[assignment]
            j.progress = p.percent
            j.message = p.message
            _persist_job(j)

    def runner_task():
        try:
            out = run_job(spec, progress_cb)
            j = JOBS[job_id]
            j.status = "done"
            j.progress = 100
            j.output_url = publish_output(job_id, out) or f"/jobs/{job_id}/output"
            _persist_job(j)
        except Exception as e:
            j = JOBS[job_id]
            j.status = "error"
            j.error = f"{type(e).__name__}: {e}"
            _persist_job(j)

    executor.submit(runner_task)
    return job


@app.get("/jobs", response_model=list[Job])
def list_jobs():
    # Newest first by created_at
    return sorted(JOBS.values(), key=lambda j: j.created_at, reverse=True)


@app.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(404, "job not found")
    JOBS.pop(job_id, None)
    job_dir = STORAGE_ROOT / job_id
    if job_dir.exists():
        shutil.rmtree(job_dir, ignore_errors=True)
    return {"ok": True}


@app.get("/jobs/{job_id}", response_model=Job)
def get_job(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(404, "job not found")
    return JOBS[job_id]


@app.get("/jobs/{job_id}/output")
def get_output(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(404, "job not found")
    output_format = JOBS[job_id].config.output_format or "mp4"
    out = STORAGE_ROOT / job_id / f"output.{output_format}"
    if not out.exists():
        out = STORAGE_ROOT / job_id / "output.mp4"
    if not out.exists():
        raise HTTPException(404, "output not ready")
    media_type = "video/quicktime" if out.suffix.lower() == ".mov" else "video/mp4"
    return FileResponse(out, media_type=media_type, filename=f"{job_id}{out.suffix}")


@app.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str):
    # Note: ThreadPoolExecutor không cancel mid-task; chỉ mark status.
    if job_id not in JOBS:
        raise HTTPException(404, "job not found")
    JOBS[job_id].status = "error"
    JOBS[job_id].error = "canceled by user"
    _persist_job(JOBS[job_id])
    return {"ok": True}
