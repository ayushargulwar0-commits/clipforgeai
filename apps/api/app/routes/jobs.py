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


@router.get("/jobs/{job_id}", summary="Get job status and progress")
async def get_job(
    job_id: str,
    user: dict = Depends(get_current_user),
):
    user_id = get_user_id(user)

    # 1. Check AutoClip service / local tracker
    try:
        from app.services.autoclip_service import get_autoclip_service
        ac_service = get_autoclip_service()
        ac_status = await ac_service.get_job_status(job_id)
        if ac_status and (ac_status.get("id") == job_id or "status" in ac_status):
            clips = await ac_service.get_job_clips(job_id)
            all_clips = clips or ac_status.get("clips", [])
            return {
                "id": job_id,
                "job_type": "clip_detection",
                "status": ac_status.get("status", "processing"),
                "progress": ac_status.get("progress", 0),
                "result": {"clips": all_clips},
                "clips": all_clips,
                "error_message": ac_status.get("error"),
                "owner_id": user_id,
            }
    except Exception as exc:
        logger.warning("AutoClip status lookup warning for job %s: %s", job_id, exc)

    client = get_supabase()
    try:
        resp = (
            client.table("jobs")
            .select("*")
            .eq("id", job_id)
            .single()
            .execute()
        )
        if resp.data:
            return resp.data
    except Exception:
        pass

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
