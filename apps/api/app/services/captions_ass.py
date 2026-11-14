"""
Pure helper module to convert ClipForge AI Phase 6B edit_json captions into ASS subtitle format.
"""

from __future__ import annotations
import math
from typing import Any


def _format_ass_time(seconds: float) -> str:
    """Format seconds into ASS timestamp format: H:MM:SS.cs"""
    clamped = max(0.0, seconds)
    hrs = int(clamped // 3600)
    mins = int((clamped % 3600) // 60)
    secs = int(clamped % 60)
    cs = int(round((clamped - int(clamped)) * 100))
    if cs >= 100:
        secs += 1
        cs -= 100
    return f"{hrs}:{mins:02d}:{secs:02d}.{cs:02d}"


def _hex_to_ass_color(hex_color: str, default: str = "&H00FFFFFF") -> str:
    """Convert CSS hex color (#RRGGBB or #RGB) to ASS color format (&H00BBGGRR)."""
    if not hex_color or not isinstance(hex_color, str):
        return default
    c = hex_color.strip().lstrip("#")
    if len(c) == 3:
        c = "".join(ch * 2 for ch in c)
    if len(c) == 6:
        r, g, b = c[0:2], c[2:4], c[4:6]
        return f"&H00{b}{g}{r}".upper()
    if len(c) == 8:
        r, g, b, a = c[0:2], c[2:4], c[4:6], c[6:8]
        return f"&H{a}{b}{g}{r}".upper()
    return default


def captions_to_ass(edit_json: dict[str, Any]) -> str:
    """
    Converts caption words from edit_json into an ASS subtitle file string.
    - Applies trim.in offset to all word timings.
    - Groups words by words_per_line.
    - Implements karaoke styling (primary text color vs highlight color).
    - Respects safe zones (~20% margin bottom on 1080x1920) and positions (top, middle, lower_third).
    """
    trim_in = float(edit_json.get("trim", {}).get("in", 0.0) or 0.0)
    trim_out = float(edit_json.get("trim", {}).get("out", 60.0) or 60.0)

    captions_data = edit_json.get("captions", {})
    if not captions_data.get("enabled", True):
        return ""

    raw_words = captions_data.get("words", [])
    if not raw_words:
        return ""

    style_cfg = captions_data.get("style", {})
    if not isinstance(style_cfg, dict):
        style_cfg = {}

    font = style_cfg.get("font", "Noto Sans") or "Noto Sans"
    base_size = int(style_cfg.get("size", 42) or 42)
    # Scale font size relative to 1080x1920 PlayRes
    font_size = int(base_size * 1.5)

    color_ass = _hex_to_ass_color(style_cfg.get("color", "#FFFFFF"), "&H00FFFFFF")
    highlight_ass = _hex_to_ass_color(style_cfg.get("highlight_color", "#FFD700"), "&H0000D7FF")
    outline_ass = _hex_to_ass_color(style_cfg.get("outline_color", "#000000"), "&H00000000")
    outline_width = int(style_cfg.get("outline_width", 3) or 3)
    has_box = bool(style_cfg.get("box", False))
    box_color_ass = _hex_to_ass_color(style_cfg.get("box_color", "#00000088"), "&H80000000")
    border_style = 3 if has_box else 1  # 3 = opaque box, 1 = outline + shadow

    words_per_line = max(1, min(4, int(style_cfg.get("words_per_line", 3) or 3)))
    position = style_cfg.get("position", "lower_third")
    safe_zones = captions_data.get("safe_zones", True)
    y_offset = int(style_cfg.get("y_offset", 0) or 0)

    # Position & Margins
    # On 1080x1920:
    # lower_third: alignment 2 (bottom center), margin bottom 20% = 384px + y_offset
    # middle: alignment 5 (center)
    # top: alignment 8 (top center), margin top = 200px + y_offset
    if position == "top":
        alignment = 8
        margin_v = max(100, 200 + y_offset)
    elif position == "middle":
        alignment = 5
        margin_v = max(50, 50 + y_offset)
    else:  # lower_third
        alignment = 2
        margin_v = max(380 if safe_zones else 120, (380 if safe_zones else 120) + y_offset)

    margin_lr = 140 if safe_zones else 40

    ass_header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font},{font_size},{color_ass},{highlight_ass},{outline_ass},{box_color_ass},-1,0,0,0,100,100,0,0,{border_style},{outline_width},2,{alignment},{margin_lr},{margin_lr},{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    dialogue_lines: list[str] = []

    # Filter words within trim range and shift times by trim_in
    shifted_words = []
    for w in raw_words:
        w_start = float(w.get("start", 0.0))
        w_end = float(w.get("end", w_start + 0.3))
        text = str(w.get("text", "")).strip()
        if not text:
            continue
        # Include words overlapping with [trim_in, trim_out]
        if w_end < trim_in or w_start > trim_out:
            continue
        rel_start = max(0.0, w_start - trim_in)
        rel_end = max(0.0, w_end - trim_in)
        shifted_words.append({"text": text, "start": rel_start, "end": rel_end})

    if not shifted_words:
        return ass_header

    # Group into chunks of words_per_line
    for i in range(0, len(shifted_words), words_per_line):
        chunk = shifted_words[i : i + words_per_line]
        chunk_start = chunk[0]["start"]
        chunk_end = chunk[-1]["end"]

        # For karaoke highlight effect, generate a dialogue line per active word or with \k tags
        # Clean dialogue event for each word activation in chunk
        for active_idx, active_word in enumerate(chunk):
            word_start = active_word["start"]
            # Active word runs until next word starts or chunk ends
            if active_idx < len(chunk) - 1:
                word_end = chunk[active_idx + 1]["start"]
            else:
                word_end = chunk_end

            if word_end <= word_start:
                word_end = word_start + 0.2

            # Render phrase with active word highlighted
            parts = []
            for w_idx, w in enumerate(chunk):
                if w_idx == active_idx:
                    # Highlight color
                    parts.append(f"{{\\c{highlight_ass}}}{w['text']}{{\\c{color_ass}}}")
                else:
                    parts.append(w["text"])

            line_text = " ".join(parts)
            start_str = _format_ass_time(word_start)
            end_str = _format_ass_time(word_end)
            dialogue_lines.append(
                f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{line_text}"
            )

    return ass_header + "\n".join(dialogue_lines) + "\n"
