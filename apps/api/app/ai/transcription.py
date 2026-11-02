"""
Transcription engine powered by faster-whisper.

Usage
-----
    engine = TranscriptionEngine(model_size="base")
    result = engine.transcribe("/path/to/audio.wav")
    # result = {segments: [...], language: "en", duration: 123.4}
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class TranscriptionEngine:
    """
    Wraps faster-whisper's ``WhisperModel`` to produce word-level
    timestamped transcripts.

    Parameters
    ----------
    model_size   : One of tiny / base / small / medium / large / large-v2 / large-v3
    device       : "cpu" or "cuda"
    compute_type : "int8" (CPU default), "float16" (GPU), "float32"
    """

    def __init__(
        self,
        model_size: str = "base",
        device: str = "cpu",
        compute_type: str = "int8",
    ) -> None:
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self._model = None  # lazy-loaded on first use

    def _load_model(self):
        if self._model is None:
            try:
                from faster_whisper import WhisperModel  # type: ignore

                logger.info(
                    "Loading WhisperModel(size=%s, device=%s, compute_type=%s)",
                    self.model_size,
                    self.device,
                    self.compute_type,
                )
                self._model = WhisperModel(
                    self.model_size,
                    device=self.device,
                    compute_type=self.compute_type,
                )
                logger.info("WhisperModel loaded successfully")
            except ImportError as exc:
                raise RuntimeError(
                    "faster-whisper is not installed. "
                    "Run: pip install faster-whisper"
                ) from exc
        return self._model

    def transcribe(
        self,
        audio_path: str,
        language: str | None = None,
    ) -> dict[str, Any]:
        """
        Transcribe an audio/video file and return structured segments
        with word-level timestamps.

        Parameters
        ----------
        audio_path : Path to the audio/video file.
        language   : ISO 639-1 language code to force (e.g. "en").
                     Pass ``None`` for automatic detection.

        Returns
        -------
        dict with keys:
            segments : list of {start, end, text, words: [{start, end, word}]}
            language : detected/forced language code
            duration : total audio duration in seconds
        """
        model = self._load_model()

        transcribe_kwargs: dict[str, Any] = {
            "word_timestamps": True,
        }
        if language:
            transcribe_kwargs["language"] = language

        logger.info("Transcribing: %s (language=%s)", audio_path, language or "auto")

        try:
            segments_iter, info = model.transcribe(audio_path, **transcribe_kwargs)
        except Exception as exc:
            logger.exception("Transcription failed for %s", audio_path)
            raise RuntimeError(f"Transcription failed: {exc}") from exc

        result_segments: list[dict[str, Any]] = []
        for seg in segments_iter:
            words: list[dict[str, Any]] = []
            if seg.words:
                for w in seg.words:
                    words.append(
                        {
                            "start": round(w.start, 3),
                            "end": round(w.end, 3),
                            "word": w.word,
                        }
                    )
            result_segments.append(
                {
                    "start": round(seg.start, 3),
                    "end": round(seg.end, 3),
                    "text": seg.text.strip(),
                    "words": words,
                }
            )

        logger.info(
            "Transcription complete: %d segments, language=%s, duration=%.1fs",
            len(result_segments),
            info.language,
            info.duration,
        )

        return {
            "segments": result_segments,
            "language": info.language,
            "duration": round(info.duration, 3),
        }

    def transcribe_to_srt(
        self,
        audio_path: str,
        output_srt_path: str,
        language: str | None = None,
    ) -> str:
        """
        Transcribe and write an SRT subtitle file.

        Returns the path to the written SRT file.
        """
        result = self.transcribe(audio_path, language=language)
        lines: list[str] = []
        for i, seg in enumerate(result["segments"], start=1):
            start_ts = _seconds_to_srt_ts(seg["start"])
            end_ts = _seconds_to_srt_ts(seg["end"])
            lines.append(str(i))
            lines.append(f"{start_ts} --> {end_ts}")
            lines.append(seg["text"])
            lines.append("")

        with open(output_srt_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

        logger.debug("SRT written to %s", output_srt_path)
        return output_srt_path


def _seconds_to_srt_ts(seconds: float) -> str:
    """Convert float seconds to SRT timestamp format HH:MM:SS,mmm."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


# ---------------------------------------------------------------------------
# Module-level singleton (lazy init)
# ---------------------------------------------------------------------------
_engine_instance: TranscriptionEngine | None = None


def get_transcription_engine() -> TranscriptionEngine:
    """Return or create the process-level transcription engine singleton."""
    global _engine_instance
    if _engine_instance is None:
        from app.core.config import get_settings
        settings = get_settings()
        _engine_instance = TranscriptionEngine(
            model_size=settings.WHISPER_MODEL_SIZE,
            device=settings.WHISPER_DEVICE,
            compute_type=settings.WHISPER_COMPUTE_TYPE,
        )
    return _engine_instance
