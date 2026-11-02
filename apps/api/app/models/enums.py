"""
Enumeration types for ClipForge AI.
"""

from enum import Enum


class JobStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class AspectRatio(str, Enum):
    portrait_916 = "9:16"
    landscape_169 = "16:9"
    square_11 = "1:1"


class SubscriptionPlan(str, Enum):
    free = "free"
    creator = "creator"
    pro = "pro"
    team = "team"


class StorageBackend(str, Enum):
    local = "local"
    supabase = "supabase"


class VideoStatus(str, Enum):
    uploading = "uploading"
    ready = "ready"
    processing = "processing"
    error = "error"


class ClipStatus(str, Enum):
    detected = "detected"
    editing = "editing"
    rendering = "rendering"
    rendered = "rendered"
    failed = "failed"


class JobType(str, Enum):
    transcription = "transcription"
    clip_detection = "clip_detection"
    render = "render"
