"""
Video processor — FFmpeg subprocess wrappers for trimming, encoding,
subtitle burn-in, audio extraction, and thumbnail generation.

All operations use the bundled ffmpeg binary from imageio-ffmpeg.
"""

from __future__ import annotations

import logging
import subprocess
from pathlib import Path
from typing import Any

import imageio_ffmpeg as ffmpeg_lib

logger = logging.getLogger(__name__)


class VideoProcessor:
    """Synchronous FFmpeg wrapper used inside a ThreadPoolExecutor."""

    # Aspect ratio → FFmpeg vf scale+crop filter
    _ASPECT_FILTERS: dict[str, str] = {
        "9:16":  "scale='if(gt(ih/iw,16/9),trunc(ih*9/16/2)*2,iw)':'if(gt(ih/iw,16/9),ih,trunc(iw*16/9/2)*2)',crop='if(gt(ih/iw,16/9),trunc(ih*9/16/2)*2,iw)':'if(gt(ih/iw,16/9),ih,trunc(iw*16/9/2)*2)',scale=1080:1920",
        "16:9":  "scale='if(gt(iw/ih,16/9),iw,trunc(ih*16/9/2)*2)':'if(gt(iw/ih,16/9),trunc(iw*9/16/2)*2,ih)',crop='if(gt(iw/ih,16/9),iw,trunc(ih*16/9/2)*2)':'if(gt(iw/ih,16/9),trunc(iw*9/16/2)*2,ih)',scale=1920:1080",
        "1:1":   "scale='if(gt(iw,ih),ih,iw)':'if(gt(iw,ih),ih,iw)',crop='if(gt(iw,ih),ih,iw)':'if(gt(iw,ih),ih,iw)',scale=1080:1080",
    }

    def get_ffmpeg_exe(self) -> str:
        return ffmpeg_lib.get_ffmpeg_exe()

    def _run(self, cmd: list[str], timeout: int = 300) -> None:
        """Execute a ffmpeg command, raise RuntimeError on failure."""
        logger.debug("FFmpeg cmd: %s", " ".join(cmd))
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False,
            )
            if result.returncode != 0:
                raise RuntimeError(
                    f"FFmpeg failed (code {result.returncode}): {result.stderr[-600:]}"
                )
        except subprocess.TimeoutExpired as exc:
            raise RuntimeError(f"FFmpeg timed out after {timeout}s") from exc

    def trim_and_encode(
        self,
        input_path: str,
        output_path: str,
        start: float,
        end: float,
        aspect_ratio: str = "9:16",
        add_subtitles_path: str | None = None,
    ) -> None:
        """
        Trim *input_path* from *start* to *end* seconds, reformat to the
        requested *aspect_ratio*, encode H.264 + AAC, and write *output_path*.

        Optionally burns in subtitles from an SRT file.
        """
        ffmpeg = self.get_ffmpeg_exe()
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        duration = end - start
        vf = self._ASPECT_FILTERS.get(aspect_ratio, self._ASPECT_FILTERS["9:16"])

        if add_subtitles_path:
            # Escape Windows backslashes for the subtitles filter
            srt_escaped = add_subtitles_path.replace("\\", "/").replace(":", "\\:")
            vf = f"{vf},subtitles='{srt_escaped}':force_style='FontName=Arial,FontSize=14,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Bold=1'"

        cmd = [
            ffmpeg, "-y",
            "-ss", str(start),
            "-i", input_path,
            "-t", str(duration),
            "-vf", vf,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            output_path,
        ]
        self._run(cmd, timeout=600)
        logger.info("Encoded clip: %s (%.1f–%.1f s, ratio=%s)", output_path, start, end, aspect_ratio)

    def extract_audio(self, video_path: str, audio_path: str) -> None:
        """
        Extract audio from *video_path* and write a 16-kHz mono WAV file
        suitable for Whisper transcription.
        """
        ffmpeg = self.get_ffmpeg_exe()
        Path(audio_path).parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            ffmpeg, "-y",
            "-i", video_path,
            "-vn",                     # drop video
            "-acodec", "pcm_s16le",    # 16-bit PCM
            "-ar", "16000",            # 16 kHz (Whisper's native rate)
            "-ac", "1",                # mono
            audio_path,
        ]
        self._run(cmd, timeout=300)
        logger.info("Audio extracted: %s", audio_path)

    def add_subtitles(
        self,
        video_path: str,
        srt_path: str,
        output_path: str,
        style_config: dict[str, Any] | None = None,
    ) -> None:
        """
        Burn subtitles from *srt_path* into *video_path* with optional styling.

        style_config keys (all optional):
            font_name, font_size, primary_color, outline_color, outline, bold
        """
        ffmpeg = self.get_ffmpeg_exe()
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        sc = style_config or {}
        font_name = sc.get("font_name", "Arial")
        font_size = int(sc.get("font_size", 14))
        primary_color = sc.get("primary_color", "&HFFFFFF")
        outline_color = sc.get("outline_color", "&H000000")
        outline = int(sc.get("outline", 2))
        bold = 1 if sc.get("bold", True) else 0

        srt_escaped = srt_path.replace("\\", "/").replace(":", "\\:")
        subtitles_filter = (
            f"subtitles='{srt_escaped}':force_style='"
            f"FontName={font_name},FontSize={font_size},"
            f"PrimaryColour={primary_color},OutlineColour={outline_color},"
            f"Outline={outline},Bold={bold}'"
        )

        cmd = [
            ffmpeg, "-y",
            "-i", video_path,
            "-vf", subtitles_filter,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "copy",
            output_path,
        ]
        self._run(cmd, timeout=600)
        logger.info("Subtitles burned into: %s", output_path)

    def generate_thumbnail(
        self,
        video_path: str,
        output_path: str,
        time_offset: float = 1.0,
    ) -> None:
        """Extract a single JPEG frame at *time_offset* seconds."""
        ffmpeg = self.get_ffmpeg_exe()
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            ffmpeg, "-y",
            "-ss", str(time_offset),
            "-i", video_path,
            "-frames:v", "1",
            "-q:v", "2",
            "-vf", "scale=640:-2",
            output_path,
        ]
        self._run(cmd, timeout=60)
        logger.debug("Thumbnail: %s", output_path)
