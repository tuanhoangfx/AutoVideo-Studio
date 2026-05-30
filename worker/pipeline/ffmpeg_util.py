"""FFmpeg helpers — single subprocess entry for runner + compose."""
from __future__ import annotations

import subprocess
from pathlib import Path

import imageio_ffmpeg

_FFMPEG: str | None = None


class FFmpegRenderError(RuntimeError):
    """Raised when ffmpeg exits non-zero; carries a short UI-safe message."""

    def __init__(self, message: str, *, stderr: str = ""):
        super().__init__(message)
        self.stderr = stderr


def get_ffmpeg() -> str:
    global _FFMPEG
    if _FFMPEG is None:
        _FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
    return _FFMPEG


def tail_stderr(stderr: str, *, max_lines: int = 6) -> str:
    lines = [ln.strip() for ln in (stderr or "").splitlines() if ln.strip()]
    if not lines:
        return "ffmpeg failed (no stderr)"
    return "\n".join(lines[-max_lines:])


def run_ffmpeg(args: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [get_ffmpeg(), *args],
        check=check,
        capture_output=True,
        text=True,
    )


def run_ffmpeg_checked(args: list[str]) -> subprocess.CompletedProcess[str]:
    result = run_ffmpeg(args, check=False)
    if result.returncode == 0:
        return result
    detail = tail_stderr(result.stderr or "")
    raise FFmpegRenderError(f"ffmpeg failed: {detail}", stderr=result.stderr or "")


def called_process_to_ffmpeg_error(err: subprocess.CalledProcessError) -> FFmpegRenderError:
    stderr = ""
    if err.stderr:
        stderr = err.stderr if isinstance(err.stderr, str) else err.stderr.decode("utf-8", "replace")
    elif err.output:
        stderr = err.output if isinstance(err.output, str) else err.output.decode("utf-8", "replace")
    return FFmpegRenderError(f"ffmpeg failed: {tail_stderr(stderr)}", stderr=stderr)


def probe_duration_ms(media_path: Path) -> int | None:
    """Return duration in milliseconds (best-effort) using ffmpeg stderr."""
    try:
        result = run_ffmpeg(["-hide_banner", "-i", str(media_path)], check=False)
        text = result.stderr or ""
        marker = "Duration: "
        for line in text.splitlines():
            if marker not in line:
                continue
            part = line.split(marker, 1)[1].split(",", 1)[0].strip()
            hh, mm, rest = part.split(":")
            sec = float(rest)
            total = (int(hh) * 3600 + int(mm) * 60 + sec) * 1000.0
            return int(round(total))
    except Exception:
        return None
    return None
