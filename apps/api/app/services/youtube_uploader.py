"""
Production YouTube Uploader for ClipForge AI (YouTube Data API v3).

Features:
  - Resumable, chunked upload (5MB chunks) streaming directly from disk (no full-file in-memory loading)
  - Input: shorts_path (9:16 vertical), title (<= 100 chars), description (must include #Shorts), tags, privacyStatus
  - Automatic token refresh before each upload
  - Scope check: Enforces 'https://www.googleapis.com/auth/youtube.upload'
  - Exponential backoff retry on 500/502/503/504 server errors
  - Clear user-readable error mapping (quotaExceeded, invalid_grant, insufficientPermissions, uploadLimitExceeded, file missing)
  - Server-side error logging with token sanitization
  - Returns videoId and https://youtube.com/shorts/<videoId>
"""
from __future__ import annotations

import logging
import random
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from google.auth.exceptions import GoogleAuthError, RefreshError
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

from app.core.config import get_settings
from app.services.youtube_service import (
    YouTubeAuthError,
    YouTubeQuotaExceededError,
    YouTubeServiceError,
    YouTubeTokenExpiredError,
    YouTubeUploadLimitError,
    VideoValidationError,
    get_authenticated_youtube_client,
    get_user_tokens,
    validate_shorts_video,
)

logger = logging.getLogger(__name__)

CHUNK_SIZE = 5 * 1024 * 1024  # 5 MB resumable streaming chunks


class YouTubeUploader:
    @staticmethod
    def sanitize_error(err_str: str) -> str:
        """Strip potential bearer tokens or secrets from client-facing messages."""
        import re
        sanitized = re.sub(r'ya29\.[a-zA-Z0-9_\-]+', '[REDACTED_TOKEN]', err_str)
        sanitized = re.sub(r'Bearer\s+[a-zA-Z0-9_\.\-]+', 'Bearer [REDACTED]', sanitized)
        return sanitized

    @classmethod
    def upload_short(
        cls,
        user_id: str,
        shorts_path: str | Path,
        title: str,
        description: str = "",
        tags: Optional[List[str]] = None,
        privacy_status: str = "public",
        made_for_kids: bool = False,
        upload_id: Optional[str] = None,
        progress_callback: Optional[Callable[[int, str], None]] = None,
    ) -> Dict[str, Any]:
        """
        Executes a resumable chunked streaming upload of a 9:16 Short to YouTube.
        """
        file_path = Path(shorts_path)

        # 1. Verify file exists on disk
        if not file_path.is_file() or file_path.stat().st_size == 0:
            msg = f"Video file not found on disk at: {shorts_path}. Please render the 9:16 Short first in My Clips."
            logger.error("Upload aborted: %s", msg)
            raise VideoValidationError(msg)

        # 2. Validate shorts requirements (vertical, <= 180s)
        try:
            val_info = validate_shorts_video(file_path)
            logger.info("Shorts validation passed: %.1fs, %dx%d", val_info["duration"], val_info["width"], val_info["height"])
        except VideoValidationError as exc:
            logger.warning("Shorts format validation failed: %s", exc)
            raise

        # 3. Retrieve authenticated client & verify upload scope
        tokens = get_user_tokens(user_id)
        if not tokens:
            raise YouTubeAuthError("No YouTube channel connected. Please connect your channel in Settings.")

        # Check granted scopes
        granted_scopes = tokens.get("scopes") or []
        has_upload = any("youtube.upload" in str(s) for s in granted_scopes)
        if not has_upload:
            msg = (
                "Your connected YouTube account lacks upload permission. "
                "Please click 'Reconnect YouTube' and grant upload access."
            )
            logger.error("Missing youtube.upload scope for user %s. Scopes: %s", user_id, granted_scopes)
            raise YouTubeAuthError(msg)

        # Build client (automatically refreshes token)
        youtube_client, channel_info = get_authenticated_youtube_client(user_id)

        # 4. Format metadata (enforce title <= 100 chars, description with #Shorts)
        clean_title = title.strip()[:100]
        if not clean_title:
            clean_title = "Viral Short Highlight #Shorts"

        clean_desc = description.strip()
        if "#Shorts" not in clean_desc and "#shorts" not in clean_desc:
            clean_desc = f"{clean_desc}\n\n#Shorts #ClipForgeAI".strip()

        clean_tags = list(tags or ["Shorts", "ClipForge", "AI"])
        if "Shorts" not in clean_tags:
            clean_tags.append("Shorts")

        valid_privacy = privacy_status.lower() if privacy_status.lower() in ("public", "unlisted", "private") else "public"

        body = {
            "snippet": {
                "title": clean_title,
                "description": clean_desc,
                "tags": clean_tags,
                "categoryId": "22",  # People & Blogs
            },
            "status": {
                "privacyStatus": valid_privacy,
                "selfDeclaredMadeForKids": bool(made_for_kids),
            },
        }

        # 5. Streaming MediaFileUpload (reads in 5MB chunks directly from disk)
        media = MediaFileUpload(
            str(file_path),
            mimetype="video/mp4",
            chunksize=CHUNK_SIZE,
            resumable=True,
        )

        insert_request = youtube_client.videos().insert(
            part="snippet,status",
            body=body,
            media_body=media,
        )

        logger.info(
            "Starting resumable chunked upload for user %s: '%s' (%s, size: %d bytes)",
            user_id, clean_title, valid_privacy, file_path.stat().st_size
        )

        if progress_callback:
            progress_callback(5, "uploading")

        # 6. Chunked upload loop with exponential backoff on 5xx errors
        response = None
        retry_count = 0
        max_retries = 5
        backoff_factor = 1.5

        while response is None:
            try:
                chunk_status, response = insert_request.next_chunk()
                if chunk_status:
                    pct = int(chunk_status.progress() * 90) + 5
                    logger.debug("Upload chunk progress: %d%%", pct)
                    if progress_callback:
                        progress_callback(pct, "uploading")
                retry_count = 0

            except HttpError as exc:
                err_content = exc.content.decode("utf-8") if hasattr(exc, "content") else str(exc)
                logger.error("YouTube API HttpError during upload: %s", cls.sanitize_error(err_content))

                # Error mapping
                if "quotaExceeded" in err_content:
                    raise YouTubeQuotaExceededError(
                        "Daily YouTube Data API quota exceeded (1,600 units per upload). "
                        "Please request a quota extension in Google Cloud Console or try again tomorrow."
                    ) from exc

                if "uploadLimitExceeded" in err_content:
                    raise YouTubeUploadLimitError(
                        "Daily YouTube upload limit reached for your channel. "
                        "YouTube limits the number of shorts you can publish within 24 hours."
                    ) from exc

                if "invalid_grant" in err_content or "tokenExpired" in err_content:
                    raise YouTubeTokenExpiredError(
                        "YouTube authorization has expired or was revoked. Please click 'Reconnect YouTube'."
                    ) from exc

                if exc.resp.status in (401, 403):
                    if "insufficientPermissions" in err_content or "forbidden" in err_content:
                        raise YouTubeAuthError(
                            "Insufficient YouTube permissions. Please reconnect your YouTube channel and grant upload access."
                        ) from exc
                    raise YouTubeServiceError(f"YouTube upload forbidden: {cls.sanitize_error(err_content)}") from exc

                # Retry on 5xx server errors
                if exc.resp.status in (500, 502, 503, 504) and retry_count < max_retries:
                    retry_count += 1
                    sleep_time = (backoff_factor ** retry_count) + random.uniform(0.1, 1.0)
                    logger.warning("YouTube 5xx error (%d). Retrying in %.2fs (attempt %d/%d)...", exc.resp.status, sleep_time, retry_count, max_retries)
                    time.sleep(sleep_time)
                    continue

                raise YouTubeServiceError(f"YouTube API upload error: {cls.sanitize_error(err_content)}") from exc

            except (GoogleAuthError, RefreshError) as auth_exc:
                err_msg = cls.sanitize_error(str(auth_exc))
                logger.error("Google Auth Error during upload: %s", err_msg)
                raise YouTubeAuthError(f"Google OAuth authorization error: {err_msg}") from auth_exc

            except Exception as exc:
                # Network drops or disconnects
                if retry_count < max_retries:
                    retry_count += 1
                    sleep_time = (backoff_factor ** retry_count) + random.uniform(0.1, 1.0)
                    logger.warning("Network disconnect during upload chunk: %s. Retrying in %.2fs (%d/%d)...", exc, sleep_time, retry_count, max_retries)
                    time.sleep(sleep_time)
                    continue
                raise YouTubeServiceError(f"Upload interrupted after {max_retries} retries: {exc}") from exc

        # 7. Upload Completed
        video_id = response.get("id", "")
        shorts_url = f"https://youtube.com/shorts/{video_id}"
        watch_url = f"https://www.youtube.com/watch?v={video_id}"
        studio_url = f"https://studio.youtube.com/video/{video_id}/edit"

        result = {
            "video_id": video_id,
            "shorts_url": shorts_url,
            "watch_url": watch_url,
            "studio_url": studio_url,
            "title": clean_title,
            "privacy": valid_privacy,
            "duration": val_info["duration"],
            "channel_name": channel_info.get("channel_name", ""),
            "channel_id": channel_info.get("channel_id", ""),
            "published_at": datetime.now(timezone.utc).isoformat(),
        }

        if progress_callback:
            progress_callback(100, "published")

        logger.info("Successfully published YouTube Short! ID: %s, URL: %s", video_id, shorts_url)
        return result


def upload_short_video(*args, **kwargs) -> Dict[str, Any]:
    return YouTubeUploader.upload_short(*args, **kwargs)
