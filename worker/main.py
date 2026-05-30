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
import os
import shutil
import subprocess
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from pipeline.paths import worker_preview_root, worker_storage_root
from pipeline.runner import JobProgress, JobSpec, SceneSpec, run_job
from pipeline.storage_backend import publish_output, storage_status
from pipeline.tts import list_vi_voices
from pipeline.ffmpeg_util import FFmpegRenderError, called_process_to_ffmpeg_error, probe_duration_ms

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

STORAGE_ROOT = worker_storage_root()
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

MAX_CONCURRENT = max(1, min(8, int(os.getenv("AUTOVIDEO_MAX_CONCURRENT", "4"))))
executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT, thread_name_prefix="render")


# ─────────────────────────────────────────────────── Persistence
def _persist_job(job: "Job") -> None:
    """Save job to storage/jobs/{id}/job.json (survives worker restart)."""
    job_dir = STORAGE_ROOT / job.id
    job_dir.mkdir(parents=True, exist_ok=True)
    (job_dir / "job.json").write_text(job.model_dump_json(indent=2), encoding="utf-8")


def _parse_iso_pair_ms(started: str | None, completed: str | None) -> int | None:
    if not started or not completed:
        return None
    for normalize in (lambda s: s.replace("Z", "+00:00"), lambda s: s):
        try:
            start = datetime.fromisoformat(normalize(started))
            end = datetime.fromisoformat(normalize(completed))
            delta = int((end - start).total_seconds() * 1000)
            return delta if delta > 0 else None
        except Exception:
            continue
    return None


def _read_manifest_metrics(job_dir: Path) -> dict:
    manifest_path = job_dir / "manifest.json"
    if not manifest_path.exists():
        return {}
    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _probe_output_file_ms(job_dir: Path, output_format: str = "mp4") -> int | None:
    for name in (f"output.{output_format}", "output.mp4", "output.mov"):
        out = job_dir / name
        if out.exists():
            ms = probe_duration_ms(out)
            if ms is not None and ms > 0:
                return ms
    return None


def _enrich_job_from_disk(j: "Job", job_dir: Path) -> None:
    """Backfill timing fields for jobs saved before metrics were persisted."""
    manifest = _read_manifest_metrics(job_dir)

    if j.expected_duration_ms is None or j.expected_duration_ms <= 0:
        expected = manifest.get("expected_duration_ms")
        if isinstance(expected, (int, float)) and expected > 0:
            j.expected_duration_ms = int(expected)

    if j.output_duration_ms is None or j.output_duration_ms <= 0:
        txt = job_dir / "output_duration_ms.txt"
        if txt.exists():
            try:
                j.output_duration_ms = int(txt.read_text(encoding="utf-8").strip())
            except Exception:
                pass
    if j.output_duration_ms is None or j.output_duration_ms <= 0:
        probed = manifest.get("output_duration_ms")
        if isinstance(probed, (int, float)) and probed > 0:
            j.output_duration_ms = int(probed)
    if j.output_duration_ms is None or j.output_duration_ms <= 0:
        fmt = j.config.output_format if j.config else "mp4"
        probed_file = _probe_output_file_ms(job_dir, fmt or "mp4")
        if probed_file is not None:
            j.output_duration_ms = probed_file

    if j.phase_timing_ms is None:
        pt = job_dir / "phase_timing_ms.json"
        if pt.exists():
            try:
                j.phase_timing_ms = json.loads(pt.read_text(encoding="utf-8"))
            except Exception:
                pass
    if j.phase_timing_ms is None:
        manifest_pt = manifest.get("phase_timing_ms")
        if isinstance(manifest_pt, dict):
            j.phase_timing_ms = {
                str(k): int(v)
                for k, v in manifest_pt.items()
                if isinstance(v, (int, float)) and v >= 0
            }

    if j.render_duration_ms is None or j.render_duration_ms <= 0:
        parsed = _parse_iso_pair_ms(j.started_at, j.completed_at)
        if parsed is not None:
            j.render_duration_ms = parsed
    if (j.render_duration_ms is None or j.render_duration_ms <= 0) and j.phase_timing_ms:
        total = j.phase_timing_ms.get("total_ms")
        if isinstance(total, (int, float)) and total > 0:
            j.render_duration_ms = int(total)
    if (j.render_duration_ms is None or j.render_duration_ms <= 0) and j.phase_timing_ms:
        tts = int(j.phase_timing_ms.get("tts_ms") or 0)
        audio = int(j.phase_timing_ms.get("audio_ms") or 0)
        subtitle = int(j.phase_timing_ms.get("subtitle_ms") or 0)
        compose = int(j.phase_timing_ms.get("compose_ms") or 0)
        summed = tts + audio + subtitle + compose
        if summed > 0:
            j.render_duration_ms = summed


def _ensure_job_metrics(j: "Job") -> "Job":
    job_dir = STORAGE_ROOT / j.id
    if not job_dir.is_dir():
        return j
    before = j.model_dump()
    _enrich_job_from_disk(j, job_dir)
    if j.model_dump() != before:
        _persist_job(j)
    return j


def _load_jobs() -> dict[str, "Job"]:
    """Scan storage/jobs/*/job.json on startup, restore in-memory state."""
    out: dict[str, "Job"] = {}
    for job_json in STORAGE_ROOT.glob("J*/job.json"):
        try:
            j = Job.model_validate_json(job_json.read_text(encoding="utf-8"))
            job_dir = job_json.parent
            _enrich_job_from_disk(j, job_dir)
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
    voice: str = "en-US-JennyNeural"
    fps: int = 30
    resolution: Literal["720p", "1080p", "2k", "4k"] = "1080p"
    video_quality: Literal["auto", "low", "medium", "high"] = "auto"
    output_format: Literal["mp4", "mov"] = "mp4"
    rate: str = "+0%"
    tts_provider: Literal["edge", "elevenlabs", "omnivoice-local"] = "edge"
    # v0.3 features
    subtitle_style: Literal["off", "line", "word_capcut"] = "off"
    bgm_volume: float = 0.18  # 0.0 – 1.0
    narration_script: str = ""


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
    started_at: str | None = None
    completed_at: str | None = None
    render_duration_ms: int | None = None
    phase_timing_ms: dict[str, int] | None = None
    output_url: str | None = None
    expected_duration_ms: int | None = None
    output_duration_ms: int | None = None
    error: str | None = None


def expected_duration_ms_from_scenes(scenes: list[SceneIn]) -> int:
    """Sum scene durations as sent by Studio (image-based export timeline)."""
    return sum(max(500, s.duration_ms or 5000) for s in scenes)


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

PREVIEW_DIR = worker_preview_root()
PREVIEW_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/voices/preview")
async def voice_preview(
    text: str = Query(..., description="Text to synthesize, max 800 chars"),
    voice: str = Query("en-US-JennyNeural"),
    rate: str = Query("+0%"),
):
    """Synthesize a short preview MP3 — cached by content hash.

    Reuses pipeline.tts.synthesize for consistency with full render path.
    Returns audio/mpeg stream.
    """
    if not text.strip():
        raise HTTPException(400, "empty text")
    if len(text) > 800:
        text = text[:800]
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

    expected_ms = expected_duration_ms_from_scenes(raw_scenes)

    job = Job(
        id=job_id,
        status="pending",
        config=cfg,
        scenes_count=len(scene_specs),
        created_at=datetime.utcnow().isoformat() + "Z",
        started_at=datetime.utcnow().isoformat() + "Z",
        expected_duration_ms=expected_ms,
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
        narration_text=(cfg.narration_script or "").strip(),
    )

    def progress_cb(p: JobProgress):
        j = JOBS.get(job_id)
        if j:
            j.status = p.step  # type: ignore[assignment]
            j.progress = p.percent
            j.message = p.message
            _persist_job(j)

    def runner_task():
        started_ms = int(datetime.utcnow().timestamp() * 1000)
        try:
            out, phase_timing = run_job(spec, progress_cb)
            j = JOBS[job_id]
            j.status = "done"
            j.progress = 100
            j.output_url = publish_output(job_id, out) or f"/jobs/{job_id}/output"
            j.output_duration_ms = probe_duration_ms(out)
            j.phase_timing_ms = phase_timing
            j.completed_at = datetime.utcnow().isoformat() + "Z"
            j.render_duration_ms = max(0, int(datetime.utcnow().timestamp() * 1000) - started_ms)
            _persist_job(j)
        except Exception as e:
            j = JOBS[job_id]
            j.status = "error"
            if isinstance(e, FFmpegRenderError):
                j.error = str(e)
            elif isinstance(e, subprocess.CalledProcessError):
                j.error = str(called_process_to_ffmpeg_error(e))
            else:
                j.error = f"{type(e).__name__}: {e}"
            j.completed_at = datetime.utcnow().isoformat() + "Z"
            j.render_duration_ms = max(0, int(datetime.utcnow().timestamp() * 1000) - started_ms)
            _persist_job(j)

    executor.submit(runner_task)
    return job


@app.get("/jobs", response_model=list[Job])
def list_jobs():
    # Newest first by created_at
    return sorted((_ensure_job_metrics(j) for j in JOBS.values()), key=lambda j: j.created_at, reverse=True)


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
    return _ensure_job_metrics(JOBS[job_id])


@app.post("/jobs/{job_id}/probe", response_model=Job)
def probe_job_output(job_id: str):
    """Re-probe output file duration (ffprobe via ffmpeg stderr)."""
    if job_id not in JOBS:
        raise HTTPException(404, "job not found")
    j = JOBS[job_id]
    if j.status != "done":
        raise HTTPException(400, "job not done")
    output_format = j.config.output_format or "mp4"
    out = STORAGE_ROOT / job_id / f"output.{output_format}"
    if not out.exists():
        out = STORAGE_ROOT / job_id / "output.mp4"
    if not out.exists():
        raise HTTPException(404, "output file not found")
    ms = probe_duration_ms(out)
    if ms is None:
        raise HTTPException(500, "could not probe output duration")
    j.output_duration_ms = ms
    _persist_job(j)
    return _ensure_job_metrics(j)


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
