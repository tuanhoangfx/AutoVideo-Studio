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
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Literal

from .compose import SceneInput, compose_video
from .subtitle import SceneCaption, write_ass_lines, write_ass_words, write_srt
from .tts import synthesize

STORAGE_ROOT = Path(__file__).resolve().parent.parent / "storage" / "jobs"

EFFECTS_CYCLE = ["zoom_in", "pan_right", "zoom_out", "pan_left"]

SubtitleStyle = Literal["off", "line", "word_capcut"]


@dataclass
class SceneSpec:
    text: str
    image_path: str  # absolute path on disk
    effect: str | None = None  # auto-assign nếu None


@dataclass
class JobSpec:
    job_id: str
    scenes: list[SceneSpec]
    voice: str = "vi-VN-HoaiMyNeural"
    aspect: str = "9:16"
    fps: int = 30
    rate: str = "+0%"
    # v0.3 features
    bgm_path: str | None = None
    bgm_volume: float = 0.18           # 0.0 - 1.0 (default ~ -15dB)
    subtitle_style: SubtitleStyle = "off"


@dataclass
class JobProgress:
    step: str = "pending"
    percent: int = 0
    message: str = ""


ProgressCB = Callable[[JobProgress], None]


def _noop_cb(_: JobProgress) -> None: ...


async def _run_async(spec: JobSpec, cb: ProgressCB) -> Path:
    job_dir = STORAGE_ROOT / spec.job_id
    audio_dir = job_dir / "audio"
    sub_dir = job_dir / "subtitle"
    job_dir.mkdir(parents=True, exist_ok=True)

    # ── Step 1: TTS per scene + collect captions ────────────────────────
    cb(JobProgress("tts", 5, f"Tạo voice ({len(spec.scenes)} scene)..."))
    scene_inputs: list[SceneInput] = []
    audio_segments: list[Path] = []
    captions: list[SceneCaption] = []
    cumulative_ms = 0

    for i, sc in enumerate(spec.scenes):
        audio_out = audio_dir / f"scene_{i:03d}.mp3"
        result = await synthesize(sc.text, audio_out, voice=spec.voice, rate=spec.rate)
        audio_segments.append(audio_out)

        # Subtitle caption for this scene
        captions.append(
            SceneCaption(
                text=sc.text,
                start_ms=cumulative_ms,
                duration_ms=result.duration_ms,
                words=result.words,
            )
        )
        cumulative_ms += result.duration_ms

        effect = sc.effect or EFFECTS_CYCLE[i % len(EFFECTS_CYCLE)]
        dur_ms = max(2000, min(15_000, result.duration_ms + 300))
        scene_inputs.append(
            SceneInput(
                image_path=Path(sc.image_path),
                duration_ms=dur_ms,
                effect=effect,
            )
        )
        cb(JobProgress("tts", 5 + int(35 * (i + 1) / len(spec.scenes)),
                       f"Voice scene {i+1}/{len(spec.scenes)}"))

    # ── Step 2: concat audio + (optional) mix BGM ──────────────────────
    cb(JobProgress("audio", 45, "Ghép audio..."))
    full_audio = audio_dir / "full.mp3"
    _concat_audio(audio_segments, full_audio)

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

    # ── Step 3: subtitle (optional) ─────────────────────────────────────
    subtitle_file: Path | None = None
    if spec.subtitle_style != "off":
        cb(JobProgress("compose", 55, f"Tạo subtitle ({spec.subtitle_style})..."))
        if spec.subtitle_style == "word_capcut":
            subtitle_file = write_ass_words(captions, sub_dir / "captions.ass", capcut_pop=True)
        elif spec.subtitle_style == "line":
            subtitle_file = write_ass_lines(captions, sub_dir / "captions.ass")
        # Also write SRT for download convenience
        write_srt(captions, sub_dir / "captions.srt")

    # ── Step 4: compose video ──────────────────────────────────────────
    cb(JobProgress("compose", 60, "Render video..."))
    out_path = job_dir / "output.mp4"
    compose_video(
        scene_inputs,
        final_audio,
        out_path,
        aspect=spec.aspect,
        fps=spec.fps,
        subtitle_path=subtitle_file,
    )

    # ── Save manifest ──────────────────────────────────────────────────
    (job_dir / "manifest.json").write_text(
        json.dumps(
            {
                "job_id": spec.job_id,
                "voice": spec.voice,
                "aspect": spec.aspect,
                "fps": spec.fps,
                "bgm": spec.bgm_path is not None,
                "subtitle_style": spec.subtitle_style,
                "scenes": [
                    {"text": s.text, "duration_ms": si.duration_ms, "effect": si.effect}
                    for s, si in zip(spec.scenes, scene_inputs)
                ],
                "captions": [
                    {"text": c.text, "start_ms": c.start_ms, "duration_ms": c.duration_ms}
                    for c in captions
                ],
                "output": str(out_path),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    cb(JobProgress("done", 100, "Xong"))
    return out_path


def _concat_audio(segments: list[Path], out_path: Path) -> None:
    """Concat MP3 via concat demuxer (works for same-codec)."""
    import imageio_ffmpeg, subprocess
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    list_file = out_path.parent / "audio_concat.txt"
    list_file.write_text(
        "\n".join(f"file '{seg.resolve().as_posix()}'" for seg in segments),
        encoding="utf-8",
    )
    subprocess.run(
        [ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", str(list_file),
         "-c", "copy", str(out_path)],
        check=True, capture_output=True,
    )


def _mix_bgm(voice: Path, bgm: Path, out: Path, bgm_volume: float = 0.18) -> None:
    """Mix voice + bgm with sidechain ducking.

    BGM is auto-ducked when voice is loud (sidechaincompress).
    voice stays at 100%, bgm drops to ~30% of bgm_volume when voice present.
    """
    import imageio_ffmpeg, subprocess
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    # Filter graph:
    #   [bgm] loop + volume → bgm_lv
    #   sidechain: voice activity → duck bgm_lv
    #   amix voice + ducked bgm → out
    fc = (
        f"[1:a]aloop=loop=-1:size=2e+09,volume={bgm_volume}[bgm_lv];"
        f"[0:a]asplit=2[voice_a][voice_sc];"
        f"[bgm_lv][voice_sc]sidechaincompress="
        f"threshold=0.05:ratio=8:level_sc=0.5:attack=20:release=400[duck_bgm];"
        f"[voice_a][duck_bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"
    )
    subprocess.run(
        [
            ffmpeg, "-y",
            "-i", str(voice),
            "-i", str(bgm),
            "-filter_complex", fc,
            "-map", "[aout]",
            "-c:a", "libmp3lame",
            "-b:a", "192k",
            str(out),
        ],
        check=True, capture_output=True,
    )


def run_job(spec: JobSpec, cb: ProgressCB = _noop_cb) -> Path:
    """Sync entry — chạy được trong ThreadPoolExecutor."""
    return asyncio.run(_run_async(spec, cb))
