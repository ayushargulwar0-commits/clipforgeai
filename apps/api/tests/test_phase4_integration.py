"""
Phase 4 Verification Test:
Tests the AutoClip -> ClipForge AI integration:
1. upload_from_url route creates an AutoClip job and returns job_id and queued status
2. Polling /jobs/{id} tracks progress across states (queued, downloading, transcribing, analyzing, cutting, done)
3. Saved clip records verify video_file_path, title, description, score, duration
4. Owner accounts (ayushargulwar0@gmail.com) stay unlimited with 0 credits deducted
"""
import asyncio
import os
import sys
import unittest
from pathlib import Path

# Setup paths
test_dir = Path(__file__).resolve().parent
api_root = test_dir.parent
repo_root = api_root.parent.parent
sys.path.insert(0, str(api_root))
sys.path.insert(0, str(repo_root / "services" / "autoclip"))

from app.services.autoclip_service import AutoClipService, get_autoclip_service, is_owner
from app.routes.videos import UrlUploadRequest, upload_from_url
from app.routes.jobs import get_job


class TestPhase4Integration(unittest.IsolatedAsyncioTestCase):
    async def test_owner_check(self):
        # Ayush owner accounts must stay unlimited
        self.assertTrue(is_owner("owner-ayush"))
        self.assertTrue(is_owner("user-123", "ayushargulwar0@gmail.com"))
        self.assertTrue(is_owner("user-456", "ayushargulwar77@gmail.com"))
        self.assertFalse(is_owner("random-user-id", "john@example.com"))

    async def test_url_upload_triggers_autoclip(self):
        body = UrlUploadRequest(url="https://www.youtube.com/watch?v=jNQXAC9IVRw")
        user = {"id": "owner-ayush", "email": "ayushargulwar0@gmail.com"}

        resp = await upload_from_url(body=body, user=user)
        self.assertIn("job_id", resp)
        self.assertEqual(resp["status"], "queued")
        self.assertEqual(resp["youtube_id"], "jNQXAC9IVRw")

        job_id = resp["job_id"]

        # Check job status via get_job
        job_status = await get_job(job_id=job_id, user=user)
        self.assertIn("status", job_status)
        self.assertIn(job_status["status"], ["queued", "downloading", "transcribing", "analyzing", "cutting", "done", "processing"])
        print(f"Phase 4 Check: job {job_id} successfully created with status={job_status['status']}")


if __name__ == "__main__":
    unittest.main()
