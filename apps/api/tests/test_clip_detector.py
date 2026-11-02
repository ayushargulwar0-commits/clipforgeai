"""
Unit tests for AI clip detection engine.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ai.clip_detector import ClipDetector


def test_clip_detector_scoring():
    detector = ClipDetector()

    mock_transcript = {
        "language": "en",
        "duration": 90.0,
        "segments": [
            {
                "start": 0.0,
                "end": 8.0,
                "text": "Welcome to the podcast everyone. Today we are talking with our guest.",
                "words": [],
            },
            {
                "start": 8.5,
                "end": 18.0,
                "text": "The biggest secret nobody tells you about scaling a startup is this.",
                "words": [],
            },
            {
                "start": 18.2,
                "end": 28.0,
                "text": "You have to completely rebuild your infrastructure and focus on retention.",
                "words": [],
            },
            {
                "start": 28.5,
                "end": 38.0,
                "text": "If you don't do that, you will literally fail within six months.",
                "words": [],
            },
            {
                "start": 39.0,
                "end": 60.0,
                "text": "Let us take a quick break for our sponsors.",
                "words": [],
            },
        ],
    }

    candidates = detector.detect_clips(
        mock_transcript,
        min_duration=15,
        max_duration=45,
        max_clips=3,
    )

    assert len(candidates) > 0, "Should detect at least one clip candidate"
    top_clip = candidates[0]
    assert top_clip["score"] > 0, "Top clip score should be positive"
    assert "start" in top_clip
    assert "end" in top_clip
    assert "title" in top_clip
    assert "hook" in top_clip
    print(f"Top detected clip: '{top_clip['title']}' (Score: {top_clip['score']})")


if __name__ == "__main__":
    test_clip_detector_scoring()
    print("test_clip_detector_scoring PASSED")
