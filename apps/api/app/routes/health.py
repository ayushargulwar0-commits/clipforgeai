"""
Health-check route — GET /health
"""

from __future__ import annotations

import datetime

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.database import health_check_db

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
    database: str


@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health_check() -> HealthResponse:
    """Returns API status, version, and a UTC timestamp."""
    settings = get_settings()
    db_ok = await health_check_db()

    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        database="ok" if db_ok else "degraded",
    )
