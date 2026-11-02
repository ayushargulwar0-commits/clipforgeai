"""
Pydantic v2 schemas for ClipForge AI request/response models.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import AspectRatio, ClipStatus, JobStatus, JobType, SubscriptionPlan, VideoStatus


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: str | None = Field(None, max_length=500)
    workspace_id: str | None = None

    @field_validator("name")
    @classmethod
    def name_strip(cls, v: str) -> str:
        return v.strip()


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=120)
    description: str | None = Field(None, max_length=500)

    @field_validator("name")
    @classmethod
    def name_strip(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class ProjectOut(OrmBase):
    id: str
    name: str
    description: str | None = None
    workspace_id: str | None = None
    owner_id: str
    created_at: datetime
    updated_at: datetime | None = None
    video_count: int = 0


# ---------------------------------------------------------------------------
# Video Assets
# ---------------------------------------------------------------------------


class VideoAssetOut(OrmBase):
    id: str
    project_id: str | None = None
    owner_id: str
    filename: str
    original_filename: str
    file_size: int
    duration: float | None = None
    width: int | None = None
    height: int | None = None
    fps: float | None = None
    codec: str | None = None
    status: VideoStatus = VideoStatus.ready
    storage_path: str
    thumbnail_path: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class VideoMetadataOut(BaseModel):
    id: str
    duration: float | None = None
    width: int | None = None
    height: int | None = None
    fps: float | None = None
    codec: str | None = None
    file_size: int | None = None
    format: str | None = None


# ---------------------------------------------------------------------------
# Transcripts
# ---------------------------------------------------------------------------


class WordTimestamp(BaseModel):
    start: float
    end: float
    word: str


class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str
    words: list[WordTimestamp] = []


class TranscriptOut(OrmBase):
    id: str
    video_id: str
    language: str | None = None
    duration: float | None = None
    segments: list[TranscriptSegment] = []
    created_at: datetime


# ---------------------------------------------------------------------------
# Clips
# ---------------------------------------------------------------------------


class ClipEditingConfig(BaseModel):
    aspect_ratio: AspectRatio = AspectRatio.portrait_916
    add_subtitles: bool = True
    subtitle_style: dict[str, Any] = Field(default_factory=dict)
    custom_title: str | None = None
    intro_text: str | None = None
    outro_text: str | None = None
    background_music: str | None = None
    volume_boost: float = 1.0

    @field_validator("volume_boost")
    @classmethod
    def volume_range(cls, v: float) -> float:
        if not 0.1 <= v <= 3.0:
            raise ValueError("volume_boost must be between 0.1 and 3.0")
        return v


class ClipOut(OrmBase):
    id: str
    video_id: str
    owner_id: str
    title: str
    description: str | None = None
    hook: str | None = None
    start: float
    end: float
    duration: float
    score: float = 0.0
    score_explanation: str | None = None
    transcript_text: str | None = None
    status: ClipStatus = ClipStatus.detected
    editing_config: ClipEditingConfig = Field(default_factory=ClipEditingConfig)
    rendered_path: str | None = None
    thumbnail_path: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class ClipUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)
    hook: str | None = Field(None, max_length=300)
    editing_config: ClipEditingConfig | None = None


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------


class JobOut(OrmBase):
    id: str
    job_type: JobType
    status: JobStatus = JobStatus.pending
    progress: int = Field(default=0, ge=0, le=100)
    result: dict[str, Any] | None = None
    error_message: str | None = None
    owner_id: str
    video_id: str | None = None
    clip_id: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    completed_at: datetime | None = None


# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------


class UsageOut(BaseModel):
    user_id: str
    plan: SubscriptionPlan = SubscriptionPlan.free
    credits_remaining: int
    credits_used_this_month: int
    videos_processed: int
    clips_generated: int
    render_minutes_used: float
    storage_used_bytes: int
    reset_date: datetime | None = None


class CreditAdjustment(BaseModel):
    user_id: str
    amount: int = Field(..., description="Positive to add, negative to deduct")
    reason: str = Field(..., min_length=1, max_length=300)


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------


class UploadResponse(BaseModel):
    video_id: str
    filename: str
    file_size: int
    storage_path: str
    thumbnail_path: str | None = None
    duration: float | None = None
    width: int | None = None
    height: int | None = None
    fps: float | None = None
    codec: str | None = None
    message: str = "Upload successful"


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------


class AdminUserOut(BaseModel):
    id: str
    email: str | None = None
    plan: SubscriptionPlan = SubscriptionPlan.free
    credits_remaining: int = 0
    created_at: datetime | None = None
    last_sign_in_at: datetime | None = None
    is_admin: bool = False


class AdminStatsOut(BaseModel):
    total_users: int
    total_videos: int
    total_clips: int
    total_jobs: int
    jobs_pending: int
    jobs_processing: int
    jobs_completed: int
    jobs_failed: int
    storage_used_bytes: int
    active_users_7d: int


# ---------------------------------------------------------------------------
# Generic responses
# ---------------------------------------------------------------------------


class MessageResponse(BaseModel):
    message: str
    detail: str | None = None


class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int
    pages: int
