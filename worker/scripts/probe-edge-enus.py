import asyncio
import json

import edge_tts


async def main() -> None:
    voices = await edge_tts.list_voices()
    en_us = sorted(v["ShortName"] for v in voices if v.get("ShortName", "").startswith("en-US-"))
    print("en-US count", len(en_us))
    suspects = [
        "en-US-AmberNeural",
        "en-US-AshleyNeural",
        "en-US-BrandonNeural",
        "en-US-CoraNeural",
        "en-US-JennyNeural",
        "en-US-AriaNeural",
        "en-US-GuyNeural",
    ]
    live = set(en_us)
    for s in suspects:
        print(s, "LIVE" if s in live else "MISSING")
    missing = [s for s in suspects if s not in live]
    if missing:
        print("missing_json", json.dumps(missing))


if __name__ == "__main__":
    asyncio.run(main())
