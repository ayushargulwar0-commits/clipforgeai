"""
ClipForge AI — Production YouTube Data API v3 Upload & OAuth 2.0 Service.

Features:
- Google OAuth 2.0 consent flow (offline access, prompt=consent)
- AES/Fernet encryption for storing refresh tokens securely
- Auto-refresh access tokens before each upload
- Video validation (vertical 9:16, duration <= 180 seconds)
- Resumable chunked upload with MediaFileUpload (chunksize=1MB)
- Exponential backoff retry on 500/502/503/504 errors
- Real-time status tracking (queued -> uploading -> done / failed)
- Detailed error handling (quotaExceeded, invalid_grant, uploadLimitExceeded, forbidden)
"""

from __future__ import annotations

import base64
import json
import logging
import os
import random
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from cryptography.fernet import Fernet, InvalidToken
from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import google_auth_oauthlib.flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

from app.core.config import get_settings
from app.services.video_service import extract_metadata

logger = logging.getLogger(__name__)

# Required YouTube OAuth Scopes
YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

# In-memory storage for user YouTube tokens (replace/backed by Supabase table in prod)
_user_token_vault: dict[str, dict[str, Any]] = {}

# Upload job tracking: upload_id -> status dict
_upload_jobs: dict[str, dict[str, Any]] = {}


# ===========================================================================
# Custom Exceptions
# ===========================================================================

class YouTubeServiceError(Exception):
    """Base exception for YouTube service errors."""
    pass


class YouTubeAuthError(YouTubeServiceError):
    """OAuth authentication or token error."""
    pass


class YouTubeTokenExpiredError(YouTubeAuthError):
    """Token revoked or expired (invalid_grant). Reconnection required."""
    pass


class YouTubeQuotaExceededError(YouTubeServiceError):
    """Daily YouTube Data API quota exceeded."""
    pass


class YouTubeUploadLimitError(YouTubeServiceError):
    """Channel upload limit reached."""
    pass


class VideoValidationError(YouTubeServiceError):
    """Video failed Shorts format or duration checks."""
    pass


# ===========================================================================
# Token Encryption Helper (Fernet / AES)
# ===========================================================================

def _get_fernet() -> Fernet:
    """Returns Fernet cipher instance using settings.YOUTUBE_ENCRYPTION_KEY."""
    settings = get_settings()
    key = settings.YOUTUBE_ENCRYPTION_KEY.encode()
    # Ensure key is valid 32-byte base64
    try:
        return Fernet(key)
    except Exception:
        # Fallback to deterministic 32-byte url-safe base64 key
        derived = base64.urlsafe_b64encode(settings.SECRET_KEY[:32].encode().ljust(32, b"0"))
        return Fernet(derived)


def encrypt_token(plain_token: str) -> str:
    """Encrypts a sensitive refresh token for secure persistence."""
    if not plain_token:
        return ""
    cipher = _get_fernet()
    encrypted_bytes = cipher.encrypt(plain_token.encode("utf-8"))
    return encrypted_bytes.decode("utf-8")


def decrypt_token(encrypted_token: str) -> str:
    """Decrypts a stored refresh token."""
    if not encrypted_token:
        return ""
    cipher = _get_fernet()
    try:
        decrypted_bytes = cipher.decrypt(encrypted_token.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except InvalidToken as exc:
        logger.error("Failed to decrypt YouTube refresh token: %s", exc)
        raise YouTubeAuthError("Decryption failed. Please reconnect your YouTube channel.") from exc


# ===========================================================================
# OAuth 2.0 Flow
# ===========================================================================

def get_client_config(redirect_uri: str | None = None) -> dict[str, Any]:
    """Generates Google OAuth client configuration dict from app settings."""
    settings = get_settings()
    redirect = redirect_uri or settings.YOUTUBE_REDIRECT_URI

    if not settings.YOUTUBE_CLIENT_ID or not settings.YOUTUBE_CLIENT_SECRET:
        logger.warning("YouTube Client ID or Secret is not configured in environment.")

    return {
        "web": {
            "client_id": settings.YOUTUBE_CLIENT_ID or "YOUR_GOOGLE_CLIENT_ID",
            "client_secret": settings.YOUTUBE_CLIENT_SECRET or "YOUR_GOOGLE_CLIENT_SECRET",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect],
        }
    }


def create_oauth_flow(redirect_uri: str | None = None, state: str | None = None) -> google_auth_oauthlib.flow.Flow:
    """Creates a Google OAuth 2.0 Flow instance."""
    settings = get_settings()
    redirect = redirect_uri or settings.YOUTUBE_REDIRECT_URI
    client_config = get_client_config(redirect)

    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        client_config=client_config,
        scopes=YOUTUBE_SCOPES,
        state=state,
    )
    flow.redirect_uri = redirect
    return flow


def generate_authorization_url(user_id: str, redirect_uri: str | None = None) -> tuple[str, str]:
    """
    Generates the Google OAuth 2.0 consent URL.
    Enforces offline access and consent prompt to ensure refresh_token is returned.
    """
    state_payload = {
        "user_id": user_id,
        "nonce": os.urandom(8).hex(),
        "ts": int(time.time()),
    }
    state = base64.urlsafe_b64encode(json.dumps(state_payload).encode()).decode()

    flow = create_oauth_flow(redirect_uri=redirect_uri, state=state)
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
    )
    return auth_url, state


def exchange_code_for_tokens(code: str, redirect_uri: str | None = None, state: str | None = None) -> dict[str, Any]:
    """
    Exchanges authorization code for credentials, fetches channel metadata,
    and returns token bundle with encrypted refresh token.
    """
    flow = create_oauth_flow(redirect_uri=redirect_uri, state=state)
    flow.fetch_token(code=code)
    creds: Credentials = flow.credentials

    # Extract user identity & YouTube channel
    youtube = build("youtube", "v3", credentials=creds)
    channel_name = "My YouTube Channel"
    channel_id = ""
    channel_handle = ""
    thumbnail_url = ""
    subscriber_count = ""

    try:
        channel_resp = youtube.channels().list(mine=True, part="snippet,statistics").execute()
        items = channel_resp.get("items", [])
        if items:
            item = items[0]
            channel_id = item.get("id", "")
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})
            channel_name = snippet.get("title", channel_name)
            channel_handle = snippet.get("customUrl", "")
            thumbnail_url = snippet.get("thumbnails", {}).get("default", {}).get("url", "")
            sub_count = stats.get("subscriberCount", "")
            subscriber_count = f"{int(sub_count):,} subscribers" if sub_count.isdigit() else ""
    except Exception as exc:
        logger.warning("Could not fetch YouTube channel details: %s", exc)

    encrypted_refresh = encrypt_token(creds.refresh_token or "")

    return {
        "access_token": creds.token,
        "refresh_token_encrypted": encrypted_refresh,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "scopes": creds.scopes,
        "expiry": creds.expiry.isoformat() if creds.expiry else None,
        "channel_name": channel_name,
        "channel_id": channel_id,
        "channel_handle": channel_handle,
        "channel_thumbnail": thumbnail_url,
        "subscriber_count": subscriber_count,
        "connected_at": datetime.now(timezone.utc).isoformat(),
    }


def save_user_tokens(user_id: str, token_data: dict[str, Any]) -> None:
    """Saves user token data into secure vault (in-memory & ready for DB)."""
    _user_token_vault[user_id] = token_data
    logger.info("Saved YouTube credentials for user: %s (Channel: %s)", user_id, token_data.get("channel_name"))


def get_user_tokens(user_id: str) -> dict[str, Any] | None:
    """Retrieves token data for user."""
    return _user_token_vault.get(user_id)


def remove_user_tokens(user_id: str) -> bool:
    """Removes stored tokens for user upon disconnect."""
    return bool(_user_token_vault.pop(user_id, None))


def get_authenticated_youtube_client(user_id: str) -> tuple[Any, dict[str, Any]]:
    """
    Loads user credentials, automatically refreshes the access token if expired,
    and returns a ready YouTube v3 API service client.
    """
    token_data = get_user_tokens(user_id)
    if not token_data:
        raise YouTubeAuthError("No YouTube channel connected. Please connect in Settings.")

    settings = get_settings()
    refresh_token = decrypt_token(token_data.get("refresh_token_encrypted", ""))
    access_token = token_data.get("access_token")

    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=settings.YOUTUBE_CLIENT_ID or token_data.get("client_id"),
        client_secret=settings.YOUTUBE_CLIENT_SECRET,
        scopes=token_data.get("scopes", YOUTUBE_SCOPES),
    )

    # Automatically refresh if expired or missing access token
    if not creds.valid:
        try:
            creds.refresh(Request())
            # Update cache with refreshed access token
            token_data["access_token"] = creds.token
            if creds.expiry:
                token_data["expiry"] = creds.expiry.isoformat()
            logger.info("Successfully refreshed access token for user %s", user_id)
        except RefreshError as exc:
            err_msg = str(exc).lower()
            if "invalid_grant" in err_msg or "revoked" in err_msg:
                # Remove stale credentials
                remove_user_tokens(user_id)
                raise YouTubeTokenExpiredError(
                    "YouTube authorization has expired or was revoked. Please reconnect your channel."
                ) from exc
            raise YouTubeAuthError(f"Could not refresh YouTube credentials: {exc}") from exc

    youtube_client = build("youtube", "v3", credentials=creds, cache_discovery=False)
    return youtube_client, token_data


# ===========================================================================
# Video Validation Before Upload
# ===========================================================================

def validate_shorts_video(file_path: str | Path) -> dict[str, Any]:
    """
    Validates that the file meets YouTube Shorts requirements:
    1. File exists and has size > 0
    2. Duration <= 180 seconds (YouTube Shorts allows up to 3 minutes)
    3. Aspect ratio is vertical (9:16 aspect ratio or height > width)
    """
    path = Path(file_path)
    if not path.is_file():
        raise VideoValidationError(f"Video file not found at: {file_path}")

    file_size = path.stat().st_size
    if file_size == 0:
        raise VideoValidationError("Video file is empty (0 bytes).")

    meta = extract_metadata(str(path))
    duration = float(meta.get("duration") or 0.0)
    width = int(meta.get("width") or 0)
    height = int(meta.get("height") or 0)

    # 1. Duration check (<= 180 seconds)
    if duration > 180.5:
        raise VideoValidationError(
            f"Video duration ({duration:.1f}s) exceeds YouTube Shorts maximum limit of 180 seconds (3 minutes)."
        )

    # 2. Aspect ratio check (vertical video)
    if width > 0 and height > 0:
        aspect_ratio = width / height
        if aspect_ratio > 1.05:
            raise VideoValidationError(
                f"Video has horizontal aspect ratio ({width}x{height}, {aspect_ratio:.2f}). "
                "YouTube Shorts requires vertical (9:16, e.g. 1080x1920) or square (1:1) video."
            )

    return {
        "file_path": str(path),
        "file_size": file_size,
        "duration": duration,
        "width": width,
        "height": height,
        "is_valid": True,
    }


# ===========================================================================
# Resumable Chunked Upload Function with Exponential Backoff
# ===========================================================================

def upload_short_to_youtube(
    user_id: str,
    file_path: str | Path,
    title: str,
    description: str = "",
    tags: list[str] | None = None,
    privacy_status: str = "public",
    made_for_kids: bool = False,
    progress_callback: Callable[[int, str], None] | None = None,
    upload_id: str | None = None,
) -> dict[str, Any]:
    """
    Uploads a short video to YouTube using resumable chunked upload with exponential backoff.

    Lifecycle:
    - Step 1: Validate file (vertical 9:16, <= 180s)
    - Step 2: Auto-refresh access token via OAuth 2.0
    - Step 3: Build metadata (append #Shorts, categoryId=22)
    - Step 4: Chunked upload (1MB chunks) with progress updates
    - Step 5: Return https://youtube.com/shorts/<video_id>
    """
    upload_id = upload_id or f"up-{int(time.time())}-{random.randint(1000, 9999)}"

    def _update_status(status: str, progress: int = 0, error: str | None = None, result: dict | None = None):
        _upload_jobs[upload_id] = {
            "upload_id": upload_id,
            "user_id": user_id,
            "status": status,
            "progress": progress,
            "error": error,
            "result": result,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if progress_callback:
            try:
                progress_callback(progress, status)
            except Exception:
                pass

    _update_status(status="queued", progress=0)

    # 1. Validate Video
    try:
        val_info = validate_shorts_video(file_path)
    except VideoValidationError as exc:
        _update_status(status="failed", error=str(exc))
        raise

    # 2. Authenticate
    try:
        youtube, channel_info = get_authenticated_youtube_client(user_id)
    except Exception as exc:
        _update_status(status="failed", error=str(exc))
        raise

    # 3. Format Metadata (Guarantee #Shorts in description/title)
    final_title = title.strip()[:100]
    final_desc = description.strip()
    if "#Shorts" not in final_desc and "#shorts" not in final_desc:
        final_desc = f"{final_desc}\n\n#Shorts #ClipForge".strip()

    final_tags = tags or ["Shorts", "ClipForge", "AI"]
    if "Shorts" not in final_tags:
        final_tags.append("Shorts")

    valid_privacy = privacy_status.lower() if privacy_status.lower() in ("public", "unlisted", "private") else "public"

    body = {
        "snippet": {
            "title": final_title,
            "description": final_desc,
            "tags": final_tags,
            "categoryId": "22",  # 22 = People & Blogs
        },
        "status": {
            "privacyStatus": valid_privacy,
            "selfDeclaredMadeForKids": bool(made_for_kids),
        },
    }

    # 4. Initialize Resumable MediaFileUpload (1MB chunks)
    CHUNK_SIZE = 1024 * 1024  # 1 MB chunk
    media = MediaFileUpload(
        str(file_path),
        mimetype="video/mp4",
        chunksize=CHUNK_SIZE,
        resumable=True,
    )

    insert_request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    _update_status(status="uploading", progress=5)

    # 5. Execute Chunked Upload with Exponential Backoff
    response = None
    retry_count = 0
    max_retries = 5
    backoff_factor = 1.5

    while response is None:
        try:
            status, response = insert_request.next_chunk()
            if status:
                progress_pct = int(status.progress() * 90) + 5  # 5% to 95%
                _update_status(status="uploading", progress=progress_pct)
                logger.debug("Upload %s progress: %d%%", upload_id, progress_pct)
            retry_count = 0  # Reset retry on successful chunk

        except HttpError as exc:
            err_content = exc.content.decode("utf-8") if hasattr(exc, "content") else str(exc)

            # Check for YouTube API specific errors
            if "quotaExceeded" in err_content:
                msg = (
                    "Daily YouTube Data API quota exceeded. Video uploads consume 1,600 units out of "
                    "the 10,000 daily default quota. Please request a quota extension in Google Cloud Console "
                    "or try again tomorrow."
                )
                _update_status(status="failed", error=msg)
                raise YouTubeQuotaExceededError(msg) from exc

            if "uploadLimitExceeded" in err_content:
                msg = (
                    "Daily channel upload limit reached on YouTube. Check your channel upload limit in YouTube Studio."
                )
                _update_status(status="failed", error=msg)
                raise YouTubeUploadLimitError(msg) from exc

            if exc.resp.status in (401, 403):
                if "invalid_grant" in err_content or "tokenExpired" in err_content:
                    msg = "YouTube OAuth token has expired. Please reconnect your account."
                    _update_status(status="failed", error=msg)
                    raise YouTubeTokenExpiredError(msg) from exc
                msg = f"YouTube API access forbidden (HTTP {exc.resp.status}): {err_content}"
                _update_status(status="failed", error=msg)
                raise YouTubeServiceError(msg) from exc

            # Retry on 5xx Server Errors with Exponential Backoff
            if exc.resp.status in (500, 502, 503, 504) and retry_count < max_retries:
                retry_count += 1
                sleep_time = (backoff_factor ** retry_count) + random.uniform(0.1, 1.0)
                logger.warning(
                    "YouTube 5xx error (status %d). Retrying in %.2fs (attempt %d/%d)...",
                    exc.resp.status, sleep_time, retry_count, max_retries
                )
                time.sleep(sleep_time)
                continue

            msg = f"YouTube upload failed with HTTP error: {exc}"
            _update_status(status="failed", error=msg)
            raise YouTubeServiceError(msg) from exc

        except Exception as exc:
            # Network drops, connection resets
            if retry_count < max_retries:
                retry_count += 1
                sleep_time = (backoff_factor ** retry_count) + random.uniform(0.1, 1.0)
                logger.warning(
                    "Network error during upload chunk: %s. Retrying in %.2fs (%d/%d)...",
                    exc, sleep_time, retry_count, max_retries
                )
                time.sleep(sleep_time)
                continue

            msg = f"Upload failed after {max_retries} retries: {exc}"
            _update_status(status="failed", error=msg)
            raise YouTubeServiceError(msg) from exc

    # 6. Upload Finished Successfully
    video_id = response.get("id", "")
    shorts_url = f"https://youtube.com/shorts/{video_id}"
    watch_url = f"https://www.youtube.com/watch?v={video_id}"

    result_data = {
        "upload_id": upload_id,
        "video_id": video_id,
        "shorts_url": shorts_url,
        "watch_url": watch_url,
        "studio_url": f"https://studio.youtube.com/video/{video_id}/edit",
        "title": final_title,
        "privacy": valid_privacy,
        "duration": val_info["duration"],
        "channel_name": channel_info.get("channel_name", ""),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }

    _update_status(status="done", progress=100, result=result_data)
    logger.info("Shorts upload complete! URL: %s", shorts_url)
    return result_data


def get_upload_status(upload_id: str) -> dict[str, Any] | None:
    """Returns current status and progress of an upload job."""
    return _upload_jobs.get(upload_id)
