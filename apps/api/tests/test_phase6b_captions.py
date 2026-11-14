import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

api_dir = Path(__file__).resolve().parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from app.services.captions_ass import captions_to_ass, _format_ass_time, _hex_to_ass_color
from app.main import app
from app.core.security import create_access_token


def test_captions_to_ass_pure_helper():
    sample_edit_json = {
        "trim": {"in": 10.0, "out": 40.0},
        "aspect": "9:16",
        "framing": {"mode": "crop", "crop": {"x": 34.0, "y": 0.0, "w": 31.64, "h": 100.0}},
        "background": {"type": "blur", "value": "#000000"},
        "captions": {
            "enabled": True,
            "preset": "Firestorm Gold",
            "words": [
                {"text": "Before", "start": 5.0, "end": 8.0},  # outside trim.in (10.0) -> excluded
                {"text": "Hello", "start": 10.5, "end": 11.0},
                {"text": "world", "start": 11.0, "end": 11.5},
                {"text": "Shorts", "start": 11.5, "end": 12.0},
                {"text": "Viral", "start": 12.0, "end": 12.5},
            ],
            "style": {
                "font": "Noto Sans",
                "size": 42,
                "color": "#FFFFFF",
                "highlight_color": "#FFD700",
                "outline_color": "#000000",
                "outline_width": 3,
                "box": False,
                "box_color": "#00000088",
                "words_per_line": 2,
                "position": "lower_third",
                "y_offset": 0,
            },
            "safe_zones": True,
        },
    }

    ass_content = captions_to_ass(sample_edit_json)
    assert "[Script Info]" in ass_content
    assert "[V4+ Styles]" in ass_content
    assert "[Events]" in ass_content
    assert "Noto Sans" in ass_content
    assert "&H0000D7FF" in ass_content  # Hex #FFD700 in ASS format &H00BBGGRR

    # "Before" was at 5.0s, trim.in is 10.0s -> excluded
    assert "Before" not in ass_content

    # "Hello" was at 10.5s -> shifted by trim.in (10.0s) -> 0.5s (0:00:00.50)
    assert "Hello" in ass_content
    assert "0:00:00.50" in ass_content
    assert "Dialogue:" in ass_content


def test_captions_to_ass_disabled_or_empty():
    disabled_edit = {"trim": {"in": 0.0, "out": 30.0}, "captions": {"enabled": False, "words": [{"text": "Hi", "start": 1.0, "end": 2.0}]}}
    assert captions_to_ass(disabled_edit) == ""

    empty_words = {"trim": {"in": 0.0, "out": 30.0}, "captions": {"enabled": True, "words": []}}
    assert captions_to_ass(empty_words) == ""


def test_captions_time_and_color_formatters():
    assert _format_ass_time(0.0) == "0:00:00.00"
    assert _format_ass_time(65.25) == "0:01:05.25"
    assert _format_ass_time(3661.05) == "1:01:01.05"

    # Hex to ASS color conversion (#RRGGBB -> &H00BBGGRR)
    assert _hex_to_ass_color("#FFFFFF") == "&H00FFFFFF"
    assert _hex_to_ass_color("#FF0000") == "&H000000FF"
    assert _hex_to_ass_color("#0000FF") == "&H00FF0000"


def test_phase6b_api_save_and_retrieve():
    token = create_access_token({"sub": "user-caption-tester", "email": "tester@example.com", "role": "user"})
    client = TestClient(app)
    client.headers.update({"Authorization": f"Bearer {token}"})

    clip_id = "clip-phase6b-test"
    payload = {
        "edit_json": {
            "trim": {"in": 2.0, "out": 25.0},
            "aspect": "9:16",
            "framing": {"mode": "crop", "crop": {"x": 30.0, "y": 0.0, "w": 31.64, "h": 100.0}},
            "background": {"type": "blur", "value": "#000000"},
            "captions": {
                "enabled": True,
                "preset": "Cyber Neon",
                "words": [
                    {"text": "Phase", "start": 2.0, "end": 2.5},
                    {"text": "Six", "start": 2.5, "end": 3.0},
                    {"text": "B", "start": 3.0, "end": 3.5},
                ],
                "style": {
                    "font": "Noto Sans",
                    "size": 46,
                    "color": "#00FFCC",
                    "highlight_color": "#FF0077",
                    "outline_color": "#000000",
                    "outline_width": 4,
                    "box": True,
                    "box_color": "#00000099",
                    "words_per_line": 2,
                    "position": "lower_third",
                    "y_offset": 10,
                },
                "safe_zones": True,
            },
        }
    }

    # Save
    r_put = client.put(f"/api/clips/{clip_id}/edit", json=payload)
    assert r_put.status_code == 200, r_put.text
    saved = r_put.json()["edit_json"]
    assert saved["captions"]["preset"] == "Cyber Neon"
    assert len(saved["captions"]["words"]) == 3
    assert saved["captions"]["style"]["words_per_line"] == 2

    # Retrieve
    r_get = client.get(f"/api/clips/{clip_id}/edit")
    assert r_get.status_code == 200
    retrieved = r_get.json()["edit_json"]
    assert retrieved["captions"]["preset"] == "Cyber Neon"
    assert retrieved["captions"]["words"][0]["text"] == "Phase"
