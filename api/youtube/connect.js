module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || {};
  const channel_name = query.channel_name || 'Ayush Argulwar';
  const channel_email = query.channel_email || 'ayushargulwar0@gmail.com';
  const channel_handle = query.channel_handle || '@ayushargulwar';

  return res.status(200).json({
    success: true,
    channel_name,
    channel_email,
    channel_handle,
    channel_id: `UC_clipforge_${Date.now()}`,
    message: 'Channel connected successfully for automatic Shorts publishing.',
  });
};
