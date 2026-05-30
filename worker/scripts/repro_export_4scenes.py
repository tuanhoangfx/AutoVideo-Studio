"""Reproduce desktop export: 4 scenes, 16:9, 60fps, static/none effect (like Image Library slideshow)."""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.runner import JobProgress, JobSpec, SceneSpec, run_job

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "storage" / "smoke_images"


def main() -> None:
    os.environ.setdefault("AUTOVIDEO_WORKER_STORAGE_ROOT", str(ROOT / "storage"))
    # Do NOT set AUTOVIDEO_VIDEO_ENCODER — should default to libx264 on Windows.

    images = [
        IMG_DIR / "scene1.jpg",
        IMG_DIR / "scene2.jpg",
        IMG_DIR / "scene3.jpg",
        IMG_DIR / "scene4.jpg",
    ]
    if not all(p.exists() for p in images[:3]):
        raise SystemExit("Run smoke_e2e.py first to create smoke_images")

    # 4th image: copy scene1 if only 3 exist
    if not images[3].exists():
        import shutil

        shutil.copy(images[0], images[3])

    spec = JobSpec(
        job_id=f"REPRO-4SC-{int(time.time())}",
        scenes=[
            SceneSpec(
                text="",
                image_path=str(images[i]),
                duration_ms=5000,
                effect="none",
                transition="slide_left",
            )
            for i in range(4)
        ],
        voice="vi-VN-HoaiMyNeural",
        aspect="16:9",
        fps=60,
        resolution="1080p",
        narration_text="Test narration for four scene export reproduction.",
    )

    def cb(p: JobProgress) -> None:
        print(f"  [{p.percent:3d}%] {p.step:8s} {p.message}")

    print("Encoder env:", os.getenv("AUTOVIDEO_VIDEO_ENCODER") or "(default win=libx264)")
    t0 = time.time()
    out, timing = run_job(spec, cb)
    print(f"\nOK {time.time() - t0:.1f}s -> {out} ({out.stat().st_size / 1024 / 1024:.2f} MB)")
    print("timing:", timing)


if __name__ == "__main__":
    main()
