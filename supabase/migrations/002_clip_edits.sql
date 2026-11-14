-- ===========================================================================
-- Migration: 002_clip_edits.sql
-- Table: clip_edits
-- Purpose: Persist video clip editing state (trim, framing, captions, style)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.clip_edits (
    clip_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    edit_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clip_edits_user_id ON public.clip_edits (user_id);
