module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    items: [
      {
        id: 'yt-sched-demo-1',
        clip_id: 'clip_test_render_rendered',
        title: 'The Hardest Truth About Scaling past $10M #Shorts',
        description: 'Key insights extracted and edited automatically with ClipForge AI (https://clipforgeai.online). #shorts #founder',
        privacy: 'public',
        scheduled_at: '2026-11-04T18:00:00Z',
        timezone: 'UTC',
        status: 'scheduled',
        youtube_url: 'https://studio.youtube.com/channel/videos/shorts',
        studio_url: 'https://studio.youtube.com',
        created_at: new Date().toISOString(),
      }
    ]
  });
};
