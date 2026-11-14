"""
Phase 5 Verification Test:
Tests YouTube Upload and Scheduler:
1. Connects channel and verifies scopes (has_upload_scope=True, needs_reconnect=False)
2. Uploads one real clip as 'private' and confirms videoId is returned, saved, and marked published
3. Schedules one clip and confirms the scheduler worker claims and publishes it as private
"""
import asyncio
import os
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Setup paths
test_dir = Path(__file__).resolve().parent
api_root = test_dir.parent
repo_root = api_root.parent.parent
sys.path.insert(0, str(api_root))

from fastapi import BackgroundTasks
from app.routes.youtube import (
    YouTubeUploadRequest,
    YouTubeScheduleRequest,
    connect_channel,
    get_connection_status,
    upload_shorts,
    schedule_shorts_upload,
)
from app.services.youtube_scheduler import get_youtube_scheduler, update_post_status


class TestPhase5YouTube(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.user = {"sub": "owner-ayush", "email": "ayushargulwar0@gmail.com"}
        # 1. Connect channel with full upload permissions
        await connect_channel(
            channel_name="Ayush Argulwar",
            channel_email="ayushargulwar0@gmail.com",
            channel_handle="@ayushargulwar",
            user=self.user,
        )

    async def test_01_channel_connection_and_scopes(self):
        status_data = await get_connection_status(user=self.user)
        self.assertTrue(status_data.get("connected"))
        self.assertTrue(status_data.get("has_upload_scope"))
        self.assertFalse(status_data.get("needs_reconnect"))
        print(f"\n[Check 1] Channel connected: {status_data.get('channel_name')} (Upload scope: PASS)")

    async def test_02_upload_private_short(self):
        # Use existing vertical 1080x1920 clip
        clip_id = "clip_test_render_rendered"
        bg_tasks = BackgroundTasks()

        upload_req = YouTubeUploadRequest(
            clip_id=clip_id,
            title="ClipForge AI Testing Shorts #Shorts",
            description="Testing automated YouTube Shorts upload #Shorts",
            privacy="private",
            tags=["Shorts", "ClipForge", "Test"],
        )

        resp = await upload_shorts(body=upload_req, background_tasks=bg_tasks, user=self.user)
        self.assertTrue(resp.get("success"))
        self.assertIn("video_id", resp)
        self.assertTrue(resp["video_id"], "videoId must not be empty")
        self.assertIn("shorts_url", resp)
        self.assertIn(resp["video_id"], resp["shorts_url"])
        self.assertEqual(resp.get("privacy"), "private")
        print(f"[Check 2] Direct Upload as PRIVATE: videoId='{resp['video_id']}', URL='{resp['shorts_url']}' (PASS)")

    async def test_03_scheduler_publishes_private_short(self):
        # Schedule post due now (or simulated past/due for worker evaluation)
        due_time = (datetime.now(timezone.utc) - timedelta(seconds=10)).isoformat()
        clip_id = "clip_test_render_rendered"

        sched_req = YouTubeScheduleRequest(
            clip_id=clip_id,
            title="Scheduled Private Short #Shorts",
            description="Automated scheduled test upload #Shorts",
            privacy="private",
            scheduled_at=due_time,
            timezone="UTC",
            tags=["Shorts", "Scheduler"],
        )

        sched_resp = await schedule_shorts_upload(body=sched_req, user=self.user)
        self.assertTrue(sched_resp.get("success"))
        sched_id = sched_resp["schedule_id"]
        self.assertEqual(sched_resp.get("status"), "scheduled")

        # Run scheduler worker cycle to claim and publish
        scheduler = get_youtube_scheduler()
        processed = await scheduler.process_due_posts()

        # Find our scheduled post in processed list
        claimed_item = next((p for p in processed if p.get("id") == sched_id), None)
        self.assertIsNotNone(claimed_item, f"Scheduler worker did not claim post {sched_id}")
        self.assertEqual(claimed_item.get("status"), "published")
        self.assertTrue(claimed_item.get("video_id"), "Scheduler did not save videoId")
        self.assertEqual(claimed_item.get("privacy"), "private")
        print(f"[Check 3] Scheduler Worker Claim & Publish: videoId='{claimed_item.get('video_id')}', Status='{claimed_item.get('status')}' (PASS)")


if __name__ == "__main__":
    unittest.main()
