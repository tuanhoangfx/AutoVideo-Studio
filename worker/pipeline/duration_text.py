"""Always align TTS workload with each scene's export duration_ms (no user toggle)."""
from __future__ import annotations


def chars_per_second_for_rate(rate: str = "+0%") -> float:
    """Rough neural-TTS throughput for planning and trim."""
    base = 13.5
    rate = (rate or "+0%").strip()
    try:
        if rate.endswith("%"):
            pct = int(rate.replace("%", "").replace("+", "").replace("-", ""))
            if rate.startswith("-"):
                base *= max(0.5, 1 - pct / 100)
            else:
                base *= 1 + pct / 100
    except ValueError:
        pass
    return max(8.0, base)


def max_chars_for_duration(target_ms: int, rate: str = "+0%") -> int:
    sec = max(0.5, target_ms / 1000.0)
    return max(40, int(sec * chars_per_second_for_rate(rate)))


def trim_text_for_duration(text: str, target_ms: int, rate: str = "+0%") -> str:
    """Keep TTS workload aligned with the timeline slot."""
    cleaned = (text or "").strip()
    if not cleaned:
        return cleaned
    limit = max_chars_for_duration(target_ms, rate)
    if len(cleaned) <= limit:
        return cleaned
    snippet = cleaned[:limit]
    if " " in snippet:
        snippet = snippet.rsplit(" ", 1)[0]
    return snippet.rstrip(".,;:- ") + "…"


def effective_tts_char_count(scenes: list, rate: str = "+0%") -> int:
    """Total chars we expect Edge-TTS to speak (after trim)."""
    total = 0
    for sc in scenes:
        target_ms = max(500, getattr(sc, "duration_ms", None) or 5000)
        text = (getattr(sc, "text", None) or "").strip()
        if not text:
            continue
        limit = max_chars_for_duration(target_ms, rate)
        total += min(len(text), limit)
    return total
