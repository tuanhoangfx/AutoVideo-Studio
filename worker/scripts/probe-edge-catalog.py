import asyncio

import edge_tts


async def main() -> None:
    voices = await edge_tts.list_voices()
    targets = {v["ShortName"] for v in voices if v["ShortName"] in {
        "en-US-AmberNeural", "en-US-BrandonNeural", "en-US-JennyNeural"
    }}
    print("catalog_has", sorted(targets))
    for voice in ["en-US-JennyNeural", "en-US-AmberNeural", "en-US-BrandonNeural"]:
        communicate = edge_tts.Communicate("Hello.", voice)
        n = 0
        try:
            async for chunk in communicate.stream():
                if chunk.get("type") == "audio":
                    n += len(chunk.get("data") or b"")
            print(voice, "bytes", n)
        except Exception as exc:
            print(voice, "ERR", type(exc).__name__, exc)


if __name__ == "__main__":
    asyncio.run(main())
