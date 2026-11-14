import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

api_dir = Path(__file__).resolve().parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from app.main import app
from app.core.security import create_access_token


@pytest.fixture
def auth_client():
    token = create_access_token({"sub": "user-editor-test", "email": "creator@example.com", "role": "user"})
    client = TestClient(app)
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


def test_clip_edit_lifecycle_and_validation(auth_client):
    clip_id = "test-clip-phase6a"

    # 1. GET initial default
    r_get = auth_client.get(f"/api/clips/{clip_id}/edit")
    assert r_get.status_code == 200, r_get.text
    data = r_get.json()
    assert data["clip_id"] == clip_id
    edit_json = data["edit_json"]
    assert edit_json["aspect"] == "9:16"
    assert "trim" in edit_json
    assert "framing" in edit_json

    # 2. PUT invalid trim (> 180s)
    bad_payload = {
        "edit_json": {
            "trim": {"in": 0.0, "out": 200.0},
            "aspect": "9:16",
            "framing": {
                "mode": "crop",
                "crop": {"x": 10.0, "y": 0.0, "w": 30.0, "h": 100.0},
                "split": {"top": {"x": 0.0, "y": 0.0, "w": 100.0, "h": 50.0}, "bottom": {"x": 0.0, "y": 50.0, "w": 100.0, "h": 50.0}},
            },
            "background": {"type": "blur", "value": "#000000"},
            "captions": {"enabled": True, "style": "default", "words": []},
        }
    }
    r_bad = auth_client.put(f"/api/clips/{clip_id}/edit", json=bad_payload)
    assert r_bad.status_code == 422, "Should reject trim > 180s"

    # 3. PUT valid edit
    valid_payload = {
        "edit_json": {
            "trim": {"in": 5.0, "out": 45.0},
            "aspect": "9:16",
            "framing": {
                "mode": "crop",
                "crop": {"x": 25.5, "y": 0.0, "w": 31.64, "h": 100.0},
                "split": {"top": {"x": 0.0, "y": 0.0, "w": 100.0, "h": 50.0}, "bottom": {"x": 0.0, "y": 50.0, "w": 100.0, "h": 50.0}},
            },
            "background": {"type": "solid", "value": "#1e1e2e"},
            "captions": {"enabled": True, "style": "bold-yellow", "words": []},
            "outro": None,
            "watermark": None,
        }
    }
    r_put = auth_client.put(f"/api/clips/{clip_id}/edit", json=valid_payload)
    assert r_put.status_code == 200, r_put.text
    put_data = r_put.json()
    assert put_data["edit_json"]["trim"]["in"] == 5.0
    assert put_data["edit_json"]["trim"]["out"] == 45.0
    assert put_data["edit_json"]["framing"]["crop"]["x"] == 25.5

    # 4. GET again and confirm restored
    r_get2 = auth_client.get(f"/api/clips/{clip_id}/edit")
    assert r_get2.status_code == 200
    restored = r_get2.json()["edit_json"]
    assert restored["trim"]["in"] == 5.0
    assert restored["trim"]["out"] == 45.0
    assert restored["framing"]["crop"]["x"] == 25.5
    assert restored["background"]["value"] == "#1e1e2e"

    # 5. POST auto-frame
    r_af = auth_client.post(f"/api/clips/{clip_id}/auto-frame?aspect=9:16")
    assert r_af.status_code == 200
    af_data = r_af.json()
    assert "crop" in af_data
    assert af_data["crop"]["w"] == 31.64
    assert af_data["crop"]["h"] == 100.0
