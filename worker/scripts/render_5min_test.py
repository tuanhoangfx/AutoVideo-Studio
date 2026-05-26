from __future__ import annotations

import json
import mimetypes
import os
import sys
import time
import urllib.request
import uuid
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "storage" / "test-assets" / "render-5min"
WORKER_URL = os.environ.get("P0021_WORKER_URL", "http://127.0.0.1:8021").rstrip("/")

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def make_assets() -> list[Path]:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    colors = [(24, 36, 82), (60, 32, 96), (20, 96, 120), (110, 52, 70)]
    paths: list[Path] = []
    for index, color in enumerate(colors, 1):
        path = ASSET_DIR / f"scene_{index}.jpg"
        image = Image.new("RGB", (1280, 720), color)
        draw = ImageDraw.Draw(image)
        draw.text((64, 64), f"5 minute render test scene {index}", fill="white")
        image.save(path, "JPEG", quality=88)
        paths.append(path)
    return paths


def multipart(fields: dict[str, str], files: list[Path]) -> tuple[bytes, str]:
    boundary = "----p0021" + uuid.uuid4().hex
    parts: list[bytes] = []
    for name, value in fields.items():
        parts.append(
            (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
                f"{value}\r\n"
            ).encode()
        )
    for path in files:
        ctype = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        parts.append(
            (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="files"; filename="{path.name}"\r\n'
                f"Content-Type: {ctype}\r\n\r\n"
            ).encode()
        )
        parts.append(path.read_bytes())
        parts.append(b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), boundary


def api_json(path: str) -> dict:
    with urllib.request.urlopen(f"{WORKER_URL}{path}", timeout=10) as response:
        return json.loads(response.read().decode())


def main() -> int:
    files = make_assets()
    scenes = [
        {
            "text": "",
            "image_index": index,
            "duration_ms": 75_000,
            "effect": "none",
            "transition": "fade",
        }
        for index in range(4)
    ]
    config = {
        "aspect": "16:9",
        "voice": "vi-VN-HoaiMyNeural",
        "fps": 24,
        "resolution": "720p",
        "video_quality": "low",
        "output_format": "mp4",
        "rate": "+0%",
        "tts_provider": "edge",
        "subtitle_style": "off",
        "bgm_volume": 0.18,
    }
    body, boundary = multipart({"scenes": json.dumps(scenes), "config": json.dumps(config)}, files)
    request = urllib.request.Request(
        f"{WORKER_URL}/jobs",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        job = json.loads(response.read().decode())
    job_id = job["id"]
    print(f"job_id={job_id}")

    deadline = time.time() + 600
    while time.time() < deadline:
        job = api_json(f"/jobs/{job_id}")
        print(f"{job['status']} {job['progress']}% {job.get('message') or ''}")
        if job["status"] in {"done", "error"}:
            break
        time.sleep(5)

    if job["status"] != "done":
        print(json.dumps(job, ensure_ascii=False, indent=2))
        return 1

    output_path = ROOT / "storage" / "jobs" / job_id / "output.mp4"
    manifest_path = ROOT / "storage" / "jobs" / job_id / "manifest.json"
    print(f"output={output_path}")
    print(f"size_bytes={output_path.stat().st_size}")
    print(manifest_path.read_text(encoding="utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
