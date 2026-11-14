import io
import json
import sqlite3
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

api_dir = Path(__file__).resolve().parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from app.main import app
from app.core.security import create_access_token
from app.core.database import get_sqlite_conn
from app.services.export_helpers import build_audio_filter, build_overlay_filters


def test_build_audio_filter_no_music():
    edit_json = {"trim": {"in": 0.0, "out": 30.0}, "audio": {"original_volume": 120, "music": {"asset_id": None}}}
    f_str = build_audio_filter(edit_json)
    assert "[0:a]volume=1.20[aout]" in f_str


def test_build_audio_filter_with_music_and_ducking():
    edit_json = {
        "trim": {"in": 0.0, "out": 40.0},
        "audio": {
            "original_volume": 100,
            "music": {
                "asset_id": "asset-bgm-1",
                "volume": 40,
                "fade_in_s": 2.0,
                "fade_out_s": 3.0,
                "duck_under_speech": True,
            },
        },
    }
    f_str = build_audio_filter(edit_json)
    assert "volume=0.40" in f_str
    assert "afade=t=in:ss=0:d=2.0" in f_str
    assert "afade=t=out:st=37.0:d=3.0" in f_str
    assert "sidechaincompress" in f_str
    assert "amix=inputs=2" in f_str


def test_build_overlay_filters():
    edit_json = {
        "watermark": {
            "asset_id": "asset-logo-1",
            "position": "tr",
            "size_pct": 20,
            "opacity": 80,
            "margin_pct": 5,
        },
        "outro": {
            "enabled": True,
            "template": "subscribe",
            "text": "Follow for Tech Insights",
            "duration_s": 4,
            "bg_color": "#112233",
            "text_color": "#FFFFFF",
        },
    }
    steps, label = build_overlay_filters(edit_json, video_w=1080, video_h=1920)
    assert len(steps) == 2
    assert "colorchannelmixer=aa=0.80" in steps[0]
    assert "overlay=" in steps[0]
    assert "color=c=0x112233" in steps[1]
    assert "Follow for Tech Insights" in steps[1]
    assert label == "[v_wm]"


def test_assets_api_upload_and_stream():
    token = create_access_token({"sub": "user-asset-tester", "email": "creator@example.com", "role": "user"})
    client = TestClient(app)
    client.headers.update({"Authorization": f"Bearer {token}"})

    # 1. Upload valid PNG image (starts with \x89PNG\r\n\x1a\n)
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("logo.png", io.BytesIO(png_bytes), "image/png")}
    r_up = client.post("/api/assets", files=files)
    assert r_up.status_code == 200, r_up.text
    asset_data = r_up.json()
    assert asset_data["asset_type"] == "image"
    asset_id = asset_data["id"]

    # 2. List assets
    r_list = client.get("/api/assets")
    assert r_list.status_code == 200
    ids = [a["id"] for a in r_list.json()]
    assert asset_id in ids

    # 3. Stream file
    r_file = client.get(f"/api/assets/{asset_id}/file")
    assert r_file.status_code == 200
    assert r_file.content == png_bytes

    # 4. Delete asset
    r_del = client.delete(f"/api/assets/{asset_id}")
    assert r_del.status_code == 200


def test_sql_database_proof_of_clip_edits_row():
    token = create_access_token({"sub": "user-sql-prover", "email": "prover@example.com", "role": "user"})
    client = TestClient(app)
    client.headers.update({"Authorization": f"Bearer {token}"})

    clip_id = "proof-sql-clip-6c"
    payload = {
        "edit_json": {
            "trim": {"in": 0.0, "out": 45.0},
            "aspect": "9:16",
            "framing": {"mode": "crop", "crop": {"x": 34.0, "y": 0.0, "w": 31.64, "h": 100.0}},
            "background": {"type": "blur", "value": "#000000"},
            "captions": {"enabled": True, "preset": "Firestorm Gold", "words": []},
            "audio": {"original_volume": 100, "music": {"asset_id": None, "volume": 50, "fade_in_s": 1.0, "fade_out_s": 1.5, "duck_under_speech": True}},
            "watermark": {"asset_id": None, "position": "tr", "size_pct": 15, "opacity": 85, "margin_pct": 5},
            "outro": {"enabled": True, "template": "subscribe", "text": "Join the Forge", "duration_s": 3, "bg_color": "#000000", "text_color": "#FFFFFF"},
        }
    }

    # Save via API
    r_put = client.put(f"/api/clips/{clip_id}/edit", json=payload)
    assert r_put.status_code == 200

    # THE ONE SQL QUERY PROVING THE SAVED ROW EXISTS IN THE REAL DATABASE:
    conn = get_sqlite_conn()
    row = conn.execute(
        "SELECT clip_id, user_id, updated_at FROM clip_edits WHERE clip_id = ?",
        (clip_id,),
    ).fetchone()

    assert row is not None, "SQL row must exist in table clip_edits"
    assert row["clip_id"] == clip_id
    assert row["user_id"] == "user-sql-prover"
    print(f"\n[SQL PROOF] Found saved row: clip_id='{row['clip_id']}', user_id='{row['user_id']}', updated_at='{row['updated_at']}'")
