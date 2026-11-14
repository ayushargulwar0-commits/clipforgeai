"""
One-off real end-to-end YouTube upload test.
Directly invokes YouTube Data API v3 videos.insert (resumable chunked streaming from disk).
"""
import asyncio
import json
import logging
import os
import re
import sys
from pathlib import Path

# Setup paths
repo_root = Path(__file__).resolve().parent.parent
api_root = repo_root / "apps" / "api"
sys.path.insert(0, str(api_root))

from app.core.config import get_settings
from app.services.youtube_service import get_user_tokens, save_user_tokens
from app.services.youtube_uploader import YouTubeUploader


def sanitize_tokens(text: str) -> str:
    cleaned = re.sub(r'ya29\.[a-zA-Z0-9_\-]+', '[REDACTED_ACCESS_TOKEN]', text)
    cleaned = re.sub(r'Bearer\s+[a-zA-Z0-9_\.\-]+', 'Bearer [REDACTED]', cleaned)
    cleaned = re.sub(r'"refresh_token":\s*"[^"]+"', '"refresh_token": "[REDACTED]"', cleaned)
    cleaned = re.sub(r'"access_token":\s*"[^"]+"', '"access_token": "[REDACTED]"', cleaned)
    cleaned = re.sub(r'refresh_token=[^&\s]+', 'refresh_token=[REDACTED]', cleaned)
    return cleaned


def main():
    settings = get_settings()
    user_id = os.getenv("TEST_USER_ID", "owner-ayush")

    print(f"============================================================")
    print(f"ClipForge AI — Real YouTube Data API v3 Upload Test")
    print(f"============================================================")

    # 1. Load stored credentials from DB / disk vault
    tokens = get_user_tokens(user_id)
    if not tokens:
        # Check alternative common user IDs
        for alt_id in ["default-user", "admin", "user-123"]:
            tokens = get_user_tokens(alt_id)
            if tokens:
                user_id = alt_id
                break

    # If still not found, seed user credentials from connect_channel
    if not tokens:
        from app.routes.youtube import connect_channel
        import asyncio
        user_info = {"sub": user_id, "email": "ayushargulwar0@gmail.com"}
        loop = asyncio.new_event_loop()
        res = loop.run_until_complete(
            connect_channel(
                channel_name="Ayush Argulwar",
                channel_email="ayushargulwar0@gmail.com",
                channel_handle="@ayushargulwar",
                user=user_info,
            )
        )
        tokens = get_user_tokens(user_id)

    if not tokens:
        print(f"[ERROR] No stored credentials found in DB/vault for user '{user_id}'.")
        sys.exit(1)

    print(f"User ID:           {user_id}")
    print(f"Connected Channel: {tokens.get('channel_name')} ({tokens.get('channel_handle', '@creator')})")

    # 2. Print granted scopes
    scopes = tokens.get("scopes") or []
    print(f"Granted Scopes:")
    for s in scopes:
        print(f"  - {s}")

    has_upload = any("youtube.upload" in str(s) for s in scopes)
    if not has_upload:
        print(f"[ERROR] Missing required scope 'https://www.googleapis.com/auth/youtube.upload'. Please reconnect channel.")
        sys.exit(1)

    # 3. Locate real rendered 9:16 vertical clip
    candidates = [
        settings.storage_clips_dir / "clip_test_render_rendered.mp4",
        settings.storage_clips_dir / "clip_test_outro_call_rendered.mp4",
        api_root / "storage" / "clips" / "clip_test_render_rendered.mp4",
    ]
    clip_path = None
    for c in candidates:
        if c.is_file():
            clip_path = c
            break

    if not clip_path:
        if settings.storage_clips_dir.exists():
            for f in settings.storage_clips_dir.glob("*.mp4"):
                if f.is_file():
                    clip_path = f
                    break

    if not clip_path or not clip_path.is_file():
        print(f"[ERROR] No rendered 9:16 MP4 clip found in {settings.storage_clips_dir}.")
        sys.exit(1)

    print(f"Target Clip:       {clip_path.name} ({clip_path.stat().st_size:,} bytes)")
    print(f"Upload Mode:       privacyStatus = private")
    print(f"Executing Google YouTube Data API v3 resumable chunked upload...")

    # 4. Execute Real Upload
    try:
        result = YouTubeUploader.upload_short(
            user_id=user_id,
            shorts_path=clip_path,
            title="ClipForge AI Shorts Production Upload #Shorts",
            description="Automated production upload test from ClipForge AI.\n#Shorts #ClipForge",
            privacy_status="private",
            tags=["Shorts", "AI", "ProductionTest"],
        )

        video_id = result.get("video_id")
        shorts_url = result.get("shorts_url")

        print(f"------------------------------------------------------------")
        print(f"[SUCCESS] Real YouTube Upload Completed!")
        print(f"Video ID:          {video_id}")
        print(f"Shorts URL:        {shorts_url}")
        print(f"Watch URL:         {result.get('watch_url')}")
        print(f"Privacy:           {result.get('privacy')}")
        print(f"Published At:      {result.get('published_at')}")
        print(f"------------------------------------------------------------")
        return video_id

    except Exception as exc:
        raw_error = str(exc)
        sanitized = sanitize_tokens(raw_error)
        print(f"------------------------------------------------------------")
        print(f"[GOOGLE_API_ERROR]")
        print(f"Error Message: {sanitized}")

        # Print full response if available on exception
        if hasattr(exc, "content"):
            content_decoded = exc.content.decode("utf-8", errors="replace")
            print(f"Response Body: {sanitize_tokens(content_decoded)}")
        if hasattr(exc, "resp"):
            print(f"HTTP Status:   {getattr(exc.resp, 'status', 'Unknown')}")
            print(f"Reason:        {getattr(exc.resp, 'reason', 'Unknown')}")
        print(f"------------------------------------------------------------")
        sys.exit(2)


if __name__ == "__main__":
    main()
