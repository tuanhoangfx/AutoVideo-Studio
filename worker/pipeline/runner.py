"""Job runner — orchestrate tts → subtitle → compose for 1 job.

Multi-job concurrency: ThreadPoolExecutor ở main.py.
Mỗi job tự chạy tuần tự các step (tts → subtitle → compose).

Bundle v0.3 features:
  - A1 Background music + auto-duck
  - A2 Subtitle burned-in (line per scene)
  - B3 CapCut word-by-word highlight (uses edge-tts WordBoundary)
"""
from __future__ import annotations

import asyncio
import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Literal

from .compose import SceneInput, compose_video, expected_output_duration_ms, refresh_encoder_for_job
from .duration_text import trim_text_for_duration
from .ffmpeg_util import probe_duration_ms, run_ffmpeg
from .paths import worker_storage_root
from .pipeline_constants import normalize_transition, resolve_effect
from .subtitle import SceneCaption, write_ass_lines, write_ass_words, write_srt
from .tts import synthesize

STORAGE_ROOT = worker_storage_root()

SubtitleStyle = Literal["off", "line", "word_capcut"]


@dataclass
class SceneSpec:
    text: str
    image_path: str  # absolute path on disk
    duration_ms: int | None = None
    effect: str | None = None  # auto-assign nếu None
    transition: str | None = None


@dataclass
class JobSpec:
    job_id: str
    scenes: list[SceneSpec]
    voice: str = "en-US-JennyNeural"
    aspect: str = "9:16"
    fps: int = 30
    resolution: str = "1080p"
    video_quality: str = "auto"
    output_format: str = "mp4"
    rate: str = "+0%"
    tts_provider: str = "edge"
    # v0.3 features
    bgm_path: str | None = None
    bgm_volume: float = 0.18           # 0.0 - 1.0 (default ~ -15dB)
    subtitle_style: SubtitleStyle = "off"
    narration_text: str = ""
    export_duration_ms: int | None = None
    hold_tail_ms: int | None = None


@dataclass
class JobProgress:
    step: str = "pending"
    percent: int = 0
    message: str = ""


ProgressCB = Callable[[JobProgress], None]


def _noop_cb(_: JobProgress) -> None: ...


async def _run_async(spec: JobSpec, cb: ProgressCB) -> tuple[Path, dict[str, int]]:
    job_dir = STORAGE_ROOT / spec.job_id
    audio_dir = job_dir / "audio"
    sub_dir = job_dir / "subtitle"
    job_dir.mkdir(parents=True, exist_ok=True)
    run_started = time.perf_counter()
    phase_timing_ms: dict[str, int] = {}

    # ── Step 1: visual timeline + single narration track ───────────────
    tts_started = time.perf_counter()
    cb(JobProgress("tts", 5, f"Chuẩn bị timeline ({len(spec.scenes)} ảnh)..."))
    scene_inputs: list[SceneInput] = []
    captions: list[SceneCaption] = []

    for i, sc in enumerate(spec.scenes):
        target_ms = max(500, sc.duration_ms or 5000)
        effect = resolve_effect(sc.effect, i)
        scene_inputs.append(
            SceneInput(
                image_path=Path(sc.image_path),
                duration_ms=target_ms,
                effect=effect,
                transition=normalize_transition(sc.transition),
            )
        )

    visual_ms = expected_output_duration_ms(scene_inputs)
    export_ms = max(visual_ms, int(spec.export_duration_ms or 0))
    hold_tail_ms = max(0, export_ms - visual_ms)
    timeline_ms = export_ms if export_ms > 0 else visual_ms

    narration = (spec.narration_text or "").strip()
    if not narration:
        narration = " ".join(s.text.strip() for s in spec.scenes if s.text.strip())

    cb(JobProgress("tts", 15, "Đọc narration (một track)..."))
    full_audio = audio_dir / "full.mp3"
    if narration:
        tts_text = trim_text_for_duration(narration, timeline_ms, spec.rate)
        tts_prefer = "edge" if spec.tts_provider in ("edge", "elevenlabs", "omnivoice-local") else spec.tts_provider
        result = await synthesize(
            tts_text, full_audio, voice=spec.voice, rate=spec.rate, prefer=tts_prefer
        )
        if full_audio.exists():
            _fit_audio_to_duration(full_audio, timeline_ms)
            _pad_audio_to_duration(full_audio, timeline_ms)
            captions.append(
                SceneCaption(
                    text=tts_text,
                    start_ms=0,
                    duration_ms=timeline_ms,
                    words=result.words if result else [],
                )
            )
        else:
            _make_silent_audio(timeline_ms, full_audio)
    else:
        _make_silent_audio(timeline_ms, full_audio)

    cb(JobProgress("tts", 40, f"Narration · {timeline_ms / 1000:g}s timeline"))
    phase_timing_ms["tts_ms"] = int((time.perf_counter() - tts_started) * 1000)

    # ── Step 2: optional BGM mix ───────────────────────────────────────
    audio_started = time.perf_counter()
    cb(JobProgress("audio", 45, "Ghép audio..."))

    final_audio = full_audio
    if spec.bgm_path:
        cb(JobProgress("audio", 50, "Mix background music..."))
        bgm_mixed = audio_dir / "mixed.mp3"
        _mix_bgm(
            voice=full_audio,
            bgm=Path(spec.bgm_path),
            out=bgm_mixed,
            bgm_volume=spec.bgm_volume,
        )
        final_audio = bgm_mixed
    phase_timing_ms["audio_ms"] = int((time.perf_counter() - audio_started) * 1000)

    # ── Step 3: subtitle (optional) ─────────────────────────────────────
    subtitle_started = time.perf_counter()
    subtitle_file: Path | None = None
    if spec.subtitle_style != "off" and captions:
        cb(JobProgress("compose", 55, f"Tạo subtitle ({spec.subtitle_style})..."))
        if spec.subtitle_style == "word_capcut":
            subtitle_file = write_ass_words(captions, sub_dir / "captions.ass", capcut_pop=True)
        elif spec.subtitle_style == "line":
            subtitle_file = write_ass_lines(captions, sub_dir / "captions.ass")
        # Also write SRT for download convenience
        write_srt(captions, sub_dir / "captions.srt")
    phase_timing_ms["subtitle_ms"] = int((time.perf_counter() - subtitle_started) * 1000)

    # ── Step 4: compose video ──────────────────────────────────────────
    refresh_encoder_for_job()
    compose_started = time.perf_counter()
    cb(JobProgress("compose", 60, "Export video..."))
    output_ext = "mov" if spec.output_format == "mov" else "mp4"
    out_path = job_dir / f"output.{output_ext}"
    compose_video(
        scene_inputs,
        final_audio,
        out_path,
        aspect=spec.aspect,
        fps=spec.fps,
        resolution=spec.resolution,
        video_quality=spec.video_quality,
        subtitle_path=subtitle_file,
        hold_tail_ms=hold_tail_ms,
        target_duration_ms=timeline_ms,
    )
    actual_ms = probe_duration_ms(out_path)
    if actual_ms is not None:
        (job_dir / "output_duration_ms.txt").write_text(str(actual_ms), encoding="utf-8")
    phase_timing_ms["compose_ms"] = int((time.perf_counter() - compose_started) * 1000)
    phase_timing_ms["timeline_ms"] = timeline_ms
    phase_timing_ms["total_ms"] = int((time.perf_counter() - run_started) * 1000)
    (job_dir / "phase_timing_ms.json").write_text(
        json.dumps(phase_timing_ms, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # ── Save manifest ──────────────────────────────────────────────────
    (job_dir / "manifest.json").write_text(
        json.dumps(
            {
                "job_id": spec.job_id,
                "voice": spec.voice,
                "aspect": spec.aspect,
                "fps": spec.fps,
                "resolution": spec.resolution,
                "video_quality": spec.video_quality,
                "output_format": output_ext,
                "bgm": spec.bgm_path is not None,
                "subtitle_style": spec.subtitle_style,
                "scenes": [
                    {
                        "text": s.text,
                        "duration_ms": si.duration_ms,
                        "effect": si.effect,
                        "transition": si.transition,
                    }
                    for s, si in zip(spec.scenes, scene_inputs)
                ],
                "captions": [
                    {"text": c.text, "start_ms": c.start_ms, "duration_ms": c.duration_ms}
                    for c in captions
                ],
                "output": str(out_path),
                "expected_duration_ms": timeline_ms,
                "output_duration_ms": actual_ms,
                "phase_timing_ms": phase_timing_ms,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    cb(JobProgress("done", 100, "Xong"))
    return out_path, phase_timing_ms


def _fit_audio_to_duration(audio: Path, target_ms: int) -> None:
    """Trim scene TTS so it never exceeds the export slot duration."""
    actual = probe_duration_ms(audio)
    if actual is None:
        return
    target_ms = max(500, int(target_ms))
    if actual <= target_ms + 80:
        return
    dur_s = target_ms / 1000.0
    tmp = audio.with_name(f"{audio.stem}_fit.mp3")
    run_ffmpeg(
        [
            "-y",
            "-i",
            str(audio),
            "-t",
            f"{dur_s:.3f}",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "192k",
            str(tmp),
        ]
    )
    tmp.replace(audio)


def _pad_audio_to_duration(audio: Path, target_ms: int) -> None:
    """Pad short TTS with silence so each scene matches the export slot."""
    actual = probe_duration_ms(audio)
    if actual is None:
        return
    target_ms = max(500, int(target_ms))
    if actual >= target_ms - 80:
        return
    dur_s = target_ms / 1000.0
    tmp = audio.with_name(f"{audio.stem}_pad.mp3")
    run_ffmpeg(
        [
            "-y",
            "-i",
            str(audio),
            "-af",
            f"apad=pad_dur={dur_s:.3f}",
            "-t",
            f"{dur_s:.3f}",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "192k",
            str(tmp),
        ]
    )
    tmp.replace(audio)


def _make_silent_audio(duration_ms: int, out_path: Path) -> None:
    """Create silent audio so image-only slideshows keep their exact duration."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    duration_s = max(0.5, duration_ms / 1000)
    run_ffmpeg(
        [
            "-y",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=channel_layout=stereo:sample_rate=44100",
            "-t",
            f"{duration_s:.3f}",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "192k",
            str(out_path),
        ]
    )


def _mix_bgm(voice: Path, bgm: Path, out: Path, bgm_volume: float = 0.18) -> None:
    """Mix voice + bgm with sidechain ducking."""
    fc = (
        f"[1:a]aloop=loop=-1:size=2e+09,volume={bgm_volume}[bgm_lv];"
        f"[0:a]asplit=2[voice_a][voice_sc];"
        f"[bgm_lv][voice_sc]sidechaincompress="
        f"threshold=0.05:ratio=8:level_sc=0.5:attack=20:release=400[duck_bgm];"
        f"[voice_a][duck_bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"
    )
    run_ffmpeg(
        [
            "-y",
            "-i",
            str(voice),
            "-i",
            str(bgm),
            "-filter_complex",
            fc,
            "-map",
            "[aout]",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "192k",
            str(out),
        ]
    )


def run_job(spec: JobSpec, cb: ProgressCB = _noop_cb) -> tuple[Path, dict[str, int]]:
    """Sync entry — chạy được trong ThreadPoolExecutor."""
    return asyncio.run(_run_async(spec, cb))
