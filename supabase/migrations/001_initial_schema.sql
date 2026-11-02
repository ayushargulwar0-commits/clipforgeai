-- =============================================================
-- ClipForge AI — Supabase Database Migration
-- Migration: 001_initial_schema.sql
-- =============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- PROFILES
-- Extends auth.users with app-specific data
-- =============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name     TEXT,
    avatar_url    TEXT,
    role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'creator', 'pro', 'team')),
    credits       INTEGER NOT NULL DEFAULT 100,
    bio           TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================
-- WORKSPACES
-- =============================================================
CREATE TABLE IF NOT EXISTS workspaces (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan        TEXT NOT NULL DEFAULT 'free',
    logo_url    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- WORKSPACE MEMBERS
-- =============================================================
CREATE TABLE IF NOT EXISTS workspace_members (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (workspace_id, user_id)
);

-- =============================================================
-- PROJECTS
-- =============================================================
CREATE TABLE IF NOT EXISTS projects (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    description  TEXT,
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);

-- =============================================================
-- VIDEO ASSETS
-- =============================================================
CREATE TABLE IF NOT EXISTS video_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
    owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename        TEXT NOT NULL,
    original_name   TEXT NOT NULL,
    file_path       TEXT NOT NULL,
    file_size       BIGINT NOT NULL DEFAULT 0,
    duration        FLOAT,
    width           INTEGER,
    height          INTEGER,
    fps             FLOAT,
    codec           TEXT,
    thumbnail_path  TEXT,
    status          TEXT NOT NULL DEFAULT 'uploaded'
                    CHECK (status IN ('uploaded','transcribing','transcribed','processing','ready','failed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_assets_owner_id ON video_assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_video_assets_project_id ON video_assets(project_id);

-- =============================================================
-- TRANSCRIPTS
-- =============================================================
CREATE TABLE IF NOT EXISTS transcripts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id     UUID NOT NULL REFERENCES video_assets(id) ON DELETE CASCADE UNIQUE,
    language     TEXT NOT NULL DEFAULT 'en',
    content      JSONB NOT NULL DEFAULT '{}',  -- {segments: [...], duration: n}
    full_text    TEXT,
    word_count   INTEGER DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- CLIPS
-- =============================================================
CREATE TABLE IF NOT EXISTS clips (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id        UUID NOT NULL REFERENCES video_assets(id) ON DELETE CASCADE,
    owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    hook            TEXT,
    transcript_text TEXT,
    start_time      FLOAT NOT NULL,
    end_time        FLOAT NOT NULL,
    duration        FLOAT GENERATED ALWAYS AS (end_time - start_time) STORED,
    aspect_ratio    TEXT NOT NULL DEFAULT '9:16' CHECK (aspect_ratio IN ('9:16','16:9','1:1')),
    status          TEXT NOT NULL DEFAULT 'detected'
                    CHECK (status IN ('detected','rendering','rendered','failed')),
    output_path     TEXT,
    thumbnail_path  TEXT,
    editing_config  JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clips_video_id ON clips(video_id);
CREATE INDEX IF NOT EXISTS idx_clips_owner_id ON clips(owner_id);

-- =============================================================
-- CLIP SCORES
-- =============================================================
CREATE TABLE IF NOT EXISTS clip_scores (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id     UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE UNIQUE,
    score       FLOAT NOT NULL CHECK (score BETWEEN 0 AND 100),
    explanation TEXT,
    factors     JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- JOBS (background processing)
-- =============================================================
CREATE TABLE IF NOT EXISTS jobs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('transcription','clip_detection','render','thumbnail')),
    status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','processing','completed','failed','cancelled')),
    entity_id   UUID NOT NULL,   -- video_id or clip_id depending on type
    entity_type TEXT NOT NULL,   -- 'video' or 'clip'
    progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    error       TEXT,
    result      JSONB DEFAULT '{}',
    started_at  TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_owner_id ON jobs(owner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_entity_id ON jobs(entity_id);

-- =============================================================
-- CAPTIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS captions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id      UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE UNIQUE,
    srt_content  TEXT,
    style_config JSONB DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- BRAND KITS
-- =============================================================
CREATE TABLE IF NOT EXISTS brand_kits (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name         TEXT NOT NULL DEFAULT 'Default',
    logo_url     TEXT,
    primary_color TEXT DEFAULT '#7c3aed',
    secondary_color TEXT DEFAULT '#3b82f6',
    font_family  TEXT DEFAULT 'Inter',
    watermark_url TEXT,
    intro_path   TEXT,
    outro_path   TEXT,
    caption_template JSONB DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- SCHEDULES
-- =============================================================
CREATE TABLE IF NOT EXISTS schedules (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clip_id      UUID REFERENCES clips(id) ON DELETE SET NULL,
    platform     TEXT NOT NULL CHECK (platform IN ('instagram','tiktok','youtube','twitter','linkedin')),
    caption      TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','failed')),
    published_url TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_owner_id ON schedules(owner_id);
CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_at ON schedules(scheduled_at);

-- =============================================================
-- SUBSCRIPTIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    workspace_id    UUID REFERENCES workspaces(id),
    plan            TEXT NOT NULL DEFAULT 'free',
    status          TEXT NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- USAGE RECORDS
-- =============================================================
CREATE TABLE IF NOT EXISTS usage_records (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action      TEXT NOT NULL,  -- 'upload', 'transcription', 'clip_detection', 'render', 'export'
    credits     INTEGER NOT NULL DEFAULT 0,
    entity_id   UUID,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_records_owner_id ON usage_records(owner_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_created_at ON usage_records(created_at);

-- =============================================================
-- NOTIFICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    title       TEXT NOT NULL,
    message     TEXT,
    read        BOOLEAN NOT NULL DEFAULT FALSE,
    data        JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_assets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips             ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE captions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);
-- Admins can read all
CREATE POLICY "profiles_admin_read" ON profiles FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Projects: own data only
CREATE POLICY "projects_own" ON projects FOR ALL USING (auth.uid() = owner_id);

-- Video assets: own data only
CREATE POLICY "video_assets_own" ON video_assets FOR ALL USING (auth.uid() = owner_id);

-- Transcripts: own videos only
CREATE POLICY "transcripts_own" ON transcripts FOR ALL
    USING (EXISTS (SELECT 1 FROM video_assets v WHERE v.id = transcripts.video_id AND v.owner_id = auth.uid()));

-- Clips: own data only
CREATE POLICY "clips_own" ON clips FOR ALL USING (auth.uid() = owner_id);

-- Clip scores: own clips only
CREATE POLICY "clip_scores_own" ON clip_scores FOR ALL
    USING (EXISTS (SELECT 1 FROM clips c WHERE c.id = clip_scores.clip_id AND c.owner_id = auth.uid()));

-- Jobs: own jobs only
CREATE POLICY "jobs_own" ON jobs FOR ALL USING (auth.uid() = owner_id);

-- Captions: own clips only
CREATE POLICY "captions_own" ON captions FOR ALL
    USING (EXISTS (SELECT 1 FROM clips c WHERE c.id = captions.clip_id AND c.owner_id = auth.uid()));

-- Brand kits: own data only
CREATE POLICY "brand_kits_own" ON brand_kits FOR ALL USING (auth.uid() = owner_id);

-- Schedules: own data only
CREATE POLICY "schedules_own" ON schedules FOR ALL USING (auth.uid() = owner_id);

-- Subscriptions: own data only
CREATE POLICY "subscriptions_own" ON subscriptions FOR ALL USING (auth.uid() = owner_id);

-- Usage records: own data only
CREATE POLICY "usage_records_own" ON usage_records FOR ALL USING (auth.uid() = owner_id);

-- Notifications: own notifications only
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Workspaces: owner or member
CREATE POLICY "workspaces_access" ON workspaces FOR ALL
    USING (
        auth.uid() = owner_id
        OR EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspaces.id AND wm.user_id = auth.uid()
        )
    );

-- Workspace members: member can read, owner can manage
CREATE POLICY "workspace_members_read" ON workspace_members FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
    );

CREATE POLICY "workspace_members_write" ON workspace_members FOR INSERT
    USING (EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid()));

-- =============================================================
-- UPDATED_AT triggers
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$
DECLARE tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'profiles','workspaces','projects','video_assets',
        'transcripts','clips','captions','brand_kits',
        'schedules','subscriptions','jobs'
    ] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', tbl);
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
            tbl
        );
    END LOOP;
END;
$$;
