import asyncio
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[2]
VOICE_OPTIONS = ROOT / "app" / "src" / "lib" / "voice-options.ts"


def parse_ids(source: str) -> list[str]:
    ids: list[str] = []
    for line in source.splitlines():
        line = line.strip()
        if line.startswith("{ id: '"):
            start = line.index("id: '") + 5
            end = line.index("'", start)
            ids.append(line[start:end])
    return ids


async def main() -> None:
    catalog = await edge_tts.list_voices()
    live = {v["ShortName"] for v in catalog}
    by_short = {v["ShortName"]: v for v in catalog}
    ids = parse_ids(VOICE_OPTIONS.read_text(encoding="utf-8"))
    missing = [voice_id for voice_id in ids if voice_id not in live]
    print("missing", len(missing))
    for voice_id in missing:
        locale = "-".join(voice_id.split("-")[:2])
        replacements = [
            v["ShortName"]
            for v in catalog
            if v["ShortName"].startswith(locale + "-")
        ]
        print(voice_id, "-> candidates", replacements[:5])


if __name__ == "__main__":
    asyncio.run(main())
