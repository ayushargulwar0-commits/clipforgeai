"""
Supabase client initialisation for ClipForge AI backend.

We use the **service-role key** here so the backend can bypass Row Level
Security (RLS) policies.  This module must NEVER be imported by any
code path that could expose secrets to the client.
"""

from __future__ import annotations

import logging
from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """
    Return a cached Supabase ``Client`` instance configured with the
    service-role key.

    The client is thread-safe and can be shared across requests.
    """
    settings = get_settings()

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment."
        )

    client: Client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
    )
    logger.info("Supabase client initialised (url=%s)", settings.SUPABASE_URL)
    return client


def get_anon_supabase() -> Client:
    """
    Return a Supabase ``Client`` using the anon key.

    Use this ONLY when you intentionally want RLS to apply
    (e.g., verifying that a public resource is truly public).
    """
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


async def health_check_db() -> bool:
    """
    Ping Supabase by fetching a single row from the ``projects`` table.
    Returns ``True`` when the connection is healthy, ``False`` otherwise.
    """
    try:
        client = get_supabase()
        # A simple, low-cost select to verify connectivity
        client.table("projects").select("id").limit(1).execute()
        return True
    except Exception as exc:  # pragma: no cover
        logger.error("Supabase health check failed: %s", exc)
        return False


# ---------------------------------------------------------------------------
# Relational Database Storage (clip_edits, assets)
# ---------------------------------------------------------------------------
import sqlite3
from pathlib import Path

_SQLITE_DB_PATH = Path("storage/clipforge.db")


def get_sqlite_conn() -> sqlite3.Connection:
    """Returns thread-safe connection to the real relational database file."""
    _SQLITE_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_SQLITE_DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_local_db():
    """Initializes tables for clip_edits and assets."""
    conn = get_sqlite_conn()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS clip_edits (
                clip_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                edit_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_clip_edits_user ON clip_edits(user_id);")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS assets (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                asset_type TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_url TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                mime_type TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);")


# Initialize on module load
try:
    init_local_db()
except Exception as e:
    logger.debug("Database initialization notice: %s", e)

