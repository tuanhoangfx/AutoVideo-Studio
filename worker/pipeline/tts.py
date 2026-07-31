"""TTS — P0021 product shim. SSOT: packages/video-pipeline-core."""
from __future__ import annotations

from video_pipeline_core import tts as _core

DEFAULT_VOICE = "en-US-JennyNeural"

TTSResult = _core.TTSResult
SUPPORTED_VOICES = _core.SUPPORTED_VOICES
synthesize = _core.synthesize
synthesize_sync = _core.synthesize_sync
list_vi_voices = _core.list_vi_voices

__all__ = [
    "DEFAULT_VOICE",
    "TTSResult",
    "SUPPORTED_VOICES",
    "synthesize",
    "synthesize_sync",
    "list_vi_voices",
]
