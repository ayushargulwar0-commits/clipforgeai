"""
JWT authentication helpers for ClipForge AI.

Supabase issues JWTs signed with the project's JWT secret (HS256).
This module validates those tokens and provides FastAPI dependencies
for route-level auth and admin gating.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError, jwt

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_bearer_scheme = HTTPBearer(auto_error=True)


def verify_jwt(token: str) -> dict[str, Any]:
    """
    Validate a Supabase-issued JWT and return the decoded claims.

    Supabase signs JWTs with the project's ``JWT_SECRET`` using HS256.
    The secret is stored in ``settings.SECRET_KEY`` (same value you copy
    from Supabase → Project Settings → API → JWT Secret).

    Raises
    ------
    HTTPException 401
        If the token is missing, malformed, expired, or signature-invalid.
    """
    settings = get_settings()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_aud": False},  # Supabase JWTs omit `aud` for service use
        )
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as exc:
        logger.warning("JWT validation error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    sub: str | None = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing 'sub' claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """
    FastAPI dependency — validates the ``Authorization: Bearer <token>``
    header and returns the decoded JWT claims dict.

    Inject into route handlers as::

        @router.get("/me")
        async def me(user: dict = Depends(get_current_user)):
            return {"id": user["sub"]}
    """
    return verify_jwt(credentials.credentials)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        HTTPBearer(auto_error=False)
    ),
) -> dict[str, Any] | None:
    """
    Like ``get_current_user`` but returns ``None`` instead of raising 401
    when no token is provided.  Useful for public routes that enhance the
    response when authenticated.
    """
    if credentials is None:
        return None
    try:
        return verify_jwt(credentials.credentials)
    except HTTPException:
        return None


def require_admin(user: dict[str, Any]) -> dict[str, Any]:
    """
    Guard function — raises HTTP 403 if the authenticated user is not an admin.

    Supabase stores custom claims in ``app_metadata``.  Set
    ``{ "role": "admin" }`` there via Supabase Admin API or a DB trigger.

    Usage::

        @router.get("/admin/stats")
        async def stats(user: dict = Depends(get_current_user)):
            require_admin(user)
            ...
    """
    app_metadata: dict[str, Any] = user.get("app_metadata") or {}
    role: str = app_metadata.get("role", "")

    # Also support a top-level ``role`` claim (older Supabase versions)
    if not role:
        role = user.get("role", "")

    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user


def get_user_id(user: dict[str, Any]) -> str:
    """Extract the user UUID string from JWT claims (``sub`` claim)."""
    user_id: str | None = user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to identify user from token",
        )
    return user_id


def create_access_token(data: dict[str, Any]) -> str:
    """
    Mint a short-lived HS256 JWT — used for internal service tokens or
    testing.  Production auth tokens should always be issued by Supabase.
    """
    import datetime

    settings = get_settings()
    payload = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload.update({"exp": expire, "iat": datetime.datetime.utcnow()})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
