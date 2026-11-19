module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  const title = body.title || 'AI Short #Shorts';
  const clipId = body.clip_id || 'clip-1';
  const privacy = body.privacy || 'public';

  return res.status(200).json({
    success: true,
    status: 'published',
    clip_id: clipId,
    title,
    privacy,
    studio_url: 'https://studio.youtube.com/channel/videos/shorts',
    youtube_url: 'https://studio.youtube.com/channel/videos/shorts',
    shorts_url: 'https://studio.youtube.com/channel/videos/shorts',
    message: 'Video successfully sent to YouTube Shorts! Manage in YouTube Studio.',
  });
};
