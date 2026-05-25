"""Smoke test E2E: 3 ảnh dummy + script → MP4.

Chạy:
    cd worker && .venv/Scripts/python scripts/smoke_e2e.py
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from PIL import Image, ImageDraw, ImageFont

from pipeline.runner import JobProgress, JobSpec, SceneSpec, run_job

ROOT = Path(__file__).resolve().parent.parent
SMOKE_DIR = ROOT / "storage" / "smoke_images"
SMOKE_DIR.mkdir(parents=True, exist_ok=True)


def make_dummy_image(path: Path, text: str, color: tuple[int, int, int]):
    img = Image.new("RGB", (1920, 1080), color)
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 120)
    except OSError:
        font = ImageFont.load_default()
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((1920 - tw) / 2, (1080 - th) / 2), text, fill="white", font=font)
    img.save(path, "JPEG", quality=90)


def main():
    images = [
        (SMOKE_DIR / "scene1.jpg", "Cảnh 1", (220, 80, 80)),
        (SMOKE_DIR / "scene2.jpg", "Cảnh 2", (80, 140, 220)),
        (SMOKE_DIR / "scene3.jpg", "Cảnh 3", (60, 180, 120)),
    ]
    for p, t, c in images:
        if not p.exists():
            make_dummy_image(p, t, c)
            print(f"  + made {p.name}")

    spec = JobSpec(
        job_id=f"SMOKE-{int(time.time())}",
        scenes=[
            SceneSpec(text="Xin chào, đây là cảnh số một.", image_path=str(images[0][0])),
            SceneSpec(text="Tiếp theo là cảnh số hai, với hiệu ứng zoom.", image_path=str(images[1][0])),
            SceneSpec(text="Và cuối cùng là cảnh số ba. Cảm ơn bạn đã xem.", image_path=str(images[2][0])),
        ],
        voice="vi-VN-HoaiMyNeural",
        aspect="9:16",
        fps=30,
    )

    def cb(p: JobProgress):
        print(f"  [{p.percent:3d}%] {p.step:8s} {p.message}")

    t0 = time.time()
    out = run_job(spec, cb)
    dt = time.time() - t0
    size_mb = out.stat().st_size / 1024 / 1024
    print(f"\n✓ Done in {dt:.1f}s — {out} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
