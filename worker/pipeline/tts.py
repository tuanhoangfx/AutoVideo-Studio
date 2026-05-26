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

SUPPORTED_VOICES = [
    {"ShortName": "vi-VN-HoaiMyNeural", "Locale": "vi-VN", "Gender": "Female", "FriendlyName": "Hoai My"},
    {"ShortName": "vi-VN-NamMinhNeural", "Locale": "vi-VN", "Gender": "Male", "FriendlyName": "Nam Minh"},
    {"ShortName": "en-US-AriaNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Aria"},
    {"ShortName": "en-US-JennyNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Jenny"},
    {"ShortName": "en-US-GuyNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Guy"},
    {"ShortName": "en-US-DavisNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Davis"},
    {"ShortName": "en-US-JaneNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Jane"},
    {"ShortName": "en-US-JasonNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Jason"},
    {"ShortName": "en-US-NancyNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Nancy"},
    {"ShortName": "en-US-SaraNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Sara"},
    {"ShortName": "en-US-TonyNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Tony"},
    {"ShortName": "en-US-AmberNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Amber"},
    {"ShortName": "en-US-AnaNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Ana"},
    {"ShortName": "en-US-AshleyNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Ashley"},
    {"ShortName": "en-US-BrandonNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Brandon"},
    {"ShortName": "en-US-ChristopherNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Christopher"},
    {"ShortName": "en-US-CoraNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Cora"},
    {"ShortName": "en-US-ElizabethNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Elizabeth"},
    {"ShortName": "en-US-EricNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Eric"},
    {"ShortName": "en-US-JacobNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Jacob"},
    {"ShortName": "en-US-MichelleNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Michelle"},
    {"ShortName": "en-US-MonicaNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Monica"},
    {"ShortName": "en-US-RogerNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Roger"},
    {"ShortName": "en-US-SteffanNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Steffan"},
    {"ShortName": "en-GB-LibbyNeural", "Locale": "en-GB", "Gender": "Female", "FriendlyName": "Libby"},
    {"ShortName": "en-GB-MaisieNeural", "Locale": "en-GB", "Gender": "Female", "FriendlyName": "Maisie"},
    {"ShortName": "en-GB-RyanNeural", "Locale": "en-GB", "Gender": "Male", "FriendlyName": "Ryan"},
    {"ShortName": "en-GB-SoniaNeural", "Locale": "en-GB", "Gender": "Female", "FriendlyName": "Sonia"},
    {"ShortName": "en-GB-ThomasNeural", "Locale": "en-GB", "Gender": "Male", "FriendlyName": "Thomas"},
    {"ShortName": "en-AU-NatashaNeural", "Locale": "en-AU", "Gender": "Female", "FriendlyName": "Natasha"},
    {"ShortName": "en-AU-WilliamNeural", "Locale": "en-AU", "Gender": "Male", "FriendlyName": "William"},
    {"ShortName": "en-CA-ClaraNeural", "Locale": "en-CA", "Gender": "Female", "FriendlyName": "Clara"},
    {"ShortName": "en-CA-LiamNeural", "Locale": "en-CA", "Gender": "Male", "FriendlyName": "Liam"},
    {"ShortName": "en-IN-NeerjaNeural", "Locale": "en-IN", "Gender": "Female", "FriendlyName": "Neerja"},
    {"ShortName": "en-IN-PrabhatNeural", "Locale": "en-IN", "Gender": "Male", "FriendlyName": "Prabhat"},
    {"ShortName": "en-IE-ConnorNeural", "Locale": "en-IE", "Gender": "Male", "FriendlyName": "Connor"},
    {"ShortName": "en-IE-EmilyNeural", "Locale": "en-IE", "Gender": "Female", "FriendlyName": "Emily"},
    {"ShortName": "en-NZ-MitchellNeural", "Locale": "en-NZ", "Gender": "Male", "FriendlyName": "Mitchell"},
    {"ShortName": "en-NZ-MollyNeural", "Locale": "en-NZ", "Gender": "Female", "FriendlyName": "Molly"},
    {"ShortName": "en-ZA-LeahNeural", "Locale": "en-ZA", "Gender": "Female", "FriendlyName": "Leah"},
    {"ShortName": "en-ZA-LukeNeural", "Locale": "en-ZA", "Gender": "Male", "FriendlyName": "Luke"},
    {"ShortName": "en-HK-SamNeural", "Locale": "en-HK", "Gender": "Male", "FriendlyName": "Sam"},
    {"ShortName": "en-HK-YanNeural", "Locale": "en-HK", "Gender": "Female", "FriendlyName": "Yan"},
    {"ShortName": "en-SG-LunaNeural", "Locale": "en-SG", "Gender": "Female", "FriendlyName": "Luna"},
    {"ShortName": "en-SG-WayneNeural", "Locale": "en-SG", "Gender": "Male", "FriendlyName": "Wayne"},
    {"ShortName": "en-PH-JamesNeural", "Locale": "en-PH", "Gender": "Male", "FriendlyName": "James"},
    {"ShortName": "en-PH-RosaNeural", "Locale": "en-PH", "Gender": "Female", "FriendlyName": "Rosa"},
    {"ShortName": "ja-JP-NanamiNeural", "Locale": "ja-JP", "Gender": "Female", "FriendlyName": "Nanami"},
    {"ShortName": "ja-JP-KeitaNeural", "Locale": "ja-JP", "Gender": "Male", "FriendlyName": "Keita"},
    {"ShortName": "ko-KR-SunHiNeural", "Locale": "ko-KR", "Gender": "Female", "FriendlyName": "SunHi"},
    {"ShortName": "ko-KR-InJoonNeural", "Locale": "ko-KR", "Gender": "Male", "FriendlyName": "InJoon"},
    {"ShortName": "zh-CN-XiaoxiaoNeural", "Locale": "zh-CN", "Gender": "Female", "FriendlyName": "Xiaoxiao"},
    {"ShortName": "zh-CN-YunxiNeural", "Locale": "zh-CN", "Gender": "Male", "FriendlyName": "Yunxi"},
    {"ShortName": "th-TH-PremwadeeNeural", "Locale": "th-TH", "Gender": "Female", "FriendlyName": "Premwadee"},
    {"ShortName": "id-ID-GadisNeural", "Locale": "id-ID", "Gender": "Female", "FriendlyName": "Gadis"},
]


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
    """Return curated voices supported by the Studio UI.

    The render path accepts any valid edge-tts voice. Keeping a curated list here
    avoids a slow network call just to populate voice options.
    """
    return SUPPORTED_VOICES
