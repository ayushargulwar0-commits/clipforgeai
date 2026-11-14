"""
Phase 3 Verification Script:
Verifies:
1. 1080x1920 vertical format
2. Duration <= 60s
3. Audio stream present
4. Frame extraction at 5s (ffmpeg -ss 5 -frames:v 1)
5. Captions and metadata in GET /jobs/{id}/clips
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path

# Paths
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))

os.environ["AUTOCLIP_INTERNAL_TOKEN"] = "test-token-phase3"
os.environ["SHARED_CLIPS_DIR"] = str(root_dir / "data" / "clips")

from fastapi.testclient import TestClient
from backend.internal_server import app

client = TestClient(app)
headers = {"X-Internal-Token": "test-token-phase3"}

print("1. Submitting test video for Phase 3 Shorts Generation...")
post_res = client.post(
    "/jobs",
    json={
        "youtube_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
        "max_clips": 1,
        "min_sec": 10,
        "max_sec": 18,
        "burn_captions": True,
    },
    headers=headers,
)
assert post_res.status_code == 202, f"Failed job creation: {post_res.text}"
job_id = post_res.json()["id"]
print(f"   Job submitted! ID: {job_id}")

print("2. Polling job until complete...")
max_wait = 120
start_t = time.time()
job_done = False

while time.time() - start_t < max_wait:
    res = client.get(f"/jobs/{job_id}", headers=headers)
    assert res.status_code == 200, f"Error getting status: {res.text}"
    data = res.json()
    st = data["status"]
    pr = data["progress"]
    print(f"   Progress: {pr}% ({st})")

    if st == "done":
        job_done = True
        break
    elif st == "failed":
        raise RuntimeError(f"Job failed: {data.get('error')}")

    time.sleep(3)

assert job_done, "Job timed out"

print("3. Querying GET /jobs/{id}/clips...")
clips_res = client.get(f"/jobs/{job_id}/clips", headers=headers)
assert clips_res.status_code == 200, f"Failed getting clips: {clips_res.text}"
clips = clips_res.json()
assert len(clips) >= 1, "Expected at least 1 clip"

clip = clips[0]
print(f"   Title: {clip['title']}")
print(f"   Description: {clip['description']}")
print(f"   Hook: {clip.get('hook_text')}")
print(f"   Horizontal File: {clip['file_path']}")
print(f"   Shorts 9:16 File: {clip['shorts_path']}")
print(f"   Caption File: {clip['caption_path']}")

shorts_file = clip["shorts_path"]
assert os.path.isfile(shorts_file), f"Shorts file does not exist: {shorts_file}"

print("4. Inspecting shorts video with ffprobe...")
ffprobe_cmd = [
    "ffprobe",
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    shorts_file,
]
probe_proc = subprocess.run(ffprobe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
probe_data = json.loads(probe_proc.stdout)

video_stream = None
audio_stream = None
for s in probe_data.get("streams", []):
    if s.get("codec_type") == "video":
        video_stream = s
    elif s.get("codec_type") == "audio":
        audio_stream = s

assert video_stream is not None, "No video stream found"
width = int(video_stream.get("width", 0))
height = int(video_stream.get("height", 0))
duration = float(probe_data.get("format", {}).get("duration", 0))

print(f"   ffprobe Resolution: {width}x{height} (Target: 1080x1920)")
print(f"   ffprobe Duration: {duration:.2f}s (Target: <= 60s)")
print(f"   ffprobe Audio: {'PRESENT (' + audio_stream.get('codec_name', '') + ')' if audio_stream else 'MISSING'}")

assert width == 1080, f"Expected width 1080, got {width}"
assert height == 1920, f"Expected height 1920, got {height}"
assert duration <= 60.0, f"Duration {duration}s exceeds 60s hard cap"
assert audio_stream is not None, "Audio stream is missing from shorts video"

print("5. Extracting frame at 5 seconds with ffmpeg...")
frame_path = Path(shorts_file).parent / "frame_sample_ss5.jpg"
extract_cmd = [
    "ffmpeg", "-y",
    "-ss", "5",
    "-i", shorts_file,
    "-frames:v", "1",
    str(frame_path)
]
subprocess.run(extract_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
assert frame_path.exists(), "Extracted frame file does not exist"
assert frame_path.stat().st_size > 1000, "Extracted frame file too small"
print(f"   Frame extracted successfully at 5s! Size: {frame_path.stat().st_size} bytes: {frame_path}")

print("\n>>> ALL PHASE 3 SHORTS VERIFICATION CHECKS PASSED (1080x1920, <=60s, AUDIO, FRAME CAPTURE)! <<<")
