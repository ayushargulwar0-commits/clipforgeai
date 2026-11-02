"""
Storage service — adapter pattern supporting local filesystem and Supabase Storage.

STORAGE_BACKEND=local   → LocalStorageAdapter
STORAGE_BACKEND=supabase → SupabaseStorageAdapter

Usage
-----
    adapter = get_storage_adapter()
    path = await adapter.save_video(data, filename, user_id)
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from functools import lru_cache
from pathlib import Path

import aiofiles

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class BaseStorageAdapter(ABC):
    """Abstract storage adapter interface."""

    @abstractmethod
    async def save_video(self, data: bytes, filename: str, user_id: str) -> str:
        """Persist raw video bytes and return the storage path / URL."""

    @abstractmethod
    async def save_clip(self, data: bytes, filename: str, user_id: str) -> str:
        """Persist rendered clip bytes and return the storage path / URL."""

    @abstractmethod
    async def save_thumbnail(self, data: bytes, filename: str) -> str:
        """Persist thumbnail bytes and return the storage path / URL."""

    @abstractmethod
    async def delete(self, path: str) -> None:
        """Delete a stored object by its path/key."""

    @abstractmethod
    async def get_public_url(self, path: str) -> str:
        """Return a publicly accessible URL for the given path."""


# ---------------------------------------------------------------------------
# Local filesystem adapter
# ---------------------------------------------------------------------------


class LocalStorageAdapter(BaseStorageAdapter):
    """
    Saves files to STORAGE_DIR on the local filesystem.
    Files are served by FastAPI's FileResponse / StaticFiles mount.
    """

    def __init__(self) -> None:
        self.settings = get_settings()

    def _video_dir(self, user_id: str) -> Path:
        d = self.settings.storage_videos_dir / user_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _clips_dir(self, user_id: str) -> Path:
        d = self.settings.storage_clips_dir / user_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _thumbnails_dir(self) -> Path:
        d = self.settings.storage_thumbnails_dir
        d.mkdir(parents=True, exist_ok=True)
        return d

    async def save_video(self, data: bytes, filename: str, user_id: str) -> str:
        dest = self._video_dir(user_id) / filename
        async with aiofiles.open(dest, "wb") as f:
            await f.write(data)
        logger.debug("Saved video: %s", dest)
        # Return relative path from STORAGE_DIR root
        return str(dest.relative_to(self.settings.STORAGE_DIR)).replace("\\", "/")

    async def save_clip(self, data: bytes, filename: str, user_id: str) -> str:
        dest = self._clips_dir(user_id) / filename
        async with aiofiles.open(dest, "wb") as f:
            await f.write(data)
        logger.debug("Saved clip: %s", dest)
        return str(dest.relative_to(self.settings.STORAGE_DIR)).replace("\\", "/")

    async def save_thumbnail(self, data: bytes, filename: str) -> str:
        dest = self._thumbnails_dir() / filename
        async with aiofiles.open(dest, "wb") as f:
            await f.write(data)
        return f"thumbnails/{filename}"

    async def delete(self, path: str) -> None:
        full = self.settings.STORAGE_DIR / path
        try:
            full.unlink(missing_ok=True)
            logger.debug("Deleted: %s", full)
        except Exception as exc:
            logger.warning("Failed to delete %s: %s", full, exc)

    async def get_public_url(self, path: str) -> str:
        # In local dev mode, files are served via /storage/{path}
        settings = get_settings()
        base = f"http://localhost:{settings.PORT}/storage"
        return f"{base}/{path}"


# ---------------------------------------------------------------------------
# Supabase Storage adapter
# ---------------------------------------------------------------------------


class SupabaseStorageAdapter(BaseStorageAdapter):
    """
    Uploads files to a Supabase Storage bucket.
    Requires ``SUPABASE_STORAGE_BUCKET`` to exist and be accessible.
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        from app.core.database import get_supabase
        self._client = get_supabase()
        self._bucket = self.settings.SUPABASE_STORAGE_BUCKET

    def _upload(self, object_path: str, data: bytes, content_type: str) -> str:
        """Upload bytes to Supabase Storage and return the object path."""
        try:
            self._client.storage.from_(self._bucket).upload(
                path=object_path,
                file=data,
                file_options={"content-type": content_type, "upsert": "true"},
            )
        except Exception as exc:
            logger.exception("Supabase storage upload failed for %s", object_path)
            raise RuntimeError(f"Storage upload failed: {exc}") from exc
        return object_path

    async def save_video(self, data: bytes, filename: str, user_id: str) -> str:
        path = f"videos/{user_id}/{filename}"
        return self._upload(path, data, "video/mp4")

    async def save_clip(self, data: bytes, filename: str, user_id: str) -> str:
        path = f"clips/{user_id}/{filename}"
        return self._upload(path, data, "video/mp4")

    async def save_thumbnail(self, data: bytes, filename: str) -> str:
        path = f"thumbnails/{filename}"
        return self._upload(path, data, "image/jpeg")

    async def delete(self, path: str) -> None:
        try:
            self._client.storage.from_(self._bucket).remove([path])
        except Exception as exc:
            logger.warning("Failed to delete %s from Supabase storage: %s", path, exc)

    async def get_public_url(self, path: str) -> str:
        try:
            result = self._client.storage.from_(self._bucket).get_public_url(path)
            return result
        except Exception as exc:
            logger.warning("Could not get public URL for %s: %s", path, exc)
            return path


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------


@lru_cache(maxsize=1)
def get_storage_adapter() -> BaseStorageAdapter:
    """Return the configured storage adapter singleton."""
    settings = get_settings()
    backend = settings.STORAGE_BACKEND

    if backend == "supabase":
        logger.info("Using SupabaseStorageAdapter")
        return SupabaseStorageAdapter()

    logger.info("Using LocalStorageAdapter (STORAGE_DIR=%s)", settings.STORAGE_DIR)
    return LocalStorageAdapter()
