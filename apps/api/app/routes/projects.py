"""
Project CRUD routes.
All operations are scoped to the authenticated user.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import get_supabase
from app.core.security import get_current_user, get_user_id
from app.models.schemas import MessageResponse, ProjectCreate, ProjectOut, ProjectUpdate

logger = logging.getLogger(__name__)
router = APIRouter()


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# List projects
# ---------------------------------------------------------------------------


@router.get("/projects", response_model=list[ProjectOut], summary="List user projects")
async def list_projects(
    workspace_id: str | None = Query(None, description="Filter by workspace"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: dict = Depends(get_current_user),
) -> list[ProjectOut]:
    user_id = get_user_id(user)
    client = get_supabase()

    try:
        query = (
            client.table("projects")
            .select("*")
            .eq("owner_id", user_id)
            .order("created_at", desc=True)
            .range((page - 1) * page_size, page * page_size - 1)
        )
        if workspace_id:
            query = query.eq("workspace_id", workspace_id)

        response = query.execute()
    except Exception as exc:
        logger.exception("Failed to list projects for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve projects",
        ) from exc

    rows = response.data or []

    # Enrich with video_count (simple subquery via separate call)
    enriched = []
    for row in rows:
        try:
            vc_resp = (
                client.table("video_assets")
                .select("id", count="exact")
                .eq("project_id", row["id"])
                .execute()
            )
            row["video_count"] = vc_resp.count or 0
        except Exception:
            row["video_count"] = 0
        enriched.append(ProjectOut(**row))

    return enriched


# ---------------------------------------------------------------------------
# Create project
# ---------------------------------------------------------------------------


@router.post(
    "/projects",
    response_model=ProjectOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
)
async def create_project(
    payload: ProjectCreate,
    user: dict = Depends(get_current_user),
) -> ProjectOut:
    user_id = get_user_id(user)
    client = get_supabase()

    now = _utcnow()
    record = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "description": payload.description,
        "workspace_id": payload.workspace_id,
        "owner_id": user_id,
        "created_at": now,
        "updated_at": now,
    }

    try:
        response = client.table("projects").insert(record).execute()
    except Exception as exc:
        logger.exception("Failed to create project for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to create project",
        ) from exc

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Project creation returned no data",
        )

    row = response.data[0]
    row["video_count"] = 0
    return ProjectOut(**row)


# ---------------------------------------------------------------------------
# Get project
# ---------------------------------------------------------------------------


@router.get("/projects/{project_id}", response_model=ProjectOut, summary="Get a project")
async def get_project(
    project_id: str,
    user: dict = Depends(get_current_user),
) -> ProjectOut:
    user_id = get_user_id(user)
    client = get_supabase()

    try:
        response = (
            client.table("projects")
            .select("*")
            .eq("id", project_id)
            .eq("owner_id", user_id)
            .single()
            .execute()
        )
    except Exception as exc:
        logger.exception("Failed to get project %s", project_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        ) from exc

    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    row = response.data
    try:
        vc_resp = (
            client.table("video_assets")
            .select("id", count="exact")
            .eq("project_id", project_id)
            .execute()
        )
        row["video_count"] = vc_resp.count or 0
    except Exception:
        row["video_count"] = 0

    return ProjectOut(**row)


# ---------------------------------------------------------------------------
# Update project
# ---------------------------------------------------------------------------


@router.put("/projects/{project_id}", response_model=ProjectOut, summary="Update a project")
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    user: dict = Depends(get_current_user),
) -> ProjectOut:
    user_id = get_user_id(user)
    client = get_supabase()

    # Verify ownership
    try:
        existing = (
            client.table("projects")
            .select("id")
            .eq("id", project_id)
            .eq("owner_id", user_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    updates: dict = {"updated_at": _utcnow()}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.description is not None:
        updates["description"] = payload.description

    try:
        response = (
            client.table("projects")
            .update(updates)
            .eq("id", project_id)
            .execute()
        )
    except Exception as exc:
        logger.exception("Failed to update project %s", project_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to update project"
        ) from exc

    if not response.data:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Update returned no data")

    row = response.data[0]
    row["video_count"] = 0
    return ProjectOut(**row)


# ---------------------------------------------------------------------------
# Delete project
# ---------------------------------------------------------------------------


@router.delete(
    "/projects/{project_id}",
    response_model=MessageResponse,
    summary="Delete a project",
)
async def delete_project(
    project_id: str,
    user: dict = Depends(get_current_user),
) -> MessageResponse:
    user_id = get_user_id(user)
    client = get_supabase()

    # Verify ownership before deletion
    try:
        existing = (
            client.table("projects")
            .select("id")
            .eq("id", project_id)
            .eq("owner_id", user_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    try:
        client.table("projects").delete().eq("id", project_id).execute()
    except Exception as exc:
        logger.exception("Failed to delete project %s", project_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to delete project"
        ) from exc

    return MessageResponse(message="Project deleted successfully", detail=project_id)
