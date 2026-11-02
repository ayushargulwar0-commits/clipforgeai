"""
Clip database service — persistence helpers for detected and rendered clips.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.models.enums import ClipStatus

logger = logging.getLogger(__name__)


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


async def save_clip_to_db(
    video_id: str,
    clip_data: dict[str, Any],
    user_id: str,
) -> dict[str, Any]:
    """
    Persist a detected clip candidate to the ``clips`` table.

    Parameters
    ----------
    video_id  : UUID of the parent video asset.
    clip_data : Dict produced by ClipDetector containing start, end, title,
                description, hook, transcript_text, score, score_explanation.
    user_id   : UUID of the owning user.

    Returns
    -------
    The inserted row as a dict.
    """
    client = get_supabase()
    clip_id = str(uuid.uuid4())
    now = _utcnow()

    start: float = float(clip_data.get("start", 0))
    end: float = float(clip_data.get("end", 0))
    duration = round(end - start, 3)

    record: dict[str, Any] = {
        "id": clip_id,
        "video_id": video_id,
        "owner_id": user_id,
        "title": clip_data.get("title", "Untitled Clip"),
        "description": clip_data.get("description"),
        "hook": clip_data.get("hook"),
        "start": start,
        "end": end,
        "duration": duration,
        "score": round(float(clip_data.get("score", 0.0)), 4),
        "score_explanation": clip_data.get("score_explanation"),
        "transcript_text": clip_data.get("transcript_text"),
        "status": ClipStatus.detected.value,
        "editing_config": {
            "aspect_ratio": "9:16",
            "add_subtitles": True,
            "subtitle_style": {},
            "custom_title": None,
            "intro_text": None,
            "outro_text": None,
            "background_music": None,
            "volume_boost": 1.0,
        },
        "rendered_path": None,
        "thumbnail_path": None,
        "created_at": now,
        "updated_at": now,
    }

    try:
        resp = client.table("clips").insert(record).execute()
    except Exception as exc:
        logger.exception("Failed to insert clip for video %s", video_id)
        raise RuntimeError(f"DB insert failed: {exc}") from exc

    if not resp.data:
        raise RuntimeError("Clip insert returned no data")

    return resp.data[0]


async def update_clip_editing_config(
    clip_id: str,
    config: dict[str, Any],
    user_id: str | None = None,
) -> dict[str, Any]:
    """
    Overwrite the ``editing_config`` JSON column for a clip.

    Parameters
    ----------
    clip_id : UUID of the clip to update.
    config  : Dict conforming to ClipEditingConfig schema.
    user_id : If provided, ownership is verified before updating.

    Returns
    -------
    The updated row as a dict.
    """
    client = get_supabase()

    # Optionally verify ownership
    if user_id:
        try:
            existing = (
                client.table("clips")
                .select("id, owner_id")
                .eq("id", clip_id)
                .single()
                .execute()
            )
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

        if not existing.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

        if existing.data.get("owner_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    try:
        resp = (
            client.table("clips")
            .update({"editing_config": config, "updated_at": _utcnow()})
            .eq("id", clip_id)
            .execute()
        )
    except Exception as exc:
        logger.exception("Failed to update editing config for clip %s", clip_id)
        raise RuntimeError(f"DB update failed: {exc}") from exc

    if not resp.data:
        raise RuntimeError("Clip update returned no data")

    return resp.data[0]


async def mark_clip_rendered(
    clip_id: str,
    rendered_path: str,
    thumbnail_path: str | None = None,
) -> None:
    """Update a clip's status to ``rendered`` and store the output path."""
    client = get_supabase()
    updates: dict[str, Any] = {
        "status": ClipStatus.rendered.value,
        "rendered_path": rendered_path,
        "updated_at": _utcnow(),
    }
    if thumbnail_path:
        updates["thumbnail_path"] = thumbnail_path

    try:
        client.table("clips").update(updates).eq("id", clip_id).execute()
    except Exception as exc:
        logger.exception("Failed to mark clip %s as rendered", clip_id)
        raise RuntimeError(f"DB update failed: {exc}") from exc


async def mark_clip_failed(clip_id: str) -> None:
    """Update a clip's status to ``failed``."""
    client = get_supabase()
    try:
        client.table("clips").update(
            {"status": ClipStatus.failed.value, "updated_at": _utcnow()}
        ).eq("id", clip_id).execute()
    except Exception as exc:
        logger.warning("Failed to mark clip %s as failed: %s", clip_id, exc)
