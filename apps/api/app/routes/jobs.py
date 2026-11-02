"""
Job status route — GET /api/jobs/{id}
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_supabase
from app.core.security import get_current_user, get_user_id
from app.models.schemas import JobOut

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/jobs/{job_id}", response_model=JobOut, summary="Get job status and progress")
async def get_job(
    job_id: str,
    user: dict = Depends(get_current_user),
) -> JobOut:
    user_id = get_user_id(user)
    client = get_supabase()

    try:
        resp = (
            client.table("jobs")
            .select("*")
            .eq("id", job_id)
            .eq("owner_id", user_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return JobOut(**resp.data)
