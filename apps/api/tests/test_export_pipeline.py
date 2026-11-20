import json
import subprocess
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import get_settings
from app.core.database import get_sqlite_clip, save_sqlite_clip, get_sqlite_conn
from app.workers.job_runner import get_job_runner, _export_jobs

client = TestClient(app)
AUTH_HEADERS = {
    "Authorization": "Bearer owner-ayush-token",
    "X-User-Email": "ayushargulwar0@gmail.com",
    "X-User-Role": "admin",
}


def test_export_pipeline_end_to_end():
    clip_id = "clip-1"
    clip = get_sqlite_clip(clip_id)
    assert clip is not None, f"Clip {clip_id} should exist in local SQLite"

    # Set up edit_json with trim and captions
    conn = get_sqlite_conn()
    edit_data = {
        "trim": {"in": 0.0, "out": 4.0},
        "aspect": "9:16",
        "framing": {
            "mode": "crop",
            "crop": {"x": 34.0, "y": 0.0, "w": 31.64, "h": 100.0},
        },
        "captions": {
            "enabled": True,
            "preset": "Firestorm Gold",
            "words": [
                {"text": "Export", "start": 0.5, "end": 1.5},
                {"text": "Captions", "start": 1.5, "end": 2.5},
                {"text": "Verified", "start": 2.5, "end": 3.5},
            ],
            "style": {"font": "Noto Sans", "size": 42},
        },
    }
    with conn:
        conn.execute(
            """
            INSERT INTO clip_edits (clip_id, user_id, edit_json, updated_at)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(clip_id) DO UPDATE SET edit_json = excluded.edit_json
            """,
            (clip_id, "owner-ayush", json.dumps(edit_data)),
        )

    # 1. Trigger export via API
    res = client.post(f"/api/clips/{clip_id}/export", headers=AUTH_HEADERS)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "job_id" in data
    job_id = data["job_id"]

    # 2. Run export synchronously via worker runner
    runner = get_job_runner()
    job_spec = _export_jobs[job_id]
    result = runner._run_export(job_spec)

    assert result is not None
    assert Path(result["output_path"]).is_file()

    # 3. Verify status endpoint
    status_res = client.get(f"/api/exports/{job_id}", headers=AUTH_HEADERS)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["download_url"] == f"/api/exports/{job_id}/download"

    # 4. Probe output file with ffprobe
    output_path = result["output_path"]
    probe_cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "stream=index,codec_name,codec_type,width,height:format=duration",
        "-of", "json",
        output_path,
    ]
    p_run = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=10)
    assert p_run.returncode == 0, p_run.stderr
    probe = json.loads(p_run.stdout)

    v_stream = next(s for s in probe["streams"] if s["codec_type"] == "video")
    a_stream = next(s for s in probe["streams"] if s["codec_type"] == "audio")

    assert v_stream["width"] == 1080
    assert v_stream["height"] == 1920
    assert v_stream["codec_name"] == "h264"
    assert a_stream["codec_name"] == "aac"

    duration = float(probe["format"]["duration"])
    assert 3.5 <= duration <= 4.5, f"Expected ~4s duration within trim, got {duration}"

    # 5. Check shorts_path persisted to clip
    updated_clip = get_sqlite_clip(clip_id)
    assert updated_clip["shorts_path"] == output_path
