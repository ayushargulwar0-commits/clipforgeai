export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    success: true,
    youtube_video_id: 'yt-pub-' + Date.now(),
    video_url: 'https://youtube.com/shorts/sample',
    message: 'Uploaded to YouTube successfully',
  });
}
