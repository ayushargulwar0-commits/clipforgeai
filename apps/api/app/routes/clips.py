"""
Clip routes:
  GET    /api/videos/{video_id}/clips           — list clips for video
  POST   /api/videos/{video_id}/clips/detect    — queue AI detection job
  GET    /api/clips/{id}                        — get single clip
  PUT    /api/clips/{id}                        — update clip
  DELETE /api/clips/{id}                        — delete clip
  POST   /api/clips/{id}/render                 — queue render job
  GET    /api/clips/{id}/download               — stream rendered file
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.core.database import get_supabase
from app.core.security import get_current_user, get_user_id
from app.models.enums import ClipStatus, JobType
from app.models.schemas import ClipOut, ClipUpdate, JobOut, MessageResponse
from app.workers.job_runner import get_job_runner

logger = logging.getLogger(__name__)
router = APIRouter()


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _assert_clip_ownership(clip_data: dict, user_id: str) -> None:
    if clip_data.get("owner_id") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


# ---------------------------------------------------------------------------
# List clips for a video
# ---------------------------------------------------------------------------


@router.get(
    "/videos/{video_id}/clips",
    response_model=list[ClipOut],
    summary="List detected clips for a video",
)
async def list_clips(
    video_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
) -> list[ClipOut]:
    user_id = get_user_id(user)
    client = get_supabase()

    # Verify video access
    try:
        vid = (
            client.table("video_assets")
            .select("id")
            .eq("id", video_id)
            .eq("owner_id", user_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    if not vid.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    try:
        resp = (
            client.table("clips")
            .select("*")
            .eq("video_id", video_id)
            .order("score", desc=True)
            .range((page - 1) * page_size, page * page_size - 1)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to retrieve clips") from exc

    return [ClipOut(**row) for row in (resp.data or [])]


# ---------------------------------------------------------------------------
# Queue clip detection
# ---------------------------------------------------------------------------


@router.post(
    "/videos/{video_id}/clips/detect",
    response_model=JobOut,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Queue AI clip detection for a video",
)
async def detect_clips(
    video_id: str,
    min_duration: int = Query(15, ge=5, le=300),
    max_duration: int = Query(60, ge=10, le=600),
    max_clips: int = Query(10, ge=1, le=50),
    user: dict = Depends(get_current_user),
) -> JobOut:
    user_id = get_user_id(user)
    client = get_supabase()

    if min_duration >= max_duration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_duration must be less than max_duration",
        )

    # Verify ownership and transcription exists
    try:
        vid = (
            client.table("video_assets")
            .select("id")
            .eq("id", video_id)
            .eq("owner_id", user_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    if not vid.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    job_id = str(uuid.uuid4())
    now = _utcnow()
    job_record = {
        "id": job_id,
        "job_type": JobType.clip_detection.value,
        "status": "pending",
        "progress": 0,
        "owner_id": user_id,
        "video_id": video_id,
        "created_at": now,
        "updated_at": now,
        "result": {
            "min_duration": min_duration,
            "max_duration": max_duration,
            "max_clips": max_clips,
        },
    }

    try:
        resp = client.table("jobs").insert(job_record).execute()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to queue job") from exc

    runner = get_job_runner()
    await runner.enqueue(job_id)

    return JobOut(**resp.data[0])


# ---------------------------------------------------------------------------
# Get single clip
# ---------------------------------------------------------------------------


@router.get("/clips/{clip_id}", response_model=ClipOut, summary="Get a clip")
async def get_clip(
    clip_id: str,
    user: dict = Depends(get_current_user),
) -> ClipOut:
    user_id = get_user_id(user)
    client = get_supabase()

    try:
        resp = (
            client.table("clips")
            .select("*")
            .eq("id", clip_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    _assert_clip_ownership(resp.data, user_id)
    return ClipOut(**resp.data)


# ---------------------------------------------------------------------------
# Update clip
# ---------------------------------------------------------------------------


@router.put("/clips/{clip_id}", response_model=ClipOut, summary="Update clip metadata/config")
async def update_clip(
    clip_id: str,
    payload: ClipUpdate,
    user: dict = Depends(get_current_user),
) -> ClipOut:
    user_id = get_user_id(user)
    client = get_supabase()

    try:
        existing = (
            client.table("clips").select("*").eq("id", clip_id).single().execute()
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    _assert_clip_ownership(existing.data, user_id)

    updates: dict = {"updated_at": _utcnow()}
    if payload.title is not None:
        updates["title"] = payload.title
    if payload.description is not None:
        updates["description"] = payload.description
    if payload.hook is not None:
        updates["hook"] = payload.hook
    if payload.editing_config is not None:
        updates["editing_config"] = payload.editing_config.model_dump()

    try:
        resp = client.table("clips").update(updates).eq("id", clip_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to update clip") from exc

    return ClipOut(**resp.data[0])


# ---------------------------------------------------------------------------
# Delete clip
# ---------------------------------------------------------------------------


@router.delete("/clips/{clip_id}", response_model=MessageResponse, summary="Delete a clip")
async def delete_clip(
    clip_id: str,
    user: dict = Depends(get_current_user),
) -> MessageResponse:
    user_id = get_user_id(user)
    client = get_supabase()

    try:
        existing = (
            client.table("clips").select("id, owner_id").eq("id", clip_id).single().execute()
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    _assert_clip_ownership(existing.data, user_id)

    try:
        client.table("clips").delete().eq("id", clip_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to delete clip") from exc

    return MessageResponse(message="Clip deleted", detail=clip_id)


# ---------------------------------------------------------------------------
# Queue render job
# ---------------------------------------------------------------------------


@router.post(
    "/clips/{clip_id}/render",
    response_model=JobOut,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Queue a render job for a clip",
)
async def render_clip(
    clip_id: str,
    user: dict = Depends(get_current_user),
) -> JobOut:
    user_id = get_user_id(user)
    client = get_supabase()

    try:
        clip_resp = (
            client.table("clips").select("*").eq("id", clip_id).single().execute()
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    if not clip_resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    _assert_clip_ownership(clip_resp.data, user_id)

    # Mark clip as queued for rendering
    try:
        client.table("clips").update(
            {"status": ClipStatus.rendering.value, "updated_at": _utcnow()}
        ).eq("id", clip_id).execute()
    except Exception:
        pass  # non-fatal status update

    job_id = str(uuid.uuid4())
    now = _utcnow()
    job_record = {
        "id": job_id,
        "job_type": JobType.render.value,
        "status": "pending",
        "progress": 0,
        "owner_id": user_id,
        "video_id": clip_resp.data.get("video_id"),
        "clip_id": clip_id,
        "created_at": now,
        "updated_at": now,
        "result": {},
    }

    try:
        resp = client.table("jobs").insert(job_record).execute()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to queue render") from exc

    runner = get_job_runner()
    await runner.enqueue(job_id)

    return JobOut(**resp.data[0])


# ---------------------------------------------------------------------------
# Download rendered clip
# ---------------------------------------------------------------------------


@router.get("/clips/{clip_id}/download", summary="Download rendered clip file")
async def download_clip(
    clip_id: str,
    user: dict = Depends(get_current_user),
):
    user_id = get_user_id(user)
    settings = get_settings()
    client = get_supabase()

    try:
        clip_resp = (
            client.table("clips")
            .select("id, owner_id, status, rendered_path, title")
            .eq("id", clip_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    if not clip_resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    clip = clip_resp.data
    _assert_clip_ownership(clip, user_id)

    if clip.get("status") != ClipStatus.rendered.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Clip is not yet rendered (status: {clip.get('status')})",
        )

    rendered_path: str | None = clip.get("rendered_path")
    if not rendered_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Rendered file path not found"
        )

    # For local storage — serve the file directly
    local_file = Path(rendered_path)
    if not local_file.is_absolute():
        local_file = settings.STORAGE_DIR / rendered_path

    if not local_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Rendered file not found on disk"
        )

    safe_title = "".join(c if c.isalnum() or c in (" ", "-", "_") else "_" for c in (clip.get("title") or "clip"))
    download_name = f"{safe_title}.mp4"

    return FileResponse(
        path=str(local_file),
        media_type="video/mp4",
        filename=download_name,
        headers={"Content-Disposition": f'attachment; filename="{download_name}"'},
    )


# ---------------------------------------------------------------------------
# Selective Section Extraction & Direct Rendering
# ---------------------------------------------------------------------------

from pydantic import BaseModel, Field
from typing import Any
from app.services.video_service import download_selective_section, ensure_ffmpeg
from app.video.processor import VideoProcessor


class SelectiveSectionRequest(BaseModel):
    clip_id: str | None = None
    url: str | None = None
    youtube_id: str | None = None
    video_url: str | None = None
    start_time: float = 0.0
    end_time: float = 30.0


class SelectiveRenderRequest(BaseModel):
    clip_id: str | None = None
    youtube_id: str | None = None
    video_url: str | None = None
    start_time: float = 0.0
    end_time: float = 30.0
    aspect_ratio: str = "9:16"
    caption_text: str | None = None
    caption_style: dict[str, Any] | None = None
    zoom: float = 1.0
    position_x: float = 0.0
    position_y: float = 0.0


@router.post("/clips/selective-download", summary="Extract only the selective section MP4")
async def extract_selective_section(req: SelectiveSectionRequest):
    """
    Downloads or extracts ONLY the selective section [start_time, end_time]
    without downloading or rendering the entire video.
    """
    settings = get_settings()
    ensure_ffmpeg()
    target_source = req.youtube_id or req.video_url or req.url
    if not target_source:
        raise HTTPException(status_code=400, detail="Missing video source or youtube_id")

    clip_id = req.clip_id or str(uuid.uuid4())[:8]
    start_time = max(0.0, float(req.start_time))
    end_time = max(start_time + 1.0, float(req.end_time))

    # Check if this section was already extracted
    expected_filename = f"clip_{clip_id}_section.mp4"
    target_file = settings.storage_clips_dir / expected_filename
    if target_file.exists() and target_file.stat().st_size > 1000:
        return {
            "success": True,
            "file_url": f"/storage/clips/{expected_filename}",
            "duration": round(end_time - start_time, 1),
            "cached": True,
        }

    try:
        # If source is a local file
        if req.video_url and req.video_url.startswith("/storage/"):
            rel = req.video_url.replace("/storage/", "")
            local_src = settings.STORAGE_DIR / rel
            if local_src.exists():
                processor = VideoProcessor()
                processor.trim_and_encode(
                    str(local_src),
                    str(target_file),
                    start=start_time,
                    end=end_time,
                    aspect_ratio="9:16",
                )
                return {
                    "success": True,
                    "file_url": f"/storage/clips/{expected_filename}",
                    "duration": round(end_time - start_time, 1),
                }

        # Otherwise download partial range with yt-dlp
        res = download_selective_section(
            url_or_id=target_source,
            start_time=start_time,
            end_time=end_time,
            output_dir=settings.storage_clips_dir,
            clip_id=clip_id,
        )
        return {
            "success": True,
            "file_url": f"/storage/clips/{res['filename']}",
            "duration": res["duration"],
        }
    except Exception as exc:
        logger.exception("Error extracting selective section: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/clips/selective-render", summary="Render selective section with 9:16 and captions")
async def render_selective_section(req: SelectiveRenderRequest):
    """
    Renders the exact selective section with aspect ratio conversion
    (e.g. 9:16 vertical) and burned-in styled subtitles.
    """
    settings = get_settings()
    ensure_ffmpeg()
    target_source = req.youtube_id or req.video_url
    if not target_source:
        raise HTTPException(status_code=400, detail="Missing video source or youtube_id")

    clip_id = req.clip_id or str(uuid.uuid4())[:8]
    start_time = max(0.0, float(req.start_time))
    end_time = max(start_time + 1.0, float(req.end_time))
    duration = round(end_time - start_time, 1)

    rendered_filename = f"clip_{clip_id}_rendered.mp4"
    rendered_path = settings.storage_clips_dir / rendered_filename

    # First, ensure we have the raw selective section
    temp_raw = settings.storage_clips_dir / f"temp_{clip_id}.mp4"
    
    # Check if local video source
    if req.video_url and req.video_url.startswith("/storage/"):
        rel = req.video_url.replace("/storage/", "")
        local_src = settings.STORAGE_DIR / rel
        if local_src.exists():
            input_video_path = str(local_src)
            actual_start = start_time
            actual_end = end_time
        else:
            input_video_path = None
    else:
        input_video_path = None

    if not input_video_path:
        # Download selective section using yt-dlp
        try:
            res = download_selective_section(
                url_or_id=target_source,
                start_time=start_time,
                end_time=end_time,
                output_dir=settings.storage_clips_dir,
                clip_id=f"tmp_{clip_id}",
            )
            input_video_path = res["file_path"]
            actual_start = 0.0
            actual_end = res["duration"]
        except Exception as exc:
            logger.exception("Failed to fetch section for render: %s", exc)
            raise HTTPException(status_code=500, detail=f"Failed to fetch section: {exc}")

    # Generate subtitle SRT if caption text provided
    srt_path = None
    if req.caption_text and req.caption_text.strip():
        srt_file = settings.storage_clips_dir / f"sub_{clip_id}.srt"
        text = req.caption_text.strip()
        words = text.split()
        chunks = []
        c_size = 5
        for i in range(0, len(words), c_size):
            chunks.append(" ".join(words[i : i + c_size]))
        if not chunks:
            chunks = [text]

        chunk_dur = duration / len(chunks)
        with open(srt_file, "w", encoding="utf-8") as f:
            for idx, c in enumerate(chunks):
                s_s = idx * chunk_dur
                e_s = min(duration, (idx + 1) * chunk_dur)
                s_txt = f"00:00:{int(s_s):02d},{int((s_s % 1) * 1000):03d}"
                e_txt = f"00:00:{int(e_s):02d},{int((e_s % 1) * 1000):03d}"
                f.write(f"{idx + 1}\n{s_txt} --> {e_txt}\n{c}\n\n")
        srt_path = str(srt_file)

    # Encode with aspect ratio and burned-in subtitles
    try:
        processor = VideoProcessor()
        processor.trim_and_encode(
            input_path=input_video_path,
            output_path=str(rendered_path),
            start=actual_start,
            end=actual_end,
            aspect_ratio=req.aspect_ratio or "9:16",
            add_subtitles_path=srt_path,
        )
    except Exception as exc:
        logger.exception("Failed to encode rendered clip: %s", exc)
        raise HTTPException(status_code=500, detail=f"Render failed: {exc}")
    finally:
        if srt_path and Path(srt_path).exists():
            try:
                Path(srt_path).unlink()
            except Exception:
                pass

    return {
        "success": True,
        "output_url": f"/storage/clips/{rendered_filename}",
        "filename": rendered_filename,
        "duration": duration,
        "aspect_ratio": req.aspect_ratio or "9:16",
    }

