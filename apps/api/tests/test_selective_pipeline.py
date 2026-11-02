import pytest
from pathlib import Path
from app.services.video_service import ensure_ffmpeg
from app.video.processor import VideoProcessor


def test_ffmpeg_environment():
    ffmpeg_dir = ensure_ffmpeg()
    assert Path(ffmpeg_dir).exists()
    target_exe = Path(ffmpeg_dir) / "ffmpeg.exe"
    assert target_exe.exists()


def test_selective_render_pipeline():
    processor = VideoProcessor()
    # Check that aspect filters exist and include 9:16 vertical
    assert "9:16" in processor._ASPECT_FILTERS
    assert "1080:1920" in processor._ASPECT_FILTERS["9:16"]
