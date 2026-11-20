export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE,PUT,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, X-User-Email, X-User-Role');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';

  // 1. YouTube & URL Video Ingestion Endpoint
  if (url.includes('/upload/url')) {
    const body = req.body || {};
    const videoUrl = body.url || '';
    let ytId = null;
    const match = videoUrl.match(/(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})/);
    if (match) ytId = match[1];

    const timestamp = Date.now();
    const clipId = ytId ? `yt-clip-${timestamp}-1` : `clip-${timestamp}-1`;
    const videoId = ytId ? `yt-vid-${timestamp}` : `vid-${timestamp}`;
    const title = ytId ? `YouTube Video (${ytId})` : (body.title || 'Imported Video');

    return res.status(201).json({
      success: true,
      job_id: `job-${timestamp}`,
      video_id: videoId,
      filename: title,
      title: title,
      duration: 33.0,
      width: 1920,
      height: 1080,
      file_size: 24500000,
      status: 'ready',
      youtube_id: ytId,
      clips: [
        {
          id: clipId,
          title: `Viral Highlight: ${title}`,
          duration: 30.0,
          aspect_ratio: '9:16',
          status: 'ready',
          youtube_id: ytId,
          video_url: videoUrl,
        }
      ],
      message: 'Source ingested and clips generated successfully.',
    });
  }

  // 2. Direct Video File Upload
  if (url.includes('/upload/video') || url.includes('/upload')) {
    const timestamp = Date.now();
    const videoId = `vid-${timestamp}`;
    return res.status(201).json({
      success: true,
      video_id: videoId,
      filename: 'Uploaded Footage.mp4',
      title: 'Uploaded Footage',
      duration: 45.0,
      width: 1920,
      height: 1080,
      file_size: 15400000,
      status: 'ready',
      clips: [
        {
          id: `clip-${timestamp}-1`,
          title: 'Highlight Clip 1',
          duration: 30.0,
          aspect_ratio: '9:16',
          status: 'ready',
        }
      ],
      message: 'Video uploaded and processed successfully.',
    });
  }

  // 3. Stream token endpoint
  if (url.includes('/stream-token')) {
    return res.status(200).json({
      token: 'vercel_preview_token_' + Date.now(),
      expires_in: 600,
    });
  }

  // 4. Clips listing endpoint (GET /api/clips)
  if (url === '/clips' || url === '/clips/' || url.endsWith('/api/clips') || url.endsWith('/api/clips/')) {
    return res.status(200).json([
      {
        id: 'yt-clip-default-1',
        title: 'Billionaire Brain Secrets — Viral Short',
        duration: 30.0,
        aspect_ratio: '9:16',
        status: 'ready',
        youtube_id: 'Rni7Fz7208c',
        video_url: 'https://youtu.be/Rni7Fz7208c',
        file_path: 'storage/clips/sample-clip-9-16.mp4',
        created_at: new Date().toISOString(),
      }
    ]);
  }

  // 5. Assets list endpoint
  if (url.includes('/assets')) {
    return res.status(200).json([]);
  }

  // 6. Thumbnails endpoint
  if (url.includes('/thumbnails')) {
    const thumbs = Array.from({ length: 8 }, (_, i) => `/thumbnails/yt-clip-1794763864649-1_thumb_${i}.jpg`);
    return res.status(200).json({
      thumbnails: thumbs,
      cached: true,
      count: 8,
    });
  }

  // 7. Video streaming endpoint
  if (url.includes('/stream')) {
    return res.redirect(302, '/sample-clip-9-16.mp4');
  }

  // 8. Render / Export endpoints
  if (url.includes('/export')) {
    const jobId = 'job-' + Date.now();
    return res.status(200).json({
      job_id: jobId,
      status: 'rendering',
      progress: 10,
      message: 'Export render started',
    });
  }

  if (url.includes('/exports/')) {
    return res.status(200).json({
      status: 'completed',
      progress: 100,
      download_url: '/sample-clip-9-16.mp4',
      shorts_path: 'storage/exports/sample.mp4',
    });
  }

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

  // 9. Clip status endpoint
  if (url.includes('/status')) {
    return res.status(200).json({
      status: 'ready',
      progress: 100,
      duration: 30.0,
    });
  }

  // 10. Clip edit state endpoint
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

  // 11. Single clip lookup
  const clipMatch = url.match(/\/clips\/([^\/\?]+)/);
  if (clipMatch && !url.includes('/edit') && !url.includes('/stream') && !url.includes('/thumbnails') && !url.includes('/render')) {
    const cid = clipMatch[1];
    return res.status(200).json({
      id: cid,
      title: cid.startsWith('yt-clip-') ? 'YouTube Viral Short' : `Clip ${cid}`,
      duration: 30.0,
      source_url: '/sample-clip-9-16.mp4',
      status: 'ready',
    });
  }

  return res.status(200).json({
    success: true,
    endpoint: url,
    message: 'ClipForge API active',
  });
}
