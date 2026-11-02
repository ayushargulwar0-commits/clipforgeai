"""
Integration tests for FFmpeg processor and binary detection.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.video.processor import VideoProcessor


def test_ffmpeg_binary():
    processor = VideoProcessor()
    ffmpeg_exe = processor.get_ffmpeg_exe()
    assert ffmpeg_exe is not None, "FFmpeg binary path should not be None"
    assert Path(ffmpeg_exe).exists(), f"FFmpeg binary should exist at {ffmpeg_exe}"
    print(f"FFmpeg binary verified at: {ffmpeg_exe}")


if __name__ == "__main__":
    test_ffmpeg_binary()
    print("FFmpeg Processor test PASSED!")
