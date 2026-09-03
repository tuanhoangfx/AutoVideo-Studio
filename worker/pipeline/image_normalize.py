"""Normalize uploaded stills to ffmpeg-safe JPEG (no .ico/.svg/.bmp edge cases)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, UnidentifiedImageError

RASTER_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}


def normalize_job_image(src: Path) -> Path:
    """Return a raster path ffmpeg can read with `-loop 1` (always `.jpg` when converted)."""
    ext = src.suffix.lower()
    if ext in RASTER_SUFFIXES and ext not in {".ico"}:
        try:
            with Image.open(src) as im:
                im.verify()
            # Re-open after verify — Pillow requires it for subsequent load/save.
            with Image.open(src) as im:
                if im.mode in ("RGB", "L") and ext in {".jpg", ".jpeg", ".png", ".webp"}:
                    return src
        except (UnidentifiedImageError, OSError):
            pass

    dest = src.with_suffix(".jpg")
    with Image.open(src) as im:
        rgb = im.convert("RGB")
        rgb.save(dest, "JPEG", quality=92, optimize=True)
    if dest.resolve() != src.resolve() and src.exists():
        src.unlink(missing_ok=True)
    return dest
