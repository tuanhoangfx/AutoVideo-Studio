"""Subtitle generation — SRT (line-based) + ASS (word-by-word CapCut style).

Word timestamps đã có sẵn từ edge-tts WordBoundary (xem tts.py).
Mỗi scene = 1 TTSResult với list words [{text, offset_ms, duration_ms}].
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class SceneCaption:
    text: str
    start_ms: int     # offset từ đầu video tổng
    duration_ms: int  # đã có từ TTSResult.duration_ms
    words: list[dict] # local-offset (0 = start of this scene)


def _fmt_srt_time(ms: int) -> str:
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1_000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def _fmt_ass_time(ms: int) -> str:
    # ASS format: H:MM:SS.cc (centiseconds)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1_000)
    cs = ms // 10
    return f"{h:d}:{m:02}:{s:02}.{cs:02}"


# ─────────────────────────────────────────────────── SRT (line per scene)
def write_srt(scenes: list[SceneCaption], out_path: Path) -> Path:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []
    for i, sc in enumerate(scenes, start=1):
        end_ms = sc.start_ms + sc.duration_ms
        lines.append(str(i))
        lines.append(f"{_fmt_srt_time(sc.start_ms)} --> {_fmt_srt_time(end_ms)}")
        lines.append(sc.text)
        lines.append("")
    out_path.write_text("\n".join(lines), encoding="utf-8")
    return out_path


# ─────────────────────────────────────────────────── ASS — CapCut word-by-word
# Mỗi dòng = 1 từ, hiện big bold trong khoảng từ đang nói.
# Style: white text + black outline + drop shadow, vertical center bottom.
ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Word,Inter,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,4,2,2,40,40,180,1
Style: WordHL,Inter,84,&H0000F5FF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,4,2,2,40,40,180,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def write_ass_words(scenes: list[SceneCaption], out_path: Path, *, capcut_pop: bool = True) -> Path:
    """ASS subtitle with CapCut-style: 1 từ hiện lớn tại 1 thời điểm, có pop scale.

    Args:
        capcut_pop: True = scale-in animation mỗi từ (\\t cubic)
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)
    events: list[str] = []

    for sc in scenes:
        for w in sc.words:
            local_off = int(w["offset_ms"])
            local_dur = max(80, int(w["duration_ms"]))  # min 80ms để thấy được
            global_start = sc.start_ms + local_off
            global_end = sc.start_ms + local_off + local_dur
            text = str(w["text"]).strip().replace("\n", " ")
            if not text:
                continue
            # ASS line: pop-in scale 60% → 110% then settle to 100%
            if capcut_pop:
                anim = (
                    r"{\fscx60\fscy60"
                    r"\t(0,80,\fscx110\fscy110)"
                    r"\t(80,160,\fscx100\fscy100)}"
                )
            else:
                anim = ""
            events.append(
                f"Dialogue: 0,{_fmt_ass_time(global_start)},{_fmt_ass_time(global_end)},"
                f"WordHL,,0,0,0,,{anim}{text}"
            )

    out_path.write_text(ASS_HEADER + "\n".join(events), encoding="utf-8")
    return out_path


# ─────────────────────────────────────────────────── ASS — line per scene
def write_ass_lines(scenes: list[SceneCaption], out_path: Path) -> Path:
    """ASS subtitle 1 line per scene — đơn giản, classic style."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    events: list[str] = []
    for sc in scenes:
        end_ms = sc.start_ms + sc.duration_ms
        text = sc.text.replace("\n", "\\N")
        events.append(
            f"Dialogue: 0,{_fmt_ass_time(sc.start_ms)},{_fmt_ass_time(end_ms)},"
            f"Word,,0,0,0,,{text}"
        )
    out_path.write_text(ASS_HEADER + "\n".join(events), encoding="utf-8")
    return out_path
