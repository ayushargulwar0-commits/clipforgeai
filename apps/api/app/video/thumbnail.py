"""
Thumbnail helpers — convenience wrappers around VideoProcessor.
"""

from __future__ import annotations

from pathlib import Path

from app.video.processor import VideoProcessor


def extract_thumbnail(
    video_path: str,
    output_path: str,
    time_offset: float = 1.0,
) -> str:
    """
    Generate a JPEG thumbnail from *video_path* and return the output path.

    Parameters
    ----------
    video_path  : Absolute path to the source video.
    output_path : Absolute path for the output JPEG.
    time_offset : Seek position in seconds (default 1.0 s).

    Returns
    -------
    The absolute output_path string.
    """
    processor = VideoProcessor()
    processor.generate_thumbnail(video_path, output_path, time_offset=time_offset)
    return output_path


def ensure_thumbnail(
    video_path: str,
    output_dir: str,
    video_id: str,
    time_offset: float = 1.0,
) -> str:
    """
    Generate a thumbnail for *video_id* inside *output_dir*.
    If the thumbnail already exists, return its path without re-generating.

    Returns the relative filename ``{video_id}_thumb.jpg``.
    """
    thumb_name = f"{video_id}_thumb.jpg"
    thumb_path = Path(output_dir) / thumb_name
    if not thumb_path.exists():
        extract_thumbnail(video_path, str(thumb_path), time_offset=time_offset)
    return thumb_name
