from __future__ import annotations

import os
from pathlib import Path


def worker_storage_root() -> Path:
    root = os.getenv("AUTOVIDEO_WORKER_STORAGE_ROOT")
    if root:
        return Path(root).expanduser().resolve()
    return Path(__file__).resolve().parent.parent / "storage" / "jobs"


def worker_preview_root() -> Path:
    root = os.getenv("AUTOVIDEO_WORKER_PREVIEW_ROOT")
    if root:
        return Path(root).expanduser().resolve()
    return Path(__file__).resolve().parent.parent / "storage" / "preview"
