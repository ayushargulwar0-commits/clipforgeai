"""
Real Scheduler test for YouTube Shorts.
Evaluates due scheduled posts and calls the real YouTube Data API v3 upload.
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Setup paths
repo_root = Path(__file__).resolve().parent.parent
api_root = repo_root / "apps" / "api"
sys.path.insert(0, str(api_root))

from app.routes.youtube import YouTubeScheduleRequest, schedule_shorts_upload
from app.services.youtube_scheduler import get_youtube_scheduler


def main():
    user = {"sub": "owner-ayush", "email": "ayushargulwar0@gmail.com"}
    due_time = (datetime.now(timezone.utc) - timedelta(seconds=5)).isoformat()
    clip_id = "clip_test_render_rendered"

    print("============================================================")
    print("ClipForge AI — Real Scheduler Worker Test")
    print("============================================================")
    print(f"Scheduling post for: {due_time} UTC (Privacy: private)")

    sched_req = YouTubeScheduleRequest(
        clip_id=clip_id,
        title="Automated Scheduled Short #Shorts",
        description="Testing automated scheduler #Shorts",
        privacy="private",
        scheduled_at=due_time,
        timezone="UTC",
        tags=["Shorts", "SchedulerTest"],
    )

    loop = asyncio.new_event_loop()
    sched_resp = loop.run_until_complete(schedule_shorts_upload(body=sched_req, user=user))
    sched_id = sched_resp["schedule_id"]
    print(f"Post Scheduled: ID='{sched_id}', Status='{sched_resp.get('status')}'")

    print("Executing Scheduler Worker process_due_posts()...")
    scheduler = get_youtube_scheduler()
    processed = loop.run_until_complete(scheduler.process_due_posts())

    claimed = next((p for p in processed if p.get("id") == sched_id), None)
    if not claimed:
        # Check database directly for this post status
        from app.services.youtube_scheduler import _read_scheduled_db
        db_posts = _read_scheduled_db()
        claimed = next((p for p in db_posts if p.get("id") == sched_id), None)

    print("------------------------------------------------------------")
    if claimed:
        status = claimed.get("status")
        video_id = claimed.get("video_id")
        error = claimed.get("error")
        print(f"Scheduled Post ID: {sched_id}")
        print(f"Worker Status:     {status}")
        if video_id:
            print(f"Video ID:          {video_id}")
            print(f"Shorts URL:        {claimed.get('youtube_url')}")
        if error:
            print(f"[GOOGLE_API_ERROR]")
            print(f"Error Message:     {error}")
    else:
        print(f"[ERROR] Post {sched_id} was not claimed by the worker.")
    print("------------------------------------------------------------")


if __name__ == "__main__":
    main()
