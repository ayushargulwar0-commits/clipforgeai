"""
Video asset routes:
  POST /api/upload/video   — multipart upload
  POST /api/videos/{id}/transcribe — queue transcription
  GET  /api/videos/{id}/metadata  — video metadata
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.core.config import get_settings
from app.core.database import get_supabase
from app.core.security import get_current_user, get_user_id
from app.models.enums import JobType, VideoStatus
from app.models.schemas import JobOut, MessageResponse, UploadResponse, VideoAssetOut, VideoMetadataOut
from app.services.storage_service import get_storage_adapter
from app.services.video_service import extract_metadata, generate_thumbnail
from app.workers.job_runner import get_job_runner

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
    "video/mpeg",
    "video/3gpp",
}


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Upload video
# ---------------------------------------------------------------------------


@router.post(
    "/upload/video",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a video file",
)
async def upload_video(
    file: UploadFile = File(..., description="Video file (mp4, mov, avi, webm, mkv)"),
    project_id: str | None = Query(None, description="Associate with a project"),
    user: dict = Depends(get_current_user),
) -> UploadResponse:
    settings = get_settings()
    user_id = get_user_id(user)

    # ---- Validate content type ----
    content_type = file.content_type or ""
    if content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{content_type}'. Allowed: mp4, mov, avi, webm, mkv",
        )

    # ---- Read and size-check ----
    data = await file.read()
    file_size = len(data)
    if file_size > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_MB} MB",
        )
    if file_size == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    video_id = str(uuid.uuid4())
    original_filename = file.filename or "upload.mp4"
    ext = Path(original_filename).suffix.lower() or ".mp4"
    stored_filename = f"{video_id}{ext}"

    # ---- Store file ----
    storage = get_storage_adapter()
    try:
        storage_path = await storage.save_video(
            data=data,
            filename=stored_filename,
            user_id=user_id,
        )
    except Exception as exc:
        logger.exception("Storage error for video %s", video_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to store video file",
        ) from exc

    # ---- Extract metadata ----
    local_path = str(settings.storage_videos_dir / user_id / stored_filename)
    metadata: dict = {}
    thumbnail_path: str | None = None

    try:
        metadata = extract_metadata(local_path if settings.STORAGE_BACKEND == "local" else local_path)
    except Exception as exc:
        logger.warning("Metadata extraction failed for %s: %s", video_id, exc)

    # ---- Generate thumbnail ----
    try:
        thumb_filename = f"{video_id}_thumb.jpg"
        thumb_out = str(settings.storage_thumbnails_dir / thumb_filename)
        generate_thumbnail(local_path, thumb_out, time_offset=1.0)
        thumbnail_path = f"thumbnails/{thumb_filename}"
    except Exception as exc:
        logger.warning("Thumbnail generation failed for %s: %s", video_id, exc)

    # ---- Persist to Supabase ----
    client = get_supabase()
    now = _utcnow()
    record = {
        "id": video_id,
        "owner_id": user_id,
        "project_id": project_id,
        "filename": stored_filename,
        "original_filename": original_filename,
        "file_size": file_size,
        "storage_path": storage_path,
        "thumbnail_path": thumbnail_path,
        "status": VideoStatus.ready.value,
        "duration": metadata.get("duration"),
        "width": metadata.get("width"),
        "height": metadata.get("height"),
        "fps": metadata.get("fps"),
        "codec": metadata.get("codec"),
        "created_at": now,
        "updated_at": now,
    }

    try:
        client.table("video_assets").insert(record).execute()
    except Exception as exc:
        logger.exception("DB insert failed for video %s", video_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to persist video record",
        ) from exc

    return UploadResponse(
        video_id=video_id,
        filename=stored_filename,
        file_size=file_size,
        storage_path=storage_path,
        thumbnail_path=thumbnail_path,
        duration=metadata.get("duration"),
        width=metadata.get("width"),
        height=metadata.get("height"),
        fps=metadata.get("fps"),
        codec=metadata.get("codec"),
    )


# ---------------------------------------------------------------------------
# Queue transcription
# ---------------------------------------------------------------------------


@router.post(
    "/videos/{video_id}/transcribe",
    response_model=JobOut,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Queue a transcription job for a video",
)
async def queue_transcription(
    video_id: str,
    language: str | None = Query(None, description="ISO 639-1 language code, e.g. 'en'"),
    user: dict = Depends(get_current_user),
) -> JobOut:
    user_id = get_user_id(user)
    client = get_supabase()

    # Verify video ownership
    try:
        vid_resp = (
            client.table("video_assets")
            .select("id, storage_path, status")
            .eq("id", video_id)
            .eq("owner_id", user_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    if not vid_resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    # Create job record
    job_id = str(uuid.uuid4())
    now = _utcnow()
    job_record = {
        "id": job_id,
        "job_type": JobType.transcription.value,
        "status": "pending",
        "progress": 0,
        "owner_id": user_id,
        "video_id": video_id,
        "created_at": now,
        "updated_at": now,
        "result": {"language": language} if language else {},
    }

    try:
        resp = client.table("jobs").insert(job_record).execute()
    except Exception as exc:
        logger.exception("Failed to create transcription job for video %s", video_id)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to queue job") from exc

    # Dispatch to async job runner
    runner = get_job_runner()
    await runner.enqueue(job_id)

    row = resp.data[0]
    return JobOut(**row)


# ---------------------------------------------------------------------------
# Get video metadata
# ---------------------------------------------------------------------------


@router.get(
    "/videos/{video_id}/metadata",
    response_model=VideoMetadataOut,
    summary="Get video file metadata",
)
async def get_video_metadata(
    video_id: str,
    user: dict = Depends(get_current_user),
) -> VideoMetadataOut:
    user_id = get_user_id(user)
    client = get_supabase()

    try:
        resp = (
            client.table("video_assets")
            .select("id, duration, width, height, fps, codec, file_size")
            .eq("id", video_id)
            .eq("owner_id", user_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    row = resp.data
    return VideoMetadataOut(
        id=row["id"],
        duration=row.get("duration"),
        width=row.get("width"),
        height=row.get("height"),
        fps=row.get("fps"),
        codec=row.get("codec"),
        file_size=row.get("file_size"),
    )
