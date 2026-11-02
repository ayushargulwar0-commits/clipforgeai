"""
Project service — business-logic helpers (thin wrappers; most logic lives in routes).
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from app.core.database import get_supabase

logger = logging.getLogger(__name__)


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


async def get_project_by_id(project_id: str, user_id: str) -> dict[str, Any] | None:
    """Fetch a project by ID, enforcing ownership."""
    client = get_supabase()
    try:
        resp = (
            client.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("owner_id", user_id)
            .single()
            .execute()
        )
        return resp.data
    except Exception as exc:
        logger.debug("get_project_by_id(%s) failed: %s", project_id, exc)
        return None


async def assert_project_access(project_id: str, user_id: str) -> dict[str, Any]:
    """
    Raise RuntimeError if the project does not exist or is not owned by user_id.
    Returns the project row on success.
    """
    project = await get_project_by_id(project_id, user_id)
    if not project:
        raise RuntimeError(f"Project {project_id} not found or access denied")
    return project
