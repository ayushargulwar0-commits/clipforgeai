"""
Usage service — credit management and usage statistics.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from app.core.database import get_supabase

logger = logging.getLogger(__name__)

# Credit costs per action
CREDIT_COSTS: dict[str, int] = {
    "transcription": 2,
    "clip_detection": 1,
    "render_minute": 5,   # per minute of output video
    "render_flat": 10,    # flat fee per render
}


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _first_of_month() -> str:
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()


async def get_user_usage(user_id: str) -> dict:
    """
    Return a dict of usage stats and credit balance for the given user.

    Queries ``user_profiles`` for plan/credits and ``usage_records``
    for per-action aggregates.
    """
    client = get_supabase()

    # ---- User profile ----
    try:
        profile_resp = (
            client.table("user_profiles")
            .select("plan, credits_remaining")
            .eq("id", user_id)
            .single()
            .execute()
        )
        profile = profile_resp.data or {}
    except Exception:
        profile = {}

    plan = profile.get("plan", "free")
    credits_remaining = int(profile.get("credits_remaining", 0))

    # ---- Monthly usage records ----
    month_start = _first_of_month()
    try:
        usage_resp = (
            client.table("usage_records")
            .select("action, amount, created_at")
            .eq("user_id", user_id)
            .gte("created_at", month_start)
            .execute()
        )
        records = usage_resp.data or []
    except Exception:
        records = []

    credits_used_this_month = sum(int(r.get("amount", 0)) for r in records)

    # ---- Lifetime aggregates ----
    try:
        videos_resp = (
            client.table("video_assets")
            .select("id", count="exact")
            .eq("owner_id", user_id)
            .execute()
        )
        videos_processed = videos_resp.count or 0
    except Exception:
        videos_processed = 0

    try:
        clips_resp = (
            client.table("clips")
            .select("id", count="exact")
            .eq("owner_id", user_id)
            .execute()
        )
        clips_generated = clips_resp.count or 0
    except Exception:
        clips_generated = 0

    # Render minutes: sum of clip durations that are rendered
    try:
        rendered_resp = (
            client.table("clips")
            .select("duration")
            .eq("owner_id", user_id)
            .eq("status", "rendered")
            .execute()
        )
        render_minutes_used = sum(
            float(r.get("duration", 0)) for r in (rendered_resp.data or [])
        ) / 60.0
    except Exception:
        render_minutes_used = 0.0

    # Storage used
    try:
        storage_resp = (
            client.table("video_assets")
            .select("file_size")
            .eq("owner_id", user_id)
            .execute()
        )
        storage_used_bytes = sum(
            int(r.get("file_size") or 0) for r in (storage_resp.data or [])
        )
    except Exception:
        storage_used_bytes = 0

    # Reset date = first of next month
    now = datetime.now(timezone.utc)
    if now.month == 12:
        reset_date = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        reset_date = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)

    return {
        "user_id": user_id,
        "plan": plan,
        "credits_remaining": credits_remaining,
        "credits_used_this_month": credits_used_this_month,
        "videos_processed": videos_processed,
        "clips_generated": clips_generated,
        "render_minutes_used": round(render_minutes_used, 2),
        "storage_used_bytes": storage_used_bytes,
        "reset_date": reset_date,
    }


async def check_credits(user_id: str, cost: int) -> bool:
    """
    Return True if the user has enough credits to cover *cost*.
    """
    client = get_supabase()
    try:
        resp = (
            client.table("user_profiles")
            .select("credits_remaining")
            .eq("id", user_id)
            .single()
            .execute()
        )
        data = resp.data or {}
        credits = int(data.get("credits_remaining", 0))
        return credits >= cost
    except Exception as exc:
        logger.error("Failed to check credits for user %s: %s", user_id, exc)
        return False


async def deduct_credits(user_id: str, cost: int, action: str) -> None:
    """
    Deduct *cost* credits from the user's balance and write a usage record.

    Raises
    ------
    ValueError
        If the user has insufficient credits.
    RuntimeError
        If the database update fails.
    """
    client = get_supabase()

    # Read current balance
    try:
        resp = (
            client.table("user_profiles")
            .select("credits_remaining")
            .eq("id", user_id)
            .single()
            .execute()
        )
        data = resp.data or {}
        current = int(data.get("credits_remaining", 0))
    except Exception as exc:
        raise RuntimeError(f"Failed to read credit balance: {exc}") from exc

    if current < cost:
        raise ValueError(
            f"Insufficient credits: user has {current}, action costs {cost}"
        )

    new_balance = current - cost

    try:
        client.table("user_profiles").update(
            {"credits_remaining": new_balance, "updated_at": _utcnow()}
        ).eq("id", user_id).execute()
    except Exception as exc:
        raise RuntimeError(f"Failed to deduct credits: {exc}") from exc

    # Insert usage record
    try:
        client.table("usage_records").insert(
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "action": action,
                "amount": cost,
                "created_at": _utcnow(),
            }
        ).execute()
    except Exception as exc:
        logger.warning("Failed to write usage record for user %s action %s: %s", user_id, action, exc)
