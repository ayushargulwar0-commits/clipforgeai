"""
Usage route — GET /api/usage
Returns the authenticated user's current usage stats and credit balance.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user, get_user_id
from app.models.schemas import UsageOut
from app.services.usage_service import get_user_usage

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/usage", response_model=UsageOut, summary="Get current user usage and credit balance")
async def get_usage(
    user: dict = Depends(get_current_user),
) -> UsageOut:
    user_id = get_user_id(user)

    try:
        usage = await get_user_usage(user_id)
    except Exception as exc:
        logger.exception("Failed to retrieve usage for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve usage data",
        ) from exc

    return UsageOut(**usage)
