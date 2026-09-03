import asyncio

import edge_tts

VOICES = ["en-US-AmberNeural", "en-US-AshleyNeural", "en-US-BrandonNeural", "en-US-CoraNeural"]


async def main() -> None:
    for voice in VOICES:
        communicate = edge_tts.Communicate("Hello, this is an edge test.", voice)
        audio_bytes = 0
        try:
            async for chunk in communicate.stream():
                if chunk.get("type") == "audio":
                    audio_bytes += len(chunk.get("data") or b"")
            print(f"{voice}\tok\tbytes={audio_bytes}")
        except Exception as exc:
            print(f"{voice}\tfail\t{type(exc).__name__}: {exc}")


if __name__ == "__main__":
    asyncio.run(main())
