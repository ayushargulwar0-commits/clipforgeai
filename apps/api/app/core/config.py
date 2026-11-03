"""
Application configuration loaded from environment variables via Pydantic Settings.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # -----------------------------------------------------------------------
    # Supabase
    # -----------------------------------------------------------------------
    SUPABASE_URL: str = Field(
        default="http://127.0.0.1:54321",
        description="Supabase project URL",
    )
    SUPABASE_ANON_KEY: str = Field(
        default="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dev-anon-key",
        description="Supabase anon/public key",
    )
    SUPABASE_SERVICE_ROLE_KEY: str = Field(
        default="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dev-service-role-key",
        description="Supabase service-role key (never expose to client)",
    )

    # -----------------------------------------------------------------------
    # Database
    # -----------------------------------------------------------------------
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/clipforge",
        description="Direct Postgres connection string (async driver)",
    )

    # -----------------------------------------------------------------------
    # Security
    # -----------------------------------------------------------------------
    SECRET_KEY: str = Field(
        default="clipforge-ai-dev-secret-key-at-least-32-characters-long!",
        min_length=32,
        description="JWT signing secret (≥32 chars)",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # -----------------------------------------------------------------------
    # Storage
    # -----------------------------------------------------------------------
    STORAGE_DIR: Path = Field(
        default=Path("./storage"),
        description="Local storage root directory (dev mode)",
    )
    STORAGE_BACKEND: str = Field(
        default="local",
        description="Storage adapter: 'local' or 'supabase'",
    )
    SUPABASE_STORAGE_BUCKET: str = Field(
        default="clipforge-media",
        description="Supabase Storage bucket name",
    )
    MAX_UPLOAD_SIZE_MB: int = Field(
        default=500, ge=1, le=5000, description="Maximum video upload size in MB"
    )

    # -----------------------------------------------------------------------
    # CORS
    # -----------------------------------------------------------------------
    ALLOWED_ORIGINS: list[str] = Field(
        default=[
            "http://localhost:5173",
            "http://localhost:3000",
            "https://clipforgeai.online",
            "https://www.clipforgeai.online",
            "http://clipforgeai.online",
            "http://www.clipforgeai.online",
        ],
        description="Comma-separated list of allowed CORS origins",
    )

    # -----------------------------------------------------------------------
    # AI / Whisper
    # -----------------------------------------------------------------------
    WHISPER_MODEL_SIZE: str = Field(
        default="base",
        description="faster-whisper model size: tiny/base/small/medium/large",
    )
    WHISPER_DEVICE: str = Field(default="cpu", description="cpu or cuda")
    WHISPER_COMPUTE_TYPE: str = Field(
        default="int8", description="Quantization type: int8, float16, float32"
    )

    # -----------------------------------------------------------------------
    # App
    # -----------------------------------------------------------------------
    DEBUG: bool = False
    APP_VERSION: str = "0.1.0"
    APP_NAME: str = "ClipForge AI API"
    PORT: int = 8000

    # -----------------------------------------------------------------------
    # YouTube Integration & OAuth 2.0
    # -----------------------------------------------------------------------
    YOUTUBE_CLIENT_ID: str = Field(
        default="", description="Google OAuth 2.0 Client ID from Google Cloud Console"
    )
    YOUTUBE_CLIENT_SECRET: str = Field(
        default="", description="Google OAuth 2.0 Client Secret"
    )
    YOUTUBE_REDIRECT_URI: str = Field(
        default="http://localhost:8000/api/youtube/callback",
        description="OAuth 2.0 redirect callback URI registered in Google Console",
    )
    YOUTUBE_ENCRYPTION_KEY: str = Field(
        default="dGhpcy1pcy1hLTMyLWJ5dGUtZGV2LWtleS1mb3ItZmVybmV0ISE=",
        description="Fernet symmetric key for encrypting OAuth tokens in storage",
    )

    # -----------------------------------------------------------------------
    # Rate limiting
    # -----------------------------------------------------------------------
    RATE_LIMIT_DEFAULT: str = Field(
        default="60/minute", description="Default SlowAPI rate limit string"
    )
    RATE_LIMIT_UPLOAD: str = Field(
        default="10/minute", description="Upload-specific rate limit"
    )

    # -----------------------------------------------------------------------
    # Validators
    # -----------------------------------------------------------------------
    @field_validator("STORAGE_BACKEND")
    @classmethod
    def validate_backend(cls, v: str) -> str:
        if v not in ("local", "supabase"):
            raise ValueError("STORAGE_BACKEND must be 'local' or 'supabase'")
        return v

    @field_validator("WHISPER_MODEL_SIZE")
    @classmethod
    def validate_whisper_size(cls, v: str) -> str:
        valid = {"tiny", "base", "small", "medium", "large", "large-v2", "large-v3"}
        if v not in valid:
            raise ValueError(f"WHISPER_MODEL_SIZE must be one of {valid}")
        return v

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def storage_resolved_dir(self) -> Path:
        # Check apps/api/storage relative to codebase first
        api_storage = Path(__file__).resolve().parent.parent.parent / "storage"
        if api_storage.exists():
            return api_storage.resolve()
        if self.STORAGE_DIR.is_absolute() and self.STORAGE_DIR.exists():
            return self.STORAGE_DIR
        if (Path.cwd() / self.STORAGE_DIR).exists():
            return (Path.cwd() / self.STORAGE_DIR).resolve()
        return api_storage.resolve()

    @property
    def storage_videos_dir(self) -> Path:
        return self.storage_resolved_dir / "videos"

    @property
    def storage_clips_dir(self) -> Path:
        return self.storage_resolved_dir / "clips"

    @property
    def storage_thumbnails_dir(self) -> Path:
        return self.storage_resolved_dir / "thumbnails"

    @property
    def storage_audio_dir(self) -> Path:
        return self.storage_resolved_dir / "audio"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton — import and call `get_settings()` everywhere."""
    return Settings()
