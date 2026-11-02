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


def is_safe_url(url: str) -> bool:
    """Validate URL format and prevent SSRF attacks."""
    from urllib.parse import urlparse
    import re

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False
    host = (parsed.hostname or "").lower()
    if not host:
        return False

    blocked_patterns = [
        r"^localhost$",
        r"^127\.",
        r"^0\.0\.0\.0",
        r"^10\.",
        r"^192\.168\.",
        r"^172\.(1[6-9]|2[0-9]|3[0-1])\.",
        r"^169\.254\.",
        r"\.local$",
        r"\.internal$",
    ]
    for pattern in blocked_patterns:
        if re.search(pattern, host):
            return False
    return True


def extract_youtube_id(url: str) -> str | None:
    """Extract YouTube video ID from watch URL or short link."""
    import re
    match = re.search(r"(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})", url)
    return match.group(1) if match else None


def download_video_from_url(url: str, output_dir: Path) -> dict:
    """
    Download video or audio from YouTube or any public video URL using yt-dlp.
    Returns metadata dict with file_path, title, duration, dimensions, etc.
    """
    if not is_safe_url(url):
        raise ValueError("Invalid or disallowed URL. Only public HTTP/HTTPS URLs are supported.")

    import yt_dlp
    import uuid

    output_dir.mkdir(parents=True, exist_ok=True)
    temp_id = str(uuid.uuid4())[:8]
    out_tmpl = str(output_dir / f"yt_{temp_id}_%(id)s.%(ext)s")

    ydl_opts = {
        "format": "best[ext=mp4][height<=720]/best[ext=mp4]/best",
        "outtmpl": out_tmpl,
        "max_filesize": 350 * 1024 * 1024,
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
    except Exception as exc:
        logger.exception("yt-dlp download failed for %s", url)
        raise RuntimeError(f"Failed to download video stream from URL: {exc}") from exc

    yt_id = extract_youtube_id(url)
    return {
        "file_path": filename,
        "filename": Path(filename).name,
        "title": info.get("title", "Imported Video"),
        "duration": info.get("duration", 0),
        "width": info.get("width") or 1280,
        "height": info.get("height") or 720,
        "fps": info.get("fps") or 30,
        "thumbnail": info.get("thumbnail"),
        "youtube_id": yt_id,
        "youtube_url": url if yt_id else None,
        "file_size": Path(filename).stat().st_size if Path(filename).exists() else 0,
    }

