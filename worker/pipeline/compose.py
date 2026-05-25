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

import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

ASPECT_TO_SIZE = {
    "9:16": (1080, 1920),
    "16:9": (1920, 1080),
    "1:1": (1080, 1080),
}


@dataclass
class SceneInput:
    image_path: Path
    duration_ms: int
    effect: str = "zoom_in"  # zoom_in | zoom_out | pan_right | pan_left | none


def _zoompan_filter(effect: str, duration_s: float, fps: int, w: int, h: int) -> str:
    """Build zoompan expression for Ken Burns effect."""
    frames = max(1, int(duration_s * fps))
    # zoompan zooms from z=1 → z=1.2 (or reverse). Pan via x/y interpolation.
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
    else:  # none
        z = "1.0"
        x, y = "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"

    return (
        f"scale={w*2}:{h*2}:force_original_aspect_ratio=increase,"
        f"crop={w*2}:{h*2},"
        f"zoompan=z='{z}':x='{x}':y='{y}':"
        f"d={frames}:s={w}x{h}:fps={fps}"
    )


def render_scene(
    scene: SceneInput,
    out_path: Path,
    aspect: str = "9:16",
    fps: int = 30,
) -> Path:
    w, h = ASPECT_TO_SIZE[aspect]
    dur_s = max(0.5, scene.duration_ms / 1000.0)
    vf = _zoompan_filter(scene.effect, dur_s, fps, w, h)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        FFMPEG, "-y",
        "-loop", "1",
        "-i", str(scene.image_path),
        "-t", f"{dur_s:.3f}",
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",
        "-r", str(fps),
        str(out_path),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    return out_path


def concat_segments(segments: list[Path], out_path: Path) -> Path:
    """Concat MP4 segments via concat demuxer."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
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


def mux_audio(
    video_path: Path,
    audio_path: Path,
    out_path: Path,
    subtitle_path: Path | None = None,
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
            "-shortest",
            str(out_path),
        ]
    else:
        # ffmpeg subtitles filter requires POSIX path on Windows.
        sub_for_filter = str(subtitle_path.resolve()).replace("\\", "/").replace(":", "\\:")
        cmd = [
            FFMPEG, "-y",
            "-i", str(video_path),
            "-i", str(audio_path),
            "-vf", f"subtitles='{sub_for_filter}'",
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
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
    workdir: Path | None = None,
    subtitle_path: Path | None = None,
) -> Path:
    workdir = workdir or out_path.parent / "_work"
    workdir.mkdir(parents=True, exist_ok=True)

    segments: list[Path] = []
    for i, sc in enumerate(scenes):
        seg = workdir / f"scene_{i:03d}.mp4"
        render_scene(sc, seg, aspect=aspect, fps=fps)
        segments.append(seg)

    silent_video = workdir / "video_silent.mp4"
    concat_segments(segments, silent_video)
    mux_audio(silent_video, audio_path, out_path, subtitle_path=subtitle_path)

    shutil.rmtree(workdir, ignore_errors=True)
    return out_path
