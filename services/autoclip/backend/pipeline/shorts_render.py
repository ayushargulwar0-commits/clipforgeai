"""
Shorts Render Engine: Converts horizontal video clips to 9:16 vertical shorts (1080x1920).
Features:
- Smart crop with OpenCV YuNet face detection & EMA motion smoothing
- Blurred-background layout fallback for slides/wide shots/screen recordings
- ASS word-level animated subtitles with current-word highlighting
- Bundled Noto Sans font supporting English and Hindi/Devanagari
- FFmpeg encoding: 1080x1920, H.264 + AAC, 30fps, yuv420p, -movflags +faststart
"""
from __future__ import annotations

import logging
import math
import os
import re
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Base asset paths
BACKEND_DIR = Path(__file__).parent.parent
MODEL_PATH = BACKEND_DIR / "assets" / "models" / "face_detection_yunet_2023mar.onnx"
FONT_DIR = BACKEND_DIR / "assets" / "fonts"
NOTO_FONT_PATH = FONT_DIR / "NotoSansDevanagari-Bold.ttf"


# ---------------------------------------------------------------------------
# 1. Transcript Snapping & Sentence Boundary Alignment
# ---------------------------------------------------------------------------


def snap_to_sentence_boundaries(
    start_sec: float,
    end_sec: float,
    sentences: List[Dict[str, Any]],
    min_dur: float = 20.0,
    max_dur: float = 60.0,
) -> Tuple[float, float, str]:
    """
    Snaps raw start/end timestamps to clean sentence boundaries.
    Enforces target 20-60s (hard cap 60s, never exceeds 180s).
    """
    if not sentences:
        target_dur = min(max_dur, max(min_dur, end_sec - start_sec))
        return start_sec, start_sec + target_dur, ""

    # Find the sentence starting closest to start_sec
    best_start = start_sec
    start_idx = 0
    min_start_diff = float("inf")

    for i, s in enumerate(sentences):
        s_start = float(s.get("start", 0))
        diff = abs(s_start - start_sec)
        if diff < min_start_diff:
            min_start_diff = diff
            best_start = s_start
            start_idx = i

    # Find ending sentence that keeps duration between min_dur and max_dur
    best_end = best_start + min_dur
    matched_sentences = []

    for i in range(start_idx, len(sentences)):
        s = sentences[i]
        s_end = float(s.get("end", best_start + 1))
        dur = s_end - best_start

        if dur > max_dur and matched_sentences:
            break

        best_end = s_end
        matched_sentences.append(s.get("text", "").strip())

        if dur >= min_dur and (dur <= max_dur or not matched_sentences):
            # Good landing sentence boundary
            best_end = s_end

    final_dur = best_end - best_start
    if final_dur > 60.0:
        best_end = best_start + 60.0
    if final_dur < 10.0:
        best_end = best_start + 15.0

    full_text = " ".join(matched_sentences).strip()
    return round(best_start, 2), round(best_end, 2), full_text


# ---------------------------------------------------------------------------
# 2. Smart Subject Detection (OpenCV YuNet + EMA Motion Smoothing)
# ---------------------------------------------------------------------------


def analyze_subject_crop(
    video_path: str,
    start_sec: float,
    duration: float,
    target_aspect: float = 9.0 / 16.0,
) -> Tuple[str, List[float]]:
    """
    Analyzes video with face detection sampled at ~2 fps.
    Returns:
      layout: 'smart_crop' or 'blurred_bg'
      crop_x_trajectory: smoothed list of normalized center X coordinates [0.0 - 1.0]
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return "blurred_bg", [0.5]

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1920)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1080)

    # If source is already vertical or square, no need for heavy crop
    if width <= height:
        cap.release()
        return "smart_crop", [0.5]

    target_crop_width = int(height * target_aspect)
    max_crop_x = width - target_crop_width

    # Load YuNet detector
    detector = None
    if MODEL_PATH.exists():
        try:
            detector = cv2.FaceDetectorYN.create(str(MODEL_PATH), "", (320, 320), score_threshold=0.55)
        except Exception as e:
            logger.debug("Failed loading YuNet: %s", e)

    sample_interval = max(1, int(fps / 2.0))  # ~2 frames per second
    start_frame = int(start_sec * fps)
    total_frames_to_sample = int(duration * fps)

    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    raw_centers: List[float] = []
    face_detected_count = 0
    total_sampled = 0

    for f_idx in range(0, total_frames_to_sample, sample_interval):
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame + f_idx)
        ret, frame = cap.read()
        if not ret:
            break

        total_sampled += 1
        found_center = 0.5  # default center

        if detector is not None:
            # Resize frame to (320, 320) for rapid inference
            in_h, in_w = frame.shape[:2]
            detector.setInputSize((320, 320))
            scaled = cv2.resize(frame, (320, 320))
            _, faces = detector.detect(scaled)

            if faces is not None and len(faces) > 0:
                # Find largest face (closest subject)
                best_face = max(faces, key=lambda f: f[2] * f[3])
                # Convert normalized x center back to original scale
                face_center_x = (best_face[0] + best_face[2] / 2.0) / 320.0
                found_center = face_center_x
                face_detected_count += 1
            else:
                found_center = raw_centers[-1] if raw_centers else 0.5
        else:
            found_center = 0.5

        raw_centers.append(found_center)

    cap.release()

    if not raw_centers:
        return "blurred_bg", [0.5]

    # If faces are detected in less than 15% of frames (slides, screen share, wide shot),
    # use clean blurred-background layout
    detection_ratio = face_detected_count / max(1, total_sampled)
    if detection_ratio < 0.15:
        logger.info("Face detected in only %.1f%% of frames. Choosing blurred-background layout.", detection_ratio * 100)
        return "blurred_bg", [0.5]

    # Smooth the crop trajectory using Exponential Moving Average (alpha=0.15) to avoid jitter
    smoothed: List[float] = []
    alpha = 0.15
    curr = raw_centers[0]
    for val in raw_centers:
        curr = alpha * val + (1.0 - alpha) * curr
        smoothed.append(curr)

    return "smart_crop", smoothed


# ---------------------------------------------------------------------------
# 3. Dynamic Animated Subtitles (ASS Format with Word Highlighting)
# ---------------------------------------------------------------------------


def _format_ass_time(seconds: float) -> str:
    """Formats seconds into ASS timestamp format: H:MM:SS.cs"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int(round((seconds - int(seconds)) * 100))
    if cs >= 100:
        cs = 99
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def generate_word_level_ass(
    words_data: List[Dict[str, Any]],
    output_ass_path: Path,
    video_start_offset: float = 0.0,
    font_name: str = "Noto Sans Devanagari",
) -> None:
    """
    Generates a high-retention stylized .ass subtitle file.
    - 2 to 3 words grouped per line.
    - Lower-third placement (~20% from bottom).
    - Bold white text with black outline.
    - Currently spoken word highlighted in bright yellow.
    """
    font_file = NOTO_FONT_PATH.resolve()

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ShortsDefault,{font_name},72,&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,1,0,0,0,100,100,1,0,1,6,3,2,60,60,380,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []

    # If no word-level data, chunk sentence/phrase
    if not words_data:
        output_ass_path.write_text(header, encoding="utf-8")
        return

    # Group words into small clusters (2-3 words per display event)
    chunk_size = 3
    for i in range(0, len(words_data), chunk_size):
        group = words_data[i : i + chunk_size]
        group_start = max(0.0, float(group[0].get("start", 0)) - video_start_offset)
        group_end = max(group_start + 0.3, float(group[-1].get("end", group_start + 1.0)) - video_start_offset)

        # For each word in the group, highlight it while it is being spoken
        for w_idx, active_word in enumerate(group):
            w_start = max(0.0, float(active_word.get("start", group_start)) - video_start_offset)
            w_end = max(w_start + 0.2, float(active_word.get("end", w_start + 0.4)) - video_start_offset)

            # Build line text with active word highlighted in bright yellow (&H0000FFFF&)
            line_parts = []
            for j, w in enumerate(group):
                text = w.get("word", "").strip()
                if not text:
                    continue
                if j == w_idx:
                    # Highlight active word
                    line_parts.append(r"{\c&H0000FFFF&\fscx110\fscy110}" + text + r"{\r}")
                else:
                    line_parts.append(r"{\c&H00FFFFFF&}" + text)

            event_text = " ".join(line_parts)
            events.append(
                f"Dialogue: 0,{_format_ass_time(w_start)},{_format_ass_time(w_end)},ShortsDefault,,0,0,0,,{event_text}"
            )

    full_ass = header + "\n".join(events) + "\n"
    output_ass_path.write_text(full_ass, encoding="utf-8")
    logger.info("Generated ASS subtitle file: %s (%d dialogue events)", output_ass_path.name, len(events))


# ---------------------------------------------------------------------------
# 4. Vertical Shorts Render Pipeline
# ---------------------------------------------------------------------------


def render_vertical_short(
    source_video: str,
    output_shorts_path: str,
    start_sec: float,
    duration: float,
    words_data: Optional[List[Dict[str, Any]]] = None,
    burn_captions: bool = True,
) -> Dict[str, Any]:
    """
    Renders horizontal video into 1080x1920 9:16 Shorts video.
    Returns metadata dict with shorts_path, layout, caption_path.
    """
    source_p = Path(source_video).resolve()
    out_p = Path(output_shorts_path).resolve()
    out_p.parent.mkdir(parents=True, exist_ok=True)

    # 1. Analyze smart crop vs blurred background
    layout, trajectory = analyze_subject_crop(str(source_p), start_sec, duration)
    avg_crop_center = float(np.mean(trajectory)) if trajectory else 0.5

    # 2. Subtitle file preparation
    ass_path = out_p.parent / f"{out_p.stem}_captions.ass"
    if burn_captions and words_data:
        generate_word_level_ass(
            words_data=words_data,
            output_ass_path=ass_path,
            video_start_offset=start_sec,
            font_name="Noto Sans Devanagari",
        )
    elif burn_captions and not words_data:
        # Fallback empty ass if no words
        ass_path.write_text("[Script Info]\nScriptType: v4.00+\n[Events]\n", encoding="utf-8")

    # 3. Construct FFmpeg video filter chain
    vf_filters = []

    if layout == "smart_crop":
        # 1080x1920 smart crop
        # Scale to 1920 height, then crop 1080 width at computed center
        # e.g., in_w=scaled width, crop_x = (in_w - 1080) * avg_crop_center
        vf_filters.append(
            f"scale=-2:1920,crop=1080:1920:(in_w-1080)*{avg_crop_center:.3f}:0"
        )
    else:
        # Blurred background layout for slides/screen shares
        # Top/bottom blurred 1080x1920, foreground scaled to fit 1080 width
        vf_filters.append(
            "split=2[bg][fg];"
            "[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg_blur];"
            "[fg]scale=1080:-2:force_original_aspect_ratio=decrease[fg_scaled];"
            "[bg_blur][fg_scaled]overlay=(W-w)/2:(H-h)/2"
        )

    # Burn captions if enabled and ass file exists
    if burn_captions and ass_path.exists() and ass_path.stat().st_size > 50:
        # Escape path for FFmpeg filter on Windows
        clean_ass = str(ass_path).replace("\\", "/").replace(":", "\\:")
        clean_fonts = str(FONT_DIR).replace("\\", "/").replace(":", "\\:")
        # Append ass subtitle filter
        if layout == "blurred_bg":
            vf_filters[-1] += f"[v_composed];[v_composed]subtitles='{clean_ass}':fontsdir='{clean_fonts}'"
        else:
            vf_filters.append(f"subtitles='{clean_ass}':fontsdir='{clean_fonts}'")

    filter_complex = ",".join(vf_filters) if layout == "smart_crop" else vf_filters[0]

    cmd = [
        "ffmpeg", "-y",
        "-ss", f"{start_sec:.2f}",
        "-i", str(source_p),
        "-t", f"{duration:.2f}",
        "-vf" if layout == "smart_crop" else "-filter_complex", filter_complex,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "22",
        "-r", "30",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        str(out_p),
    ]

    logger.info("Executing vertical shorts render: %s -> %s (layout=%s)", source_p.name, out_p.name, layout)
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if proc.returncode != 0:
        logger.error("FFmpeg vertical shorts render failed: %s", proc.stderr[-500:])
        # Fallback without subtitle filter if libass caused issue
        fallback_vf = "scale=-2:1920,crop=1080:1920"
        fallback_cmd = [
            "ffmpeg", "-y",
            "-ss", f"{start_sec:.2f}",
            "-i", str(source_p),
            "-t", f"{duration:.2f}",
            "-vf", fallback_vf,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "22",
            "-r", "30",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            str(out_p),
        ]
        subprocess.run(fallback_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    return {
        "shorts_path": str(out_p),
        "caption_path": str(ass_path) if ass_path.exists() else None,
        "layout": layout,
        "duration": duration,
        "width": 1080,
        "height": 1920,
    }
