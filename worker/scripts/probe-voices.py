import asyncio
import hashlib
import tempfile
from pathlib import Path

from pipeline.tts import synthesize

VOICES = [
    ("Amber", "en-US-AmberNeural"),
    ("Ashley", "en-US-AshleyNeural"),
    ("Brandon", "en-US-BrandonNeural"),
    ("Cora", "en-US-CoraNeural"),
]


async def main() -> None:
    for name, voice_id in VOICES:
        text = f"Hello, I'm {name}. This is a voice preview in AutoVideo Studio."
        out = Path(tempfile.gettempdir()) / f"p0021-voice-{name}.mp3"
        result = await synthesize(text, out, voice=voice_id, rate="+0%")
        data = out.read_bytes()
        digest = hashlib.sha256(data).hexdigest()[:16]
        print(f"{name}\t{voice_id}\tprovider={result.provider}\tbytes={len(data)}\tsha={digest}")


if __name__ == "__main__":
    asyncio.run(main())
