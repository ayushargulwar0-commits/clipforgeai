"""
Phase 2 Service Verification Script.
Starts AutoClip internal engine, submits a short public YouTube video,
polls status until complete, and verifies that GET /jobs/{id}/clips returns
at least 1 real clip file that exists on disk.
"""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path

# Setup paths
root_dir = Path(__file__).parent
sys.path.insert(0, str(root_dir))

# Configure environment for local test
os.environ["AUTOCLIP_INTERNAL_TOKEN"] = "test-token-12345"
os.environ["SHARED_CLIPS_DIR"] = str(root_dir / "data" / "clips")
os.environ["LLM_PROVIDER"] = "gemini"

from fastapi.testclient import TestClient
from backend.internal_server import app

client = TestClient(app)

print("1. Testing health check...")
res = client.get("/health")
assert res.status_code == 200, f"Health check failed: {res.text}"
print("   Health check passed:", res.json())

print("2. Testing auth protection...")
unauth_res = client.post("/jobs", json={"youtube_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"})
assert unauth_res.status_code == 403, f"Expected 403, got {unauth_res.status_code}"
print("   Auth check passed: 403 returned without valid X-Internal-Token.")

print("3. Submitting short public YouTube video (< 1 min: First YouTube Video 'Me at the zoo')...")
headers = {"X-Internal-Token": "test-token-12345"}
post_res = client.post(
    "/jobs",
    json={
        "youtube_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
        "max_clips": 1,
        "min_sec": 10,
        "max_sec": 19,
    },
    headers=headers,
)
assert post_res.status_code == 202, f"Job creation failed: {post_res.text}"
job_id = post_res.json()["id"]
print(f"   Job created successfully! ID: {job_id}")

print("4. Polling job status until done...")
max_wait = 120  # up to 2 minutes
start_time = time.time()
job_done = False

while time.time() - start_time < max_wait:
    status_res = client.get(f"/jobs/{job_id}", headers=headers)
    assert status_res.status_code == 200, f"Failed getting status: {status_res.text}"
    status_data = status_res.json()
    curr_status = status_data["status"]
    curr_prog = status_data["progress"]
    print(f"   Progress: {curr_prog}% (status: {curr_status})")

    if curr_status == "done":
        job_done = True
        break
    elif curr_status == "failed":
        raise RuntimeError(f"Job failed: {status_data.get('error')}")

    time.sleep(3)

assert job_done, f"Job did not complete within {max_wait}s"

print("5. Verifying clips output from GET /jobs/{id}/clips...")
clips_res = client.get(f"/jobs/{job_id}/clips", headers=headers)
assert clips_res.status_code == 200, f"Failed getting clips: {clips_res.text}"
clips = clips_res.json()
print(f"   Retrieved {len(clips)} clip(s):")
assert len(clips) >= 1, "Expected at least 1 clip"

first_clip = clips[0]
print(f"   Clip title: {first_clip['title']}")
print(f"   Clip file path: {first_clip['file_path']}")
print(f"   Clip duration: {first_clip['duration']}s")
assert os.path.isfile(first_clip["file_path"]), f"Clip file does not exist on disk: {first_clip['file_path']}"
file_size = os.path.getsize(first_clip["file_path"])
print(f"   Clip file size on disk: {file_size} bytes")
assert file_size > 1000, f"Clip file is too small: {file_size} bytes"

print("\n>>> ALL PHASE 2 SERVICE CHECKS PASSED SUCCESSFULLY! <<<")
