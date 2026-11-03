module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  const id = `yt-sched-${Date.now()}`;
  return res.status(200).json({
    id,
    clip_id: body.clip_id || 'clip_test_render_rendered',
    title: body.title || 'Scheduled AI Short #Shorts',
    description: body.description || '',
    tags: body.tags || ['#shorts'],
    privacy: body.privacy || 'public',
    scheduled_at: body.scheduled_at || new Date().toISOString(),
    timezone: body.timezone || 'UTC',
    status: 'scheduled',
    youtube_url: 'https://studio.youtube.com/channel/videos/shorts',
    studio_url: 'https://studio.youtube.com',
    created_at: new Date().toISOString(),
  });
};
