"""TTS — P0021 product shim. SSOT: packages/video-pipeline-core."""
from __future__ import annotations

import json
from pathlib import Path

from video_pipeline_core import tts as _core

DEFAULT_VOICE = "en-US-JennyNeural"

TTSResult = _core.TTSResult
SUPPORTED_VOICES = _core.SUPPORTED_VOICES
synthesize = _core.synthesize
synthesize_sync = _core.synthesize_sync

_BUNDLED_CATALOG_PATH = Path(__file__).resolve().parents[1] / "data" / "edge-voices-catalog.json"
_bundled_catalog: list[dict] | None = None


def _bundled_edge_catalog() -> list[dict]:
    global _bundled_catalog
    if _bundled_catalog is not None:
        return _bundled_catalog
    if _BUNDLED_CATALOG_PATH.exists():
        payload = json.loads(_BUNDLED_CATALOG_PATH.read_text(encoding="utf-8"))
        if isinstance(payload, list) and payload:
            _bundled_catalog = payload
            return _bundled_catalog
    _bundled_catalog = list(_core.SUPPORTED_VOICES)
    return _bundled_catalog


async def list_vi_voices() -> list[dict]:
    """Live edge catalog; bundled 322-voice JSON when edge is unreachable in worker."""
    try:
        import edge_tts

        voices = await edge_tts.list_voices()
        neural = [v for v in voices if str(v.get("ShortName", "")).endswith("Neural")]
        if neural:
            return sorted(neural, key=_core._voice_sort_key)
    except Exception as exc:
        print(f"  [tts] list_voices edge failed ({type(exc).__name__}: {exc}); using bundled catalog")

    bundled = _bundled_edge_catalog()
    return sorted(bundled, key=_core._voice_sort_key)


__all__ = [
    "DEFAULT_VOICE",
    "TTSResult",
    "SUPPORTED_VOICES",
    "synthesize",
    "synthesize_sync",
    "list_vi_voices",
]
