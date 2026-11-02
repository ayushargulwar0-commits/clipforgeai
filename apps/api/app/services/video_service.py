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
    Use ffprobe or ffmpeg -i to extract video metadata.
    Returns dict with keys: duration, width, height, fps, codec, format, size
    """
    import re
    file_size = Path(file_path).stat().st_size if Path(file_path).exists() else None
    ffprobe = _get_ffprobe_exe()
    
    # Try ffprobe first
    try:
        cmd = [
            ffprobe,
            "-v", "quiet",
            "-print_format", "json",
            "-show_streams",
            "-show_format",
            file_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30, check=True)
        probe: dict = json.loads(result.stdout)
        video_stream: dict = {}
        for stream in probe.get("streams", []):
            if stream.get("codec_type") == "video":
                video_stream = stream
                break
        fmt: dict = probe.get("format", {})
        raw_duration = video_stream.get("duration") or fmt.get("duration")
        duration = float(raw_duration) if raw_duration else None
        width = video_stream.get("width")
        height = video_stream.get("height")
        codec = video_stream.get("codec_name")
        return {
            "duration": duration,
            "width": width,
            "height": height,
            "fps": 30.0,
            "codec": codec,
            "format": fmt.get("format_name"),
            "size": file_size,
        }
    except Exception:
        # Fallback to ffmpeg -i inspection
        try:
            ffmpeg_exe = ffmpeg_lib.get_ffmpeg_exe()
            res = subprocess.run([ffmpeg_exe, "-i", file_path], capture_output=True, text=True, timeout=15)
            stderr = res.stderr
            # Parse Duration: 00:00:05.00
            dur_m = re.search(r"Duration:\s*(\d+):(\d+):([\d\.]+)", stderr)
            duration = None
            if dur_m:
                hrs, mins, secs = float(dur_m.group(1)), float(dur_m.group(2)), float(dur_m.group(3))
                duration = round(hrs * 3600 + mins * 60 + secs, 2)
            # Parse resolution e.g. 1080x1920 or 1280x720
            res_m = re.search(r"Stream.*Video:.*?(\d{3,4})x(\d{3,4})", stderr)
            width = int(res_m.group(1)) if res_m else 1080
            height = int(res_m.group(2)) if res_m else 1920
            # Parse codec e.g. h264, vp9, etc.
            codec_m = re.search(r"Stream.*Video:\s*([a-zA-Z0-9_\-]+)", stderr)
            codec = codec_m.group(1) if codec_m else "h264"
            return {
                "duration": duration,
                "width": width,
                "height": height,
                "fps": 30.0,
                "codec": codec,
                "format": Path(file_path).suffix.lstrip("."),
                "size": file_size,
            }
        except Exception as exc2:
            logger.warning("Metadata inspection failed: %s", exc2)
            return {
                "duration": None,
                "width": 1080,
                "height": 1920,
                "fps": 30.0,
                "codec": "h264",
                "format": "mp4",
                "size": file_size,
            }

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


def ensure_ffmpeg() -> str:
    """
    Ensure ffmpeg.exe exists in imageio_ffmpeg binaries dir and is in PATH.
    External tools such as yt-dlp depend on discovering ffmpeg in PATH.
    """
    import os
    import shutil
    ffmpeg_exe = ffmpeg_lib.get_ffmpeg_exe()
    ffmpeg_dir = str(Path(ffmpeg_exe).parent)
    target_exe = Path(ffmpeg_dir) / "ffmpeg.exe"
    if not target_exe.exists():
        try:
            shutil.copy2(ffmpeg_exe, target_exe)
        except Exception as exc:
            logger.warning("Could not copy ffmpeg.exe: %s", exc)

    if ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")

    return ffmpeg_dir


def extract_youtube_id(url: str) -> str | None:
    """Extract YouTube video ID from watch URL or short link."""
    import re
    match = re.search(r"(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})", url)
    return match.group(1) if match else None


def download_video_from_url(url: str, output_dir: Path) -> dict:
    """
    Download video or audio from YouTube or any public video URL using yt-dlp.
    Returns metadata dict with file_path, title, duration, dimensions, chapters, etc.
    """
    if not is_safe_url(url):
        raise ValueError("Invalid or disallowed URL. Only public HTTP/HTTPS URLs are supported.")

    import yt_dlp
    import uuid

    ffmpeg_dir = ensure_ffmpeg()
    output_dir.mkdir(parents=True, exist_ok=True)
    temp_id = str(uuid.uuid4())[:8]
    out_tmpl = str(output_dir / f"yt_{temp_id}_%(id)s.%(ext)s")

    ydl_opts = {
        "format": "b[ext=mp4]/bv*[ext=mp4][height<=720]+ba[ext=m4a]/b/best",
        "outtmpl": out_tmpl,
        "ffmpeg_location": ffmpeg_dir,
        "max_filesize": 400 * 1024 * 1024,
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
        "chapters": info.get("chapters") or [],
        "file_size": Path(filename).stat().st_size if Path(filename).exists() else 0,
    }


def download_selective_section(
    url_or_id: str,
    start_time: float,
    end_time: float,
    output_dir: Path,
    clip_id: str | None = None,
) -> dict:
    """
    Download or extract ONLY a selective section [start_time, end_time]
    using yt-dlp partial range downloading, saving vast bandwidth and time.
    """
    import uuid
    import yt_dlp
    from yt_dlp.utils import download_range_func

    ffmpeg_dir = ensure_ffmpeg()
    output_dir.mkdir(parents=True, exist_ok=True)
    cid = clip_id or str(uuid.uuid4())[:8]

    # Resolve target URL
    yt_id = extract_youtube_id(url_or_id)
    if not yt_id and len(url_or_id) == 11 and " " not in url_or_id and "/" not in url_or_id:
        yt_id = url_or_id

    target_url = f"https://www.youtube.com/watch?v={yt_id}" if yt_id else url_or_id

    # If it is a local file on disk, use ffmpeg directly
    local_path = Path(url_or_id)
    if local_path.exists() and local_path.is_file():
        out_filename = f"clip_{cid}_section.mp4"
        out_path = output_dir / out_filename
        from app.video.processor import VideoProcessor
        processor = VideoProcessor()
        processor.trim_and_encode(
            str(local_path),
            str(out_path),
            start=start_time,
            end=end_time,
            aspect_ratio="9:16",
        )
        return {
            "file_path": str(out_path),
            "filename": out_filename,
            "duration": round(end_time - start_time, 1),
            "start_time": start_time,
            "end_time": end_time,
            "youtube_id": None,
            "file_size": out_path.stat().st_size if out_path.exists() else 0,
        }

    # Otherwise use yt-dlp range download
    out_tmpl = str(output_dir / f"clip_{cid}_%(id)s.%(ext)s")
    ydl_opts = {
        "format": "b[ext=mp4]/bv*[ext=mp4][height<=720]+ba[ext=m4a]/b/best",
        "download_ranges": download_range_func(None, [(start_time, end_time)]),
        "outtmpl": out_tmpl,
        "ffmpeg_location": ffmpeg_dir,
        "force_keyframes_at_cuts": True,
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target_url, download=True)
            filename = ydl.prepare_filename(info)
    except Exception as exc:
        logger.exception("Selective download failed for %s", target_url)
        raise RuntimeError(f"Could not download selective clip section: {exc}") from exc

    final_path = Path(filename)
    return {
        "file_path": str(final_path),
        "filename": final_path.name,
        "title": info.get("title", "Selective Section"),
        "duration": round(end_time - start_time, 1),
        "start_time": start_time,
        "end_time": end_time,
        "youtube_id": yt_id,
        "file_size": final_path.stat().st_size if final_path.exists() else 0,
    }


