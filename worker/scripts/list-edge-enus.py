import asyncio

import edge_tts


async def main() -> None:
    voices = await edge_tts.list_voices()
    for item in sorted(voices, key=lambda v: v["ShortName"]):
        short = item["ShortName"]
        if short.startswith("en-US-"):
            print(f"{short}\t{item.get('Gender')}\t{item.get('FriendlyName')}")


if __name__ == "__main__":
    asyncio.run(main())
