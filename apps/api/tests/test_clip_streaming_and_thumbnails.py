"""
Tests for clip video streaming, stream token auth, range handling (206), and timeline thumbnails.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

OWNER_HEADERS = {
    "Authorization": "Bearer owner-ayush-token",
    "X-User-Email": "ayushargulwar0@gmail.com",
    "X-User-Role": "admin",
}

CLIP_ID = "yt-clip-1794763864649-1"


def test_stream_without_auth_fails():
    """<video src> without auth or token must return 401 Unauthorized."""
    resp = client.get(f"/api/clips/{CLIP_ID}/stream")
    assert resp.status_code == 401
    assert "Not authenticated" in resp.json()["detail"]


def test_generate_stream_token():
    """POST /clips/{id}/stream-token mints a short-lived token tied to clip and user."""
    resp = client.post(f"/api/clips/{CLIP_ID}/stream-token", headers=OWNER_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["expires_in"] == 600
    return data["token"]


def test_stream_with_token_and_ranges():
    """Stream route accepts ?token= and correctly handles Range (206) queries."""
    # 1. Get token
    token = test_generate_stream_token()

    # 2. Full stream request without Range
    resp_full = client.get(f"/api/clips/{CLIP_ID}/stream?token={token}")
    assert resp_full.status_code == 200
    assert resp_full.headers["accept-ranges"] == "bytes"
    assert resp_full.headers["content-type"] == "video/mp4"
    assert int(resp_full.headers["content-length"]) > 0
    total_len = int(resp_full.headers["content-length"])

    # 3. Closed Range request
    resp_range = client.get(
        f"/api/clips/{CLIP_ID}/stream?token={token}",
        headers={"Range": "bytes=0-100"},
    )
    assert resp_range.status_code == 206
    assert resp_range.headers["accept-ranges"] == "bytes"
    assert resp_range.headers["content-range"] == f"bytes 0-100/{total_len}"
    assert resp_range.headers["content-length"] == "101"

    # 4. Open-ended Range request
    resp_open = client.get(
        f"/api/clips/{CLIP_ID}/stream?token={token}",
        headers={"Range": "bytes=0-"},
    )
    assert resp_open.status_code == 206
    assert resp_open.headers["content-range"] == f"bytes 0-{total_len - 1}/{total_len}"


def test_timeline_thumbnails():
    """GET /clips/{id}/thumbnails generates 8 thumbnail frames and returns URLs."""
    token = test_generate_stream_token()
    resp = client.get(f"/api/clips/{CLIP_ID}/thumbnails?token={token}&num_frames=8")
    assert resp.status_code == 200
    data = resp.json()
    assert "thumbnails" in data
    assert len(data["thumbnails"]) == 8
    assert all(t.endswith(".jpg") for t in data["thumbnails"])
