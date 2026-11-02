-- =============================================================
-- ClipForge AI — Seed Data for Local Development
-- =============================================================

-- Seed an admin profile and creator profile
-- Note: Replace UUIDs with valid auth.users IDs in a live Supabase project
DO $$
DECLARE
    dev_user_id UUID := '00000000-0000-0000-0000-000000000001';
    dev_admin_id UUID := '00000000-0000-0000-0000-000000000002';
    dev_workspace_id UUID := '11111111-1111-1111-1111-111111111111';
    dev_project_id UUID := '22222222-2222-2222-2222-222222222222';
    dev_video_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- Workspaces
    INSERT INTO workspaces (id, name, slug, owner_id, plan)
    VALUES (dev_workspace_id, 'Acme Media Labs', 'acme-media', dev_user_id, 'creator')
    ON CONFLICT (slug) DO NOTHING;

    -- Projects
    INSERT INTO projects (id, workspace_id, owner_id, name, description, status)
    VALUES (
        dev_project_id,
        dev_workspace_id,
        dev_user_id,
        'Tech Founders Podcast S2',
        'Weekly video interview series with tech builders and founders.',
        'active'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Brand Kit
    INSERT INTO brand_kits (owner_id, workspace_id, name, primary_color, secondary_color, font_family)
    VALUES (
        dev_user_id,
        dev_workspace_id,
        'Tech Founders Theme',
        '#7C3AED',
        '#3B82F6',
        'Inter'
    )
    ON CONFLICT DO NOTHING;

    -- Sample Video Asset
    INSERT INTO video_assets (
        id, project_id, owner_id, filename, original_name, file_path, file_size,
        duration, width, height, fps, codec, status
    )
    VALUES (
        dev_video_id,
        dev_project_id,
        dev_user_id,
        'sample_founder_interview.mp4',
        'Episode_42_AI_Founders_Interview.mp4',
        'storage/videos/sample_founder_interview.mp4',
        145000000,
        3842.0,
        1920,
        1080,
        30.0,
        'h264',
        'ready'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Sample Transcript
    INSERT INTO transcripts (video_id, language, full_text, word_count, content)
    VALUES (
        dev_video_id,
        'en',
        'The hardest truth about scaling past ten million is that everything that got you there completely breaks down.',
        19,
        '{"segments": [{"start": 142.5, "end": 178.0, "text": "The hardest truth about scaling past ten million is that everything that got you there completely breaks down."}]}'
    )
    ON CONFLICT (video_id) DO NOTHING;

    -- Sample Clip
    INSERT INTO clips (
        video_id, owner_id, title, description, hook, transcript_text,
        start_time, end_time, aspect_ratio, status, score
    )
    VALUES (
        dev_video_id,
        dev_user_id,
        'The Hardest Truth About Scaling to $10M ARR',
        'Founder breaks down why initial product-market fit does not guarantee scale.',
        'Nobody tells you this about scaling...',
        'The hardest truth about scaling past ten million is that everything that got you there completely breaks down.',
        142.5,
        178.0,
        '9:16',
        'rendered',
        96.0
    )
    ON CONFLICT DO NOTHING;

END;
$$;
