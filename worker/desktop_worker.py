from __future__ import annotations

import argparse
import os
import sys

import uvicorn


def _ensure_streams() -> None:
    # PyInstaller --noconsole + no stdio redirect: sys.stdout/stderr are None.
    # uvicorn's default formatter calls sys.stdout.isatty() -> AttributeError.
    for name in ("stdout", "stderr"):
        if getattr(sys, name) is None:
            setattr(sys, name, open(os.devnull, "w", encoding="utf-8"))


_ensure_streams()

from main import app  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="AutoVideo Studio desktop worker")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8021)
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()