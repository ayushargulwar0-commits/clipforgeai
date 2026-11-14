"""
Asset management routes for user-uploaded logos/watermarks and audio/music tracks.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.core.database import get_sqlite_conn, get_supabase
from app.core.security import get_current_user, get_user_id
from app.models.schemas import AssetOut

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/assets", tags=["Assets"])

MAX_IMAGE_SIZE = 5 * 1024 * 1024       # 5 MB
MAX_AUDIO_SIZE = 20 * 1024 * 1024      # 20 MB


def _detect_file_type_and_mime(data: bytes, filename: str) -> tuple[str, str, str]:
    """Inspect magic bytes to guarantee real file type."""
    # Images
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image", "image/png", "png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image", "image/jpeg", "jpg"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image", "image/webp", "webp"

    # Audio
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WAVE":
        return "audio", "audio/wav", "wav"
    if data.startswith(b"ID3") or (len(data) >= 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0):
        return "audio", "audio/mpeg", "mp3"
    if len(data) >= 12 and (b"ftypM4A" in data[:16] or b"ftypisom" in data[:16] or b"ftypmp42" in data[:16]):
        return "audio", "audio/mp4", "m4a"

    # Fallback to extension check if magic bytes are ambiguous (e.g. raw MP3 stream without ID3 tag)
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext in ("png", "jpg", "jpeg", "webp"):
        return "image", f"image/{'jpeg' if ext in ('jpg', 'jpeg') else ext}", ext
    if ext in ("mp3", "wav", "m4a"):
        return "audio", f"audio/{'mpeg' if ext == 'mp3' else ext}", ext

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported or invalid file format. Permitted images: PNG, JPG, WEBP. Permitted audio: MP3, WAV, M4A.",
    )


@router.post("", response_model=AssetOut, summary="Upload image or audio asset")
async def upload_asset(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
) -> AssetOut:
    user_id = get_user_id(user)
    raw_content = await file.read()
    file_size = len(raw_content)

    asset_type, mime_type, ext = _detect_file_type_and_mime(raw_content, file.filename or "")

    if asset_type == "image" and file_size > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds max size of 5 MB ({file_size} bytes).",
        )
    if asset_type == "audio" and file_size > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio exceeds max size of 20 MB ({file_size} bytes).",
        )

    asset_id = f"asset-{uuid.uuid4().hex[:12]}"
    settings = get_settings()
    user_asset_dir = settings.STORAGE_DIR / "assets" / user_id
    user_asset_dir.mkdir(parents=True, exist_ok=True)

    dest_filename = f"{asset_id}.{ext}"
    dest_path = user_asset_dir / dest_filename
    with open(dest_path, "wb") as f:
        f.write(raw_content)

    file_url = f"/api/assets/{asset_id}/file"
    now_ts = datetime.now(timezone.utc).isoformat()
    clean_name = file.filename or f"Uploaded {asset_type}"

    conn = get_sqlite_conn()
    with conn:
        conn.execute(
            """
            INSERT INTO assets (id, user_id, name, asset_type, file_path, file_url, size_bytes, mime_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (asset_id, user_id, clean_name, asset_type, str(dest_path), file_url, file_size, mime_type, now_ts),
        )

    return AssetOut(
        id=asset_id,
        user_id=user_id,
        name=clean_name,
        asset_type=asset_type,  # type: ignore
        file_path=str(dest_path),
        file_url=file_url,
        size_bytes=file_size,
        mime_type=mime_type,
        created_at=now_ts,
    )


@router.get("", response_model=list[AssetOut], summary="List user's uploaded assets")
async def list_assets(
    asset_type: str | None = None,
    user: dict = Depends(get_current_user),
) -> list[AssetOut]:
    user_id = get_user_id(user)
    conn = get_sqlite_conn()

    if asset_type:
        rows = conn.execute(
            "SELECT * FROM assets WHERE user_id = ? AND asset_type = ? ORDER BY created_at DESC",
            (user_id, asset_type),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()

    return [
        AssetOut(
            id=r["id"],
            user_id=r["user_id"],
            name=r["name"],
            asset_type=r["asset_type"],
            file_path=r["file_path"],
            file_url=r["file_url"],
            size_bytes=r["size_bytes"],
            mime_type=r["mime_type"],
            created_at=r["created_at"],
        )
        for r in rows
    ]


@router.get("/{asset_id}/file", summary="Stream asset file to owner")
async def get_asset_file(
    asset_id: str,
    user: dict = Depends(get_current_user),
):
    user_id = get_user_id(user)
    conn = get_sqlite_conn()
    row = conn.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    if row["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    fpath = Path(row["file_path"])
    if not fpath.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset file missing on disk")

    return FileResponse(fpath, media_type=row["mime_type"], headers={"Accept-Ranges": "bytes"})


@router.delete("/{asset_id}", summary="Delete asset")
async def delete_asset(
    asset_id: str,
    user: dict = Depends(get_current_user),
) -> dict[str, Any]:
    user_id = get_user_id(user)
    conn = get_sqlite_conn()
    row = conn.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    if row["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    fpath = Path(row["file_path"])
    if fpath.exists():
        try:
            fpath.unlink()
        except Exception as e:
            logger.warning("Failed to delete asset file %s: %s", fpath, e)

    with conn:
        conn.execute("DELETE FROM assets WHERE id = ?", (asset_id,))

    return {"success": True, "message": "Asset deleted successfully", "id": asset_id}
