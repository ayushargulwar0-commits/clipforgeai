# ClipForge AI — Deployment Guide

This guide covers production deployment of the frontend, backend, database, and background processing workers.

---

## 1. Frontend (Vercel)

The frontend is a standard Vite + React SPA.

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `apps/web`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Configure Environment Variables in Vercel project settings:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_API_URL=https://api.yourdomain.com
   ```
6. Deploy.

---

## 2. Database & Authentication (Supabase)

1. Create a free project at [Supabase](https://supabase.com).
2. Navigate to the **SQL Editor**.
3. Run the complete migration script located at:
   `supabase/migrations/001_initial_schema.sql`
4. (Optional) Run `supabase/seed.sql` if you need development test records.
5. Create a Storage Bucket named `clipforge-media` with private permissions.
6. Copy your project URL, anon key, and service role key into your backend environment.

---

## 3. Python FastAPI Backend & Workers

Deploy the FastAPI backend to any Docker-capable or Python hosting environment (Railway, Render, AWS EC2, or a VPS).

### Dockerfile (Recommended)

```dockerfile
FROM python:3.11-slim

# Install system dependencies including FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/api .

ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Environment Variables

```env
APP_NAME=ClipForge AI
APP_VERSION=1.0.0
DEBUG=false
PORT=8000

SECRET_KEY=<generate-random-64-character-string>
ALLOWED_ORIGINS=https://your-frontend.vercel.app

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

STORAGE_BACKEND=supabase
SUPABASE_STORAGE_BUCKET=clipforge-media

WHISPER_MODEL_SIZE=small
```
