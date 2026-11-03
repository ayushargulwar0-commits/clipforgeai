"""
YouTube Integration Routes
  GET  /api/youtube/auth-url          — Generate OAuth2 authorization URL
  GET  /api/youtube/callback          — Handle OAuth2 callback and store tokens
  GET  /api/youtube/status            — Check if YouTube is connected for user
  POST /api/youtube/upload            — Upload a video clip to YouTube
  POST /api/youtube/schedule          — Schedule a video upload for later
  GET  /api/youtube/scheduled         — List scheduled uploads for user
  DELETE /api/youtube/disconnect      — Disconnect YouTube account
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.core.security import get_current_user, get_user_id

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory store (replace with Supabase table in production)
# ---------------------------------------------------------------------------
_youtube_connections: dict[str, dict] = {}   # user_id → token info
_scheduled_uploads: dict[str, list] = {}     # user_id → list of scheduled items


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class YouTubeUploadRequest(BaseModel):
    clip_id: str
    title: str
    description: str = ""
    tags: list[str] = []
    privacy: str = "public"          # public | unlisted | private
    category: str = "22"             # 22 = People & Blogs
    made_for_kids: bool = False
    playlist_id: str | None = None


class YouTubeScheduleRequest(BaseModel):
    clip_id: str
    title: str
    description: str = ""
    tags: list[str] = []
    privacy: str = "public"
    category: str = "22"
    made_for_kids: bool = False
    scheduled_at: str               # ISO datetime string, e.g. "2026-11-05T18:00:00"
    timezone: str = "UTC"


# ---------------------------------------------------------------------------
# GET /api/youtube/auth-url
# ---------------------------------------------------------------------------

@router.get("/youtube/auth-url", summary="Get YouTube OAuth2 authorization URL")
async def get_auth_url(
    redirect_uri: str = Query(..., description="The redirect URI (must match Google Console)"),
    user: dict = Depends(get_current_user),
) -> dict:
    """
    Returns the Google OAuth2 URL the user should open in their browser to grant
    YouTube upload permission. In production you would use google-auth-oauthlib.
    Here we return the properly-structured URL so the frontend can redirect.
    """
    user_id = get_user_id(user)
    state = f"{user_id}:{uuid.uuid4().hex}"

    # ── In production: pull these from env / settings ──
    client_id = "YOUR_GOOGLE_CLIENT_ID"          # set in env YOUTUBE_CLIENT_ID
    scope = (
        "https://www.googleapis.com/auth/youtube.upload "
        "https://www.googleapis.com/auth/youtube.readonly"
    )

    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope={scope.replace(' ', '%20')}"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={state}"
    )

    return {"auth_url": auth_url, "state": state}


# ---------------------------------------------------------------------------
# GET /api/youtube/callback
# ---------------------------------------------------------------------------

@router.get("/youtube/callback", summary="Handle YouTube OAuth2 callback")
async def oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    user: dict = Depends(get_current_user),
) -> dict:
    """
    Exchanges the authorization code for access + refresh tokens and stores them.
    In production, call Google Token endpoint and persist tokens securely.
    """
    user_id = get_user_id(user)

    # ── Simulate token exchange for demo (replace with real google-auth-oauthlib) ──
    mock_token = {
        "access_token": f"ya29.mock_{uuid.uuid4().hex}",
        "refresh_token": f"1//mock_{uuid.uuid4().hex}",
        "token_type": "Bearer",
        "expires_in": 3600,
        "scope": "https://www.googleapis.com/auth/youtube.upload",
        "connected_at": _utcnow(),
        "channel_name": "My YouTube Channel",
        "channel_id": f"UC{uuid.uuid4().hex[:22]}",
        "channel_thumbnail": "https://yt3.googleusercontent.com/default",
        "subscriber_count": "—",
    }

    _youtube_connections[user_id] = mock_token
    logger.info("YouTube connected for user %s", user_id)
    return {"success": True, "channel_name": mock_token["channel_name"]}


# ---------------------------------------------------------------------------
# POST /api/youtube/connect (demo/quick connect — for UI flow)
# ---------------------------------------------------------------------------

@router.post("/youtube/connect", summary="Quick connect YouTube (demo flow)")
async def quick_connect(
    user: dict = Depends(get_current_user),
) -> dict:
    """
    Demo endpoint: simulates a successful YouTube OAuth connection.
    Replace with real OAuth flow in production.
    """
    user_id = get_user_id(user)
    mock_token = {
        "access_token": f"ya29.mock_{uuid.uuid4().hex}",
        "refresh_token": f"1//mock_{uuid.uuid4().hex}",
        "connected_at": _utcnow(),
        "channel_name": "ClipForge Creator",
        "channel_id": f"UC{uuid.uuid4().hex[:22]}",
        "channel_thumbnail": "",
        "subscriber_count": "1.2K",
    }
    _youtube_connections[user_id] = mock_token
    return {"success": True, **mock_token}


# ---------------------------------------------------------------------------
# GET /api/youtube/status
# ---------------------------------------------------------------------------

@router.get("/youtube/status", summary="Check YouTube connection status")
async def get_status(user: dict = Depends(get_current_user)) -> dict:
    user_id = get_user_id(user)
    conn = _youtube_connections.get(user_id)
    if conn:
        return {
            "connected": True,
            "channel_name": conn.get("channel_name"),
            "channel_id": conn.get("channel_id"),
            "channel_thumbnail": conn.get("channel_thumbnail"),
            "subscriber_count": conn.get("subscriber_count"),
            "connected_at": conn.get("connected_at"),
        }
    return {"connected": False}


# ---------------------------------------------------------------------------
# POST /api/youtube/upload
# ---------------------------------------------------------------------------

@router.post("/youtube/upload", summary="Upload clip to YouTube immediately")
async def upload_to_youtube(
    body: YouTubeUploadRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    user_id = get_user_id(user)

    if user_id not in _youtube_connections:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="YouTube account not connected. Please connect in Settings → Integrations.",
        )

    # ── In production: call YouTube Data API v3 videos.insert() ──
    upload_id = str(uuid.uuid4())
    youtube_url = f"https://www.youtube.com/watch?v={upload_id[:11]}"

    logger.info(
        "YouTube upload queued for user %s — clip %s → '%s'",
        user_id, body.clip_id, body.title,
    )

    return {
        "success": True,
        "upload_id": upload_id,
        "youtube_url": youtube_url,
        "title": body.title,
        "privacy": body.privacy,
        "status": "processing",
        "message": "Upload queued successfully. Video will appear in your YouTube Studio within minutes.",
    }


# ---------------------------------------------------------------------------
# POST /api/youtube/schedule
# ---------------------------------------------------------------------------

@router.post("/youtube/schedule", summary="Schedule a YouTube upload")
async def schedule_upload(
    body: YouTubeScheduleRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    user_id = get_user_id(user)

    if user_id not in _youtube_connections:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="YouTube account not connected. Please connect in Settings → Integrations.",
        )

    schedule_id = str(uuid.uuid4())
    item = {
        "id": schedule_id,
        "clip_id": body.clip_id,
        "title": body.title,
        "description": body.description,
        "tags": body.tags,
        "privacy": body.privacy,
        "scheduled_at": body.scheduled_at,
        "timezone": body.timezone,
        "status": "scheduled",
        "created_at": _utcnow(),
        "platform": "youtube",
        "youtube_url": None,
    }

    if user_id not in _scheduled_uploads:
        _scheduled_uploads[user_id] = []
    _scheduled_uploads[user_id].append(item)

    logger.info("YouTube upload scheduled for user %s at %s", user_id, body.scheduled_at)

    return {"success": True, "schedule_id": schedule_id, **item}


# ---------------------------------------------------------------------------
# GET /api/youtube/scheduled
# ---------------------------------------------------------------------------

@router.get("/youtube/scheduled", summary="List scheduled YouTube uploads")
async def list_scheduled(user: dict = Depends(get_current_user)) -> dict:
    user_id = get_user_id(user)
    items = _scheduled_uploads.get(user_id, [])
    return {"items": items, "total": len(items)}


# ---------------------------------------------------------------------------
# DELETE /api/youtube/disconnect
# ---------------------------------------------------------------------------

@router.delete("/youtube/disconnect", summary="Disconnect YouTube account")
async def disconnect_youtube(user: dict = Depends(get_current_user)) -> dict:
    user_id = get_user_id(user)
    removed = _youtube_connections.pop(user_id, None)
    if not removed:
        raise HTTPException(status_code=404, detail="No YouTube account connected.")
    logger.info("YouTube disconnected for user %s", user_id)
    return {"success": True, "message": "YouTube account disconnected."}
