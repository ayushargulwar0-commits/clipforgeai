module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE,PUT,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, X-User-Email, X-User-Role');
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

  // Assets list endpoint
  if (url.includes('/assets')) {
    return res.status(200).json([]);
  }

  // Thumbnails endpoint
  if (url.includes('/thumbnails')) {
    const thumbs = Array.from({ length: 8 }, (_, i) => `/thumbnails/yt-clip-1794763864649-1_thumb_${i}.jpg`);
    return res.status(200).json({
      thumbnails: thumbs,
      cached: true,
      count: 8,
    });
  }

  // Video streaming endpoint: redirect to bundled sample MP4
  if (url.includes('/stream')) {
    return res.redirect(302, '/sample-clip.mp4');
  }

  // Render export endpoint
  if (url.includes('/selective-render') || url.includes('/render')) {
    const body = req.body || {};
    const aspect = body.aspect_ratio || '9:16';
    let outputUrl = '/sample-clip-9-16.mp4';
    if (aspect === '1:1') outputUrl = '/sample-clip-1-1.mp4';
    else if (aspect === '4:5') outputUrl = '/sample-clip-4-5.mp4';

    return res.status(200).json({
      success: true,
      output_url: outputUrl,
      duration: 30.0,
      aspect_ratio: aspect,
      filename: outputUrl.replace('/', ''),
    });
  }

  // Clip edit state endpoint
  if (url.includes('/edit')) {
    if (req.method === 'PUT') {
      return res.status(200).json({
        success: true,
        message: 'Saved in preview',
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

  // Single clip lookup
  const clipMatch = url.match(/\/clips\/([^\/\?]+)/);
  if (clipMatch && !url.includes('/edit') && !url.includes('/stream') && !url.includes('/thumbnails') && !url.includes('/render')) {
    const cid = clipMatch[1];
    return res.status(200).json({
      id: cid,
      title: cid.startsWith('yt-clip-') ? 'YouTube Viral Short' : `Clip ${cid}`,
      duration: 33.0,
      source_url: '/sample-clip.mp4',
      status: 'rendered',
    });
  }

  return res.status(200).json({
    success: true,
    endpoint: url,
    message: 'ClipForge API active',
  });
};
