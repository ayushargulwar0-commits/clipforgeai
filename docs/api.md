# ClipForge AI — API Reference

All backend API routes are mounted under the `/api` prefix (except the `/health` liveness probe).

---

## Authentication & Headers

Protected routes expect a standard Bearer token in the `Authorization` header:

```http
Authorization: Bearer <supabase_jwt_access_token>
```

---

## Endpoints

### 1. Health
- `GET /health`
  - Returns: `{ "status": "ok", "app": "ClipForge AI", "version": "1.0.0", "timestamp": "..." }`

### 2. Video Ingestion
- `POST /api/upload/video`
  - Body: `multipart/form-data` with `file` (MP4, MOV, WebM, MKV) and optional `project_id`.
  - Returns: `UploadResponse` with `video_id`, `duration`, `width`, `height`, `codec`, `file_size`.
- `GET /api/videos/{video_id}/metadata`
  - Returns: Video technical metadata and status.
- `POST /api/videos/{video_id}/transcribe?language=en`
  - Queues faster-whisper transcription job.
  - Returns: `JobOut` with `job_id`, `status: "pending"`.

### 3. Clip Detection & Generation
- `POST /api/videos/{video_id}/clips/detect?min_duration=15&max_duration=60&max_clips=10`
  - Queues AI moment scoring and clip candidate generation.
  - Returns: `JobOut`.
- `GET /api/videos/{video_id}/clips`
  - Returns list of detected clips sorted by virality score descending.
- `GET /api/clips/{clip_id}`
  - Returns single clip details, hook analysis, and editing configuration.
- `PUT /api/clips/{clip_id}`
  - Updates clip title, description, or structured editing configuration JSON.
- `DELETE /api/clips/{clip_id}`
  - Deletes clip record and associated rendered media.

### 4. Video Rendering & Export
- `POST /api/clips/{clip_id}/render`
  - Queues FFmpeg render job to crop to chosen aspect ratio (9:16 default) and burn subtitles.
  - Returns: `JobOut`.
- `GET /api/clips/{clip_id}/download`
  - Streams final rendered H.264/AAC MP4 file.

### 5. Jobs & Processing
- `GET /api/jobs/{job_id}`
  - Returns: `{ "id": "...", "status": "pending|processing|completed|failed", "progress": 100, "result": {...} }`

### 6. Usage & Admin
- `GET /api/usage`
  - Returns user current plan quotas, remaining credits, and minutes used.
- `GET /api/admin/stats` (Admin Role Required)
  - Returns platform totals: users, active jobs, disk usage.
- `GET /api/admin/jobs` (Admin Role Required)
  - Returns global queue of worker jobs.
