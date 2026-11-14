"""
Pure export helper functions to generate FFmpeg filter graphs for audio mixing,
watermark overlays, and outro cards (Phase 6C).
"""

from __future__ import annotations
from typing import Any


def build_audio_filter(edit_json: dict[str, Any]) -> str:
    """
    Builds FFmpeg complex audio filter graph string.
    - Scales original video audio volume (0-200%).
    - If background music is present:
        - Scales music volume (0-100%).
        - Applies audio fade-in and fade-out.
        - Applies sidechain ducking or amix.
    """
    audio_cfg = edit_json.get("audio", {})
    orig_vol = max(0.0, min(2.0, float(audio_cfg.get("original_volume", 100)) / 100.0))

    trim = edit_json.get("trim", {})
    t_in = float(trim.get("in", 0.0) or 0.0)
    t_out = float(trim.get("out", 60.0) or 60.0)
    duration = max(1.0, t_out - t_in)

    music_cfg = audio_cfg.get("music", {})
    has_music = bool(music_cfg.get("asset_id"))

    if not has_music:
        return f"[0:a]volume={orig_vol:.2f}[aout]"

    music_vol = max(0.0, min(1.0, float(music_cfg.get("volume", 50)) / 100.0))
    fade_in = max(0.0, float(music_cfg.get("fade_in_s", 1.0)))
    fade_out = max(0.0, float(music_cfg.get("fade_out_s", 1.5)))
    fade_out_start = max(0.0, duration - fade_out)
    ducking = bool(music_cfg.get("duck_under_speech", True))

    bgm_filter = f"[1:a]volume={music_vol:.2f}"
    if fade_in > 0:
        bgm_filter += f",afade=t=in:ss=0:d={fade_in:.1f}"
    if fade_out > 0:
        bgm_filter += f",afade=t=out:st={fade_out_start:.1f}:d={fade_out:.1f}"
    bgm_filter += "[bgm]"

    main_filter = f"[0:a]volume={orig_vol:.2f}[maina]"

    if ducking:
        mix_filter = (
            f"[bgm][maina]sidechaincompress=threshold=0.125:ratio=4:attack=20:release=300[ducked];"
            f"[maina][ducked]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        )
    else:
        mix_filter = f"[maina][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"

    return f"{main_filter};{bgm_filter};{mix_filter}"


def build_overlay_filters(
    edit_json: dict[str, Any],
    video_w: int = 1080,
    video_h: int = 1920,
) -> tuple[list[str], str]:
    """
    Builds video overlay filters for watermark logo and outro card bumper.
    Returns:
        (filter_steps: list[str], final_output_label: str)
    """
    filter_steps: list[str] = []
    current_label = "[0:v]"

    # 1. Watermark Overlay
    wm = edit_json.get("watermark")
    if wm and wm.get("asset_id"):
        size_pct = max(5, min(40, int(wm.get("size_pct", 15)))) / 100.0
        opacity = max(10, min(100, int(wm.get("opacity", 85)))) / 100.0
        margin_pct = max(0, min(20, int(wm.get("margin_pct", 5)))) / 100.0
        position = str(wm.get("position", "tr")).lower()

        wm_w = int(video_w * size_pct)
        margin_x = int(video_w * margin_pct)
        margin_y = int(video_h * margin_pct)

        # Calculate coordinates
        if position == "tl":
            x_expr = str(margin_x)
            y_expr = str(margin_y)
        elif position == "bl":
            x_expr = str(margin_x)
            y_expr = f"main_h-overlay_h-{margin_y}"
        elif position == "br":
            x_expr = f"main_w-overlay_w-{margin_x}"
            y_expr = f"main_h-overlay_h-{margin_y}"
        else:  # tr
            x_expr = f"main_w-overlay_w-{margin_x}"
            y_expr = str(margin_y)

        # Filter string to format opacity, scale, and overlay
        wm_step = (
            f"[1:v]format=rgba,colorchannelmixer=aa={opacity:.2f},scale={wm_w}:-1[wm];"
            f"{current_label}[wm]overlay={x_expr}:{y_expr}:format=auto[v_wm]"
        )
        filter_steps.append(wm_step)
        current_label = "[v_wm]"

    # 2. Outro Card Bumper
    outro = edit_json.get("outro")
    if outro and outro.get("enabled"):
        duration_s = max(1, min(5, int(outro.get("duration_s", 3))))
        template = str(outro.get("template", "subscribe")).lower()
        bg_color = str(outro.get("bg_color", "#0A0A0F")).lstrip("#")
        text_color = str(outro.get("text_color", "#FFFFFF")).lstrip("#")
        text = str(outro.get("text", "Subscribe for More!")).replace("'", "").replace(":", "")

        outro_step = (
            f"color=c=0x{bg_color}:s={video_w}x{video_h}:d={duration_s}[outro_bg];"
            f"[outro_bg]drawtext=text='{text}':fontcolor=0x{text_color}:fontsize=52:"
            f"x=(w-text_w)/2:y=(h-text_h)/2[outro_v]"
        )
        filter_steps.append(outro_step)

    return filter_steps, current_label
