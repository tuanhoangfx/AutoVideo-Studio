"""Output storage adapters for rendered video files.

Local disk remains the default. Supabase Storage can be enabled with env vars
on the worker without changing the frontend deployment.
"""
from __future__ import annotations

import mimetypes
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


def storage_status() -> dict[str, object]:
    backend = _backend()
    if backend == "supabase":
        missing = [
            name
            for name in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET")
            if not os.getenv(name)
        ]
        return {
            "backend": "supabase",
            "ready": not missing,
            "bucket": os.getenv("SUPABASE_STORAGE_BUCKET") or "",
            "prefix": _prefix(),
            "missing": missing,
        }
    return {"backend": "local", "ready": True, "bucket": "", "prefix": "", "missing": []}


def publish_output(job_id: str, out_path: Path) -> str | None:
    """Upload output to configured cloud storage and return a public URL.

    Returning None tells the caller to keep using the worker's local download
    endpoint. Upload failures should not turn a completed render into a failed
    render; the local output remains available.
    """
    if _backend() != "supabase":
        return None
    if not storage_status()["ready"]:
        return None
    try:
        return _upload_to_supabase(job_id, out_path)
    except (HTTPError, URLError, OSError) as error:
        print(f"  [storage] Supabase upload failed, using local output: {error}")
        return None


def _upload_to_supabase(job_id: str, out_path: Path) -> str:
    supabase_url = (os.environ["SUPABASE_URL"]).rstrip("/")
    token = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    bucket = os.environ["SUPABASE_STORAGE_BUCKET"]
    object_path = f"{_prefix()}/{job_id}/{out_path.name}".strip("/")
    upload_url = f"{supabase_url}/storage/v1/object/{quote(bucket)}/{quote(object_path)}"
    content_type = mimetypes.guess_type(out_path.name)[0] or "application/octet-stream"

    request = Request(
        upload_url,
        data=out_path.read_bytes(),
        method="POST",
        headers={
            "apikey": token,
            "Authorization": f"Bearer {token}",
            "Content-Type": content_type,
            "cache-control": "3600",
            "x-upsert": "true",
        },
    )
    with urlopen(request, timeout=120) as response:
        if response.status >= 400:
            raise RuntimeError(f"Supabase upload failed with status {response.status}")

    public_base = os.getenv("SUPABASE_STORAGE_PUBLIC_URL")
    if public_base:
        return f"{public_base.rstrip('/')}/{quote(object_path)}"
    return f"{supabase_url}/storage/v1/object/public/{quote(bucket)}/{quote(object_path)}"


def _backend() -> str:
    return (os.getenv("P0021_STORAGE_BACKEND") or "local").strip().lower()


def _prefix() -> str:
    return (os.getenv("SUPABASE_STORAGE_PREFIX") or "p0021-exports").strip("/")
