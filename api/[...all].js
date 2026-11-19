module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE,PUT,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';

  // Stream token endpoint
  if (url.includes('/stream-token')) {
    return res.status(200).json({
      token: 'vercel_preview_token',
      expires_in: 600,
    });
  }

  // Thumbnails endpoint
  if (url.includes('/thumbnails')) {
    return res.status(200).json({
      thumbnails: [
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      ],
      cached: true,
      count: 3,
    });
  }

  // Video streaming endpoint: redirect to working sample MP4
  if (url.includes('/stream')) {
    return res.redirect(302, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  }

  // Clip edit state endpoint
  if (url.includes('/edit')) {
    if (req.method === 'PUT') {
      return res.status(200).json({
        success: true,
        message: 'Saved in cloud preview',
      });
    }
    return res.status(200).json({
      clip_id: 'default',
      user_id: 'owner-ayush',
      edit_json: {
        trim: { in: 0, out: 30 },
        aspect: '9:16',
        framing: {
          mode: 'crop',
          crop: { x: 21.88, y: 0, w: 56.25, h: 100 },
          split: {
            top: { x: 0, y: 0, w: 100, h: 50 },
            bottom: { x: 0, y: 50, w: 100, h: 50 },
          },
        },
        background: { type: 'blur', value: '' },
        captions: {
          enabled: true,
          preset: 'Firestorm Gold',
          words: [],
          style: {
            font: 'Noto Sans',
            size: 28,
            color: '#FACC15',
            highlight_color: '#EF4444',
            outline_color: '#000000',
            outline_width: 3,
            box: false,
            box_color: '#00000088',
            words_per_line: 2,
            position: 'lower_third',
            y_offset: 15,
          },
          safe_zones: true,
        },
        audio: {
          original_volume: 100,
          music: {
            asset_id: null,
            volume: 30,
            fade_in_s: 1.0,
            fade_out_s: 1.5,
            duck_under_speech: true,
          },
        },
        watermark: null,
        outro: {
          enabled: false,
          template: 'subscribe',
          text: 'Subscribe for More!',
          duration_s: 3,
          bg_color: '#0A0A0F',
          text_color: '#FFFFFF',
        },
      },
    });
  }

  return res.status(200).json({
    success: true,
    endpoint: url,
    message: 'ClipForge API active',
  });
};
