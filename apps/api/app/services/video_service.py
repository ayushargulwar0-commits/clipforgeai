"""
Video service helpers — metadata extraction and thumbnail generation.
Uses imageio-ffmpeg to locate a bundled ffprobe/ffmpeg binary.
"""

from __future__ import annotations

import json
import logging
import subprocess
from pathlib import Path

import imageio_ffmpeg as ffmpeg_lib

logger = logging.getLogger(__name__)


def _get_ffprobe_exe() -> str:
    """
    Return the path to ffprobe.  imageio-ffmpeg bundles ffmpeg; ffprobe
    lives in the same directory.
    """
    ffmpeg_exe = ffmpeg_lib.get_ffmpeg_exe()
    ffprobe = Path(ffmpeg_exe).parent / "ffprobe"
    if not ffprobe.exists():
        # Try with .exe suffix on Windows
        ffprobe = Path(ffmpeg_exe).parent / "ffprobe.exe"
    if not ffprobe.exists():
        # Fall back to PATH
        return "ffprobe"
    return str(ffprobe)


def extract_metadata(file_path: str) -> dict:
    """
    Use ffprobe to extract video metadata.

    Returns
    -------
    dict with keys: duration, width, height, fps, codec, format, size
    """
    ffprobe = _get_ffprobe_exe()
    cmd = [
        ffprobe,
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        "-show_format",
        file_path,
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
            check=True,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(f"ffprobe timed out for {file_path}") from exc
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            f"ffprobe failed (code {exc.returncode}): {exc.stderr}"
        ) from exc

    probe: dict = json.loads(result.stdout)

    # ---- Video stream ----
    video_stream: dict = {}
    for stream in probe.get("streams", []):
        if stream.get("codec_type") == "video":
            video_stream = stream
            break

    # ---- Format ----
    fmt: dict = probe.get("format", {})

    duration: float | None = None
    raw_duration = video_stream.get("duration") or fmt.get("duration")
    if raw_duration:
        try:
            duration = float(raw_duration)
        except (TypeError, ValueError):
            pass

    width: int | None = video_stream.get("width")
    height: int | None = video_stream.get("height")
    codec: str | None = video_stream.get("codec_name")

    fps: float | None = None
    r_frame_rate: str = video_stream.get("r_frame_rate", "")
    if r_frame_rate and "/" in r_frame_rate:
        num_str, den_str = r_frame_rate.split("/")
        try:
            num, den = int(num_str), int(den_str)
            fps = round(num / den, 4) if den else None
        except (ValueError, ZeroDivisionError):
            pass

    file_size: int | None = None
    raw_size = fmt.get("size")
    if raw_size:
        try:
            file_size = int(raw_size)
        except (TypeError, ValueError):
            pass

    format_name: str | None = fmt.get("format_name")

    return {
        "duration": duration,
        "width": width,
        "height": height,
        "fps": fps,
        "codec": codec,
        "format": format_name,
        "size": file_size,
    }


def generate_thumbnail(
    file_path: str,
    output_path: str,
    time_offset: float = 1.0,
) -> None:
    """
    Extract a single JPEG frame from *file_path* at *time_offset* seconds.

    Parameters
    ----------
    file_path   : Absolute path to the source video.
    output_path : Destination JPEG path (parent directory must exist).
    time_offset : Seconds into the video to grab the frame (default 1.0 s).
    """
    ffmpeg_exe = ffmpeg_lib.get_ffmpeg_exe()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        ffmpeg_exe,
        "-y",                          # overwrite
        "-ss", str(time_offset),       # seek before input (fast)
        "-i", file_path,
        "-frames:v", "1",
        "-q:v", "2",                   # JPEG quality (2=best)
        "-vf", "scale=640:-2",         # 640 px wide, maintain AR
        output_path,
    ]

    try:
        subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
            check=True,
        )
        logger.debug("Thumbnail generated: %s", output_path)
    except subprocess.CalledProcessError as exc:
        logger.warning(
            "Thumbnail generation failed for %s: %s", file_path, exc.stderr[-500:]
        )
        raise RuntimeError(f"Thumbnail generation failed: {exc.stderr[-200:]}") from exc
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(f"Thumbnail generation timed out for {file_path}") from exc
