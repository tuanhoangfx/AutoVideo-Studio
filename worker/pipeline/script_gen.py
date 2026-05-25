"""Script generation — match câu thoại tới ảnh.

Two modes:
  - Gemini Flash (if GEMINI_API_KEY env var set) — high quality
  - Template fallback — works offline, no API key required
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Iterable


@dataclass
class ScriptScene:
    index: int
    text: str
    image_filename: str


SYSTEM_PROMPT = """Bạn là biên kịch video ngắn. Viết LỜI THOẠI tiếng Việt cho video về chủ đề người dùng đưa,
khớp với {n} ảnh người dùng đã upload (cùng thứ tự). Mỗi câu thoại 8-20 từ, tự nhiên, hấp dẫn.
Trả về CHÍNH XÁC {n} dòng, mỗi dòng = 1 câu thoại cho ảnh tương ứng, KHÔNG đánh số."""


def gen_with_gemini(topic: str, image_filenames: list[str], api_key: str) -> list[ScriptScene] | None:
    """Try Gemini Flash. Returns None on any failure → caller falls back to template."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            f"{SYSTEM_PROMPT.format(n=len(image_filenames))}\n\n"
            f"Chủ đề: {topic}\n\n"
            f"Danh sách ảnh:\n"
            + "\n".join(f"  {i + 1}. {fn}" for i, fn in enumerate(image_filenames))
        )
        resp = model.generate_content(prompt)
        lines = [ln.strip() for ln in resp.text.splitlines() if ln.strip()]
        # Strip any "1. ", "1) ", "- " leading garbage if model disobeyed.
        cleaned: list[str] = []
        for ln in lines:
            for prefix_len in (3, 2, 1):
                if len(ln) > prefix_len and ln[prefix_len - 1] in ".):-" and ln[:prefix_len - 1].isdigit():
                    ln = ln[prefix_len:].strip()
                    break
            cleaned.append(ln)
        if len(cleaned) != len(image_filenames):
            return None
        return [
            ScriptScene(index=i + 1, text=t, image_filename=fn)
            for i, (t, fn) in enumerate(zip(cleaned, image_filenames))
        ]
    except Exception:
        return None


def gen_with_template(topic: str, image_filenames: list[str]) -> list[ScriptScene]:
    """Offline fallback — produces deterministic, useable (if generic) script.

    Strategy: hook → body lines numbered → call-to-action close.
    """
    n = len(image_filenames)
    if n == 0:
        return []
    if n == 1:
        return [ScriptScene(1, f"Hôm nay, cùng tìm hiểu về: {topic}.", image_filenames[0])]

    scenes: list[ScriptScene] = []
    # Hook
    scenes.append(ScriptScene(1, f"Hôm nay, cùng khám phá: {topic}.", image_filenames[0]))
    # Body
    body_count = n - 2 if n >= 3 else n - 1
    for i in range(body_count):
        idx = i + 2
        scenes.append(ScriptScene(
            idx,
            f"Điểm thứ {i + 1}: bức ảnh này thể hiện một khía cạnh quan trọng — hãy chú ý chi tiết.",
            image_filenames[idx - 1],
        ))
    # Close (if room)
    if n >= 3:
        scenes.append(ScriptScene(
            n,
            "Hy vọng bạn thấy nội dung hữu ích. Đừng quên like và theo dõi để xem thêm.",
            image_filenames[n - 1],
        ))
    return scenes


def generate(topic: str, image_filenames: list[str]) -> tuple[list[ScriptScene], str]:
    """Try Gemini, fall back to template. Returns (scenes, mode_used)."""
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if key:
        result = gen_with_gemini(topic, image_filenames, key)
        if result is not None:
            return result, "gemini-1.5-flash"
    return gen_with_template(topic, image_filenames), "template"


if __name__ == "__main__":
    # Smoke test: python -m pipeline.script_gen
    scenes, mode = generate(
        topic="5 mẹo code nhanh hơn với AI",
        image_filenames=[f"IMG_{4820 + i}.jpg" for i in range(6)],
    )
    print(f"Mode: {mode}")
    for s in scenes:
        print(f"  {s.index}. [{s.image_filename}] {s.text}")
