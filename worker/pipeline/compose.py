"""FFmpeg compose — ghép ảnh + Ken Burns + audio → MP4.

Dùng imageio-ffmpeg để có binary sẵn (không cần ffmpeg trong PATH).

Pipeline mỗi scene:
    image (any size) → scale + crop to target → zoompan (Ken Burns) → segment MP4
Sau đó concat các segment + mux audio.
"""
from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

from .ffmpeg_util import (
    FFmpegRenderError,
    called_process_to_ffmpeg_error,
    get_ffmpeg,
    probe_duration_ms,
    run_ffmpeg_checked,
)
from .pipeline_constants import TRANSITION_S, normalize_transition

FFMPEG = get_ffmpeg()
_XF_FILTER_AVAILABLE: bool | None = None
_ENCODER_PICK: tuple[str, list[str]] | None = None

RESOLUTION_TO_LONG_EDGE = {
    "720p": 1280,
    "1080p": 1920,
    "2k": 2560,
    "4k": 3840,
}

QUALITY_TO_BITRATE = {
    "low": "4M",
    "medium": "8M",
    "high": "16M",
}


def _target_size(aspect: str, resolution: str = "1080p") -> tuple[int, int]:
    long_edge = RESOLUTION_TO_LONG_EDGE.get(resolution, 1920)
    if aspect == "16:9":
        return long_edge, int(long_edge * 9 / 16)
    if aspect == "1:1":
        square = 720 if resolution == "720p" else 1080 if resolution == "1080p" else 1440 if resolution == "2k" else 2160
        return square, square
    return int(long_edge * 9 / 16), long_edge


def _video_bitrate_args(video_quality: str = "auto") -> list[str]:
    bitrate = QUALITY_TO_BITRATE.get(video_quality)
    return ["-b:v", bitrate] if bitrate else []

def _encoder_preset_args(encoder: str) -> list[str]:
    import os

    if encoder == "libx264":
        preset = (os.getenv("AUTOVIDEO_X264_PRESET") or "veryfast").strip() or "veryfast"
        return ["-preset", preset]
    if encoder == "h264_nvenc":
        preset = (os.getenv("AUTOVIDEO_NVENC_PRESET") or "p2").strip() or "p2"
        return ["-preset", preset]
    if encoder == "h264_qsv":
        return ["-preset", "veryfast"]
    if encoder == "h264_amf":
        return ["-quality", "speed"]
    return []


def reset_encoder_to_libx264() -> None:
    """Force CPU encoder after HW encode failure (parallel NVENC saturation, etc.)."""
    global _ENCODER_PICK
    _ENCODER_PICK = ("libx264", _encoder_preset_args("libx264"))


def refresh_encoder_for_job() -> None:
    """Re-read encoder env each job — avoids stale NVENC cache and zombie worker configs."""
    global _ENCODER_PICK
    import os
    import sys

    forced = (os.getenv("AUTOVIDEO_VIDEO_ENCODER") or "").strip()
    if forced:
        _ENCODER_PICK = (forced, _encoder_preset_args(forced))
        return
    # Windows desktop default: CPU (NVENC often fails; see job logs with h264_nvenc errors).
    if sys.platform == "win32" and os.getenv("AUTOVIDEO_PREFER_HW_ENCODER") != "1":
        _ENCODER_PICK = ("libx264", _encoder_preset_args("libx264"))
        return
    _ENCODER_PICK = None


def _pick_h264_encoder() -> tuple[str, list[str]]:
    """Pick the best available H.264 encoder for the current PC.

    On Windows defaults to libx264 unless AUTOVIDEO_PREFER_HW_ENCODER=1.
    Returns (encoder_name, extra_args).
    """
    global _ENCODER_PICK
    if _ENCODER_PICK is not None:
        return _ENCODER_PICK

    refresh_encoder_for_job()
    if _ENCODER_PICK is not None:
        return _ENCODER_PICK

    import os

    encoders_text = ""
    try:
        result = subprocess.run([FFMPEG, "-hide_banner", "-encoders"], check=True, capture_output=True, text=True)
        encoders_text = (result.stdout or "") + "\n" + (result.stderr or "")
    except Exception:
        encoders_text = ""

    def has(name: str) -> bool:
        return f" {name} " in encoders_text or f"\t{name} " in encoders_text or f" {name}\t" in encoders_text

    # Conservative presets for stability; quality controlled by bitrate mapping.
    if has("h264_nvenc"):
        _ENCODER_PICK = ("h264_nvenc", _encoder_preset_args("h264_nvenc"))
        return _ENCODER_PICK
    if has("h264_qsv"):
        _ENCODER_PICK = ("h264_qsv", _encoder_preset_args("h264_qsv"))
        return _ENCODER_PICK
    if has("h264_amf"):
        _ENCODER_PICK = ("h264_amf", _encoder_preset_args("h264_amf"))
        return _ENCODER_PICK

    _ENCODER_PICK = ("libx264", _encoder_preset_args("libx264"))
    return _ENCODER_PICK


@dataclass
class SceneInput:
    image_path: Path
    duration_ms: int
    effect: str = "zoom_in"  # zoom_in | zoom_out | pan_right | pan_left | flash | sparkle | random | none
    transition: str = "slide_left"  # slide_left | slide_right | fade | zoom | random | none (cut)


def _zoompan_filter(effect: str, duration_s: float, fps: int, w: int, h: int) -> str:
    """Build zoompan expression for Ken Burns effect."""
    frames = max(1, int(duration_s * fps))
    # zoompan zooms from z=1 → z=1.2 (or reverse). Pan via x/y interpolation.
    post_filters: list[str] = []
    if effect == "zoom_in":
        z = f"min(zoom+0.0015,1.25)"
        x, y = "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"
    elif effect == "zoom_out":
        z = f"if(lte(zoom,1.0),1.25,max(1.001,zoom-0.0015))"
        x, y = "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"
    elif effect == "pan_right":
        z = "1.15"
        x, y = "on/{f}*(iw-iw/zoom)".format(f=frames), "ih/2-(ih/zoom/2)"
    elif effect == "pan_left":
        z = "1.15"
        x, y = "(iw-iw/zoom)-on/{f}*(iw-iw/zoom)".format(f=frames), "ih/2-(ih/zoom/2)"
    elif effect == "flash":
        z = f"min(zoom+0.0008,1.08)"
        x, y = "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"
        post_filters.append("fade=t=in:st=0:d=0.18:color=white")
    elif effect == "sparkle":
        z = f"min(zoom+0.001,1.12)"
        x, y = "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"
        post_filters.extend(["eq=saturation=1.18:contrast=1.08", "unsharp=5:5:0.6:3:3:0.2"])
    else:  # none
        z = "1.0"
        x, y = "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"

    base = (
        f"scale={w*2}:{h*2}:force_original_aspect_ratio=increase,"
        f"crop={w*2}:{h*2},"
        f"zoompan=z='{z}':x='{x}':y='{y}':"
        f"d={frames}:s={w}x{h}:fps={fps}"
    )
    if post_filters:
        return f"{base}," + ",".join(post_filters)
    return base


def _is_static_effect(effect: str) -> bool:
    return (effect or "none").lower() in ("none", "static", "still")


def _render_scene_once(
    scene: SceneInput,
    out_path: Path,
    *,
    aspect: str,
    fps: int,
    resolution: str,
    video_quality: str,
    encoder: str,
    encoder_args: list[str],
) -> None:
    w, h = _target_size(aspect, resolution)
    dur_s = max(0.5, scene.duration_ms / 1000.0)
    # Ken Burns at 60fps is very heavy; cap filter fps, keep output -r.
    filter_fps = fps if _is_static_effect(scene.effect) else min(fps, 30)
    if _is_static_effect(scene.effect):
        vf = f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}"
    else:
        vf = _zoompan_filter(scene.effect, dur_s, filter_fps, w, h)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    run_ffmpeg_checked(
        [
            "-y",
            "-loop",
            "1",
            "-i",
            str(scene.image_path),
            "-t",
            f"{dur_s:.3f}",
            "-vf",
            vf,
            "-c:v",
            encoder,
            *encoder_args,
            *_video_bitrate_args(video_quality),
            "-pix_fmt",
            "yuv420p",
            "-r",
            str(fps),
            str(out_path),
        ]
    )


def render_scene(
    scene: SceneInput,
    out_path: Path,
    aspect: str = "9:16",
    fps: int = 30,
    resolution: str = "1080p",
    video_quality: str = "auto",
) -> Path:
    encoder, encoder_args = _pick_h264_encoder()
    try:
        _render_scene_once(
            scene,
            out_path,
            aspect=aspect,
            fps=fps,
            resolution=resolution,
            video_quality=video_quality,
            encoder=encoder,
            encoder_args=encoder_args,
        )
    except (subprocess.CalledProcessError, FFmpegRenderError) as err:
        if encoder == "libx264":
            if isinstance(err, subprocess.CalledProcessError):
                raise called_process_to_ffmpeg_error(err) from err
            raise
        reset_encoder_to_libx264()
        encoder, encoder_args = _pick_h264_encoder()
        try:
            _render_scene_once(
                scene,
                out_path,
                aspect=aspect,
                fps=fps,
                resolution=resolution,
                video_quality=video_quality,
                encoder=encoder,
                encoder_args=encoder_args,
            )
        except (subprocess.CalledProcessError, FFmpegRenderError) as retry_err:
            if isinstance(retry_err, subprocess.CalledProcessError):
                raise called_process_to_ffmpeg_error(retry_err) from retry_err
            raise
    return out_path


def concat_segments(
    segments: list[Path],
    out_path: Path,
    transitions: list[str] | None = None,
    scene_durations_s: list[float] | None = None,
    video_quality: str = "auto",
) -> Path:
    """Concat MP4 segments via concat demuxer."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    transitions = transitions or []
    scene_durations_s = scene_durations_s or []
    if (
        len(segments) > 1
        and transitions
        and scene_durations_s
        and any(t != "cut" for t in transitions)
        and _xfade_available()
    ):
        return xfade_segments(segments, out_path, transitions, scene_durations_s, video_quality=video_quality)

    list_file = out_path.parent / "concat.txt"
    list_file.write_text(
        "\n".join(f"file '{seg.resolve().as_posix()}'" for seg in segments),
        encoding="utf-8",
    )
    cmd = [
        FFMPEG, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(list_file),
        "-c", "copy",
        str(out_path),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    return out_path


def xfade_segments(
    segments: list[Path],
    out_path: Path,
    transitions: list[str],
    scene_durations_s: list[float],
    video_quality: str = "auto",
) -> Path:
    """Join segments with xfade transitions while preserving requested timeline duration."""
    encoder, encoder_args = _pick_h264_encoder()
    cmd = [FFMPEG, "-y"]
    for seg in segments:
        cmd.extend(["-i", str(seg)])

    filters: list[str] = []
    last_label = "0:v"
    for i in range(1, len(segments)):
        transition = _xfade_name(transitions[i - 1] if i - 1 < len(transitions) else "slide_left", i - 1)
        offset = sum(scene_durations_s[:i])
        out_label = f"v{i}"
        filters.append(
            f"[{last_label}][{i}:v]xfade=transition={transition}:"
            f"duration={TRANSITION_S}:offset={offset:.3f}[{out_label}]"
        )
        last_label = out_label

    cmd.extend([
        "-filter_complex", ";".join(filters),
        "-map", f"[{last_label}]",
        "-an",
        "-c:v", encoder,
        *encoder_args,
        *_video_bitrate_args(video_quality),
        "-pix_fmt", "yuv420p",
        str(out_path),
    ])
    subprocess.run(cmd, check=True, capture_output=True)
    return out_path


def _xfade_name(transition: str, index: int = 0) -> str:
    if transition in ("none", "cut"):
        return "fade"
    if transition == "random":
        return ["slideleft", "slideright", "fade", "fade"][index % 4]
    if transition == "slide_right":
        return "slideright"
    if transition == "fade":
        return "fade"
    if transition == "zoom":
        return "fade"
    return "slideleft"


def _xfade_available() -> bool:
    """The bundled imageio-ffmpeg on Windows can be older than the xfade filter."""
    global _XF_FILTER_AVAILABLE
    if _XF_FILTER_AVAILABLE is not None:
        return _XF_FILTER_AVAILABLE
    try:
      result = subprocess.run(
          [FFMPEG, "-hide_banner", "-filters"],
          check=True,
          capture_output=True,
          text=True,
      )
      _XF_FILTER_AVAILABLE = " xfade " in result.stdout
    except Exception:
      _XF_FILTER_AVAILABLE = False
    return _XF_FILTER_AVAILABLE


def mux_audio(
    video_path: Path,
    audio_path: Path,
    out_path: Path,
    subtitle_path: Path | None = None,
    video_quality: str = "auto",
) -> Path:
    """Mux video + audio + (optional) burn-in subtitle.

    If subtitle_path provided, re-encode video with subtitles filter applied
    (cannot use -c:v copy when filter active).
    """
    if subtitle_path is None:
        cmd = [
            FFMPEG, "-y",
            "-i", str(video_path),
            "-i", str(audio_path),
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            # Ensure the video timeline isn't truncated when TTS audio
            # is shorter than the requested scene durations.
            "-af", "apad",
            "-shortest",
            "-movflags", "+faststart",
            str(out_path),
        ]
    else:
        # ffmpeg subtitles filter requires POSIX path on Windows.
        sub_for_filter = str(subtitle_path.resolve()).replace("\\", "/").replace(":", "\\:")
        encoder, encoder_args = _pick_h264_encoder()
        cmd = [
            FFMPEG, "-y",
            "-i", str(video_path),
            "-i", str(audio_path),
            "-vf", f"subtitles='{sub_for_filter}'",
            "-c:v", encoder,
            *encoder_args,
            *_video_bitrate_args(video_quality),
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-af", "apad",
            "-shortest",
            "-movflags", "+faststart",
            str(out_path),
        ]
    subprocess.run(cmd, check=True, capture_output=True)
    return out_path


def compose_video(
    scenes: list[SceneInput],
    audio_path: Path,
    out_path: Path,
    aspect: str = "9:16",
    fps: int = 30,
    resolution: str = "1080p",
    video_quality: str = "auto",
    workdir: Path | None = None,
    subtitle_path: Path | None = None,
) -> Path:
    refresh_encoder_for_job()
    workdir = workdir or out_path.parent / "_work"
    workdir.mkdir(parents=True, exist_ok=True)

    segments: list[Path] = []
    scene_durations_s: list[float] = []
    transitions: list[str] = []
    use_xfade = len(scenes) > 1

    # Pre-compute timeline + output segment paths (keeps order stable).
    render_jobs: list[tuple[int, SceneInput, Path]] = []
    for i, sc in enumerate(scenes):
        seg = workdir / f"scene_{i:03d}.mp4"
        scene_durations_s.append(max(0.5, sc.duration_ms / 1000.0))
        transition = normalize_transition(sc.transition)
        if i < len(scenes) - 1:
            transitions.append(transition)
        transition_buffer_ms = (
            int(TRANSITION_S * 1000) if use_xfade and i < len(scenes) - 1 and transition != "cut" else 0
        )
        render_input = SceneInput(
            image_path=sc.image_path,
            duration_ms=sc.duration_ms + transition_buffer_ms,
            effect=sc.effect,
            transition=transition,
        )
        render_jobs.append((i, render_input, seg))

    # Render scenes in parallel (no quality change; just concurrency).
    # Limit concurrency to avoid disk thrash / GPU encoder saturation.
    encoder, _encoder_args = _pick_h264_encoder()
    using_hw = encoder in ("h264_nvenc", "h264_qsv", "h264_amf")
    max_workers = 1
    try:
        import os

        override = int(os.getenv("AUTOVIDEO_RENDER_WORKERS") or "0")
        if override > 0:
            max_workers = override
        else:
            # HW: 2 parallel scene encodes when multiple scenes (NVENC sessions are usually fine).
            if using_hw:
                max_workers = min(2, len(render_jobs)) if len(render_jobs) >= 2 else 1
            else:
                max_workers = min(4, len(render_jobs)) if len(render_jobs) >= 4 else 2 if len(render_jobs) >= 2 else 1
    except Exception:
        max_workers = 1

    if max_workers <= 1:
        for _, render_input, seg in render_jobs:
            render_scene(render_input, seg, aspect=aspect, fps=fps, resolution=resolution, video_quality=video_quality)
            segments.append(seg)
    else:
        futures = []
        errors: list[Exception] = []
        with ThreadPoolExecutor(max_workers=max_workers) as ex:
            for _, render_input, seg in render_jobs:
                futures.append(
                    ex.submit(
                        render_scene,
                        render_input,
                        seg,
                        aspect,
                        fps,
                        resolution,
                        video_quality,
                    )
                )
            for f in as_completed(futures):
                try:
                    f.result()
                except Exception as e:
                    errors.append(e)
        if errors:
            # HW encoders can saturate under parallel load — fall back to CPU, sequential.
            if using_hw:
                reset_encoder_to_libx264()
                segments = []
                for _, render_input, seg in render_jobs:
                    render_scene(
                        render_input,
                        seg,
                        aspect=aspect,
                        fps=fps,
                        resolution=resolution,
                        video_quality=video_quality,
                    )
                    segments.append(seg)
            else:
                first = errors[0]
                if isinstance(first, FFmpegRenderError):
                    raise first
                if isinstance(first, subprocess.CalledProcessError):
                    raise called_process_to_ffmpeg_error(first) from first
                raise first
        if not segments:
            segments = [seg for _, _, seg in render_jobs]

    silent_video = workdir / "video_silent.mp4"
    concat_segments(
        segments,
        silent_video,
        transitions=transitions,
        scene_durations_s=scene_durations_s,
        video_quality=video_quality,
    )
    mux_audio(silent_video, audio_path, out_path, subtitle_path=subtitle_path, video_quality=video_quality)

    shutil.rmtree(workdir, ignore_errors=True)
    return out_path
