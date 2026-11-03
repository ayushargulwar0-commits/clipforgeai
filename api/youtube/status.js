module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    connected: true,
    channel_name: 'Ayush Argulwar',
    channel_email: 'ayushargulwar0@gmail.com',
    channel_handle: '@ayushargulwar',
    channel_id: 'UC_clipforge_live',
    subscriber_count: 'Creator Channel',
    connected_at: new Date().toISOString(),
  });
};
