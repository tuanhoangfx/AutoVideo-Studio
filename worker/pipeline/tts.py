"""TTS layer — edge-tts primary, gTTS fallback.

Edge-TTS cho word-level timestamps (WordBoundary) → align subtitle.
gTTS không có timestamps → đo duration bằng mutagen, ước lượng word offsets đều.
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from pathlib import Path

import edge_tts
from gtts import gTTS
from mutagen.mp3 import MP3

DEFAULT_VOICE = "vi-VN-HoaiMyNeural"


@dataclass
class TTSResult:
    audio_path: Path
    duration_ms: int
    words: list[dict] = field(default_factory=list)  # {text, offset_ms, duration_ms}
    provider: str = "edge"


async def _synth_edge(text: str, out_path: Path, voice: str, rate: str, volume: str) -> TTSResult:
    communicate = edge_tts.Communicate(text, voice, rate=rate, volume=volume)
    words: list[dict] = []
    total_ms = 0
    with open(out_path, "wb") as f:
        async for chunk in communicate.stream():
            t = chunk.get("type")
            if t == "audio":
                f.write(chunk["data"])
            elif t == "WordBoundary":
                offset_ms = chunk["offset"] // 10_000
                dur_ms = chunk["duration"] // 10_000
                words.append({"text": chunk["text"], "offset_ms": offset_ms, "duration_ms": dur_ms})
                total_ms = max(total_ms, offset_ms + dur_ms)
    # Fallback: edge-tts không luôn gửi WordBoundary (text ngắn / voice đặc biệt).
    # Đọc duration trực tiếp từ MP3 metadata.
    if total_ms == 0 and out_path.exists() and out_path.stat().st_size > 500:
        try:
            total_ms = int(MP3(str(out_path)).info.length * 1000)
        except Exception:
            pass
    # Nếu không có words timestamps, ước lượng đều theo độ dài text.
    if not words and total_ms > 0:
        tokens = text.split()
        if tokens:
            per = total_ms / len(tokens)
            words = [
                {"text": w, "offset_ms": int(i * per), "duration_ms": int(per)}
                for i, w in enumerate(tokens)
            ]
    return TTSResult(out_path, total_ms, words, provider="edge")


def _synth_gtts(text: str, out_path: Path) -> TTSResult:
    g = gTTS(text, lang="vi")
    g.save(str(out_path))
    audio = MP3(str(out_path))
    dur_ms = int(audio.info.length * 1000)
    # Ước lượng word offsets đều theo độ dài text
    tokens = text.split()
    if tokens:
        per = dur_ms / len(tokens)
        words = [
            {"text": w, "offset_ms": int(i * per), "duration_ms": int(per)}
            for i, w in enumerate(tokens)
        ]
    else:
        words = []
    return TTSResult(out_path, dur_ms, words, provider="gtts")


async def synthesize(
    text: str,
    out_path: Path,
    voice: str = DEFAULT_VOICE,
    rate: str = "+0%",
    volume: str = "+0%",
    prefer: str = "edge",  # "edge" | "gtts"
) -> TTSResult:
    """Try preferred provider, fallback to gtts on failure."""
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if prefer == "edge":
        try:
            return await _synth_edge(text, out_path, voice, rate, volume)
        except Exception as e:
            print(f"  [tts] edge failed ({type(e).__name__}: {e}); falling back to gTTS")
            # Clean partial file
            if out_path.exists():
                out_path.unlink()

    # gtts is sync — run in executor
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _synth_gtts, text, out_path)


def synthesize_sync(text: str, out_path: Path, **kwargs) -> TTSResult:
    return asyncio.run(synthesize(text, out_path, **kwargs))


async def list_vi_voices() -> list[dict]:
    try:
        voices = await edge_tts.list_voices()
        return [v for v in voices if v["Locale"].startswith("vi-")]
    except Exception:
        return [
            {"ShortName": "gtts-vi", "Locale": "vi-VN", "Gender": "Female", "FriendlyName": "Google TTS (fallback)"}
        ]
