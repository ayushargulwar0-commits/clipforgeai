# ClipForge AI — Architecture Overview

ClipForge AI is an end-to-end, production-ready AI video repurposing SaaS platform designed to transform long-form video footage (podcasts, webinars, interviews, YouTube videos, gameplay streams) into high-retention short-form clips for TikTok, Instagram Reels, and YouTube Shorts.

---

## 1. System Architecture Diagram

```
[ User Browser / Client ]
   ├── React 19 + Vite + TypeScript (Single Page Application)
   ├── Motion Animations + Lucide Icons + Tailwind CSS
   └── Direct Supabase Auth & Video Stream Playback
         │
         │ REST API Calls & WebSocket / SSE Updates
         ▼
[ FastAPI Backend Gateway ]
   ├── CORS, Rate Limiting (SlowAPI), JWT Authentication Guard
   ├── Video Ingestion & File Type / Size Validation
   ├── Project & Asset Management
   └── Background Job Dispatcher (asyncio Queue + ThreadPoolExecutor)
         │
         ├──► [ Video Processor (FFmpeg & FFprobe) ]
         │       • Audio Extraction (16kHz PCM WAV)
         │       • Smart Aspect Ratio Conversion (9:16, 1:1, 16:9)
         │       • Subtitle Burn-In (Dynamic Styles)
         │       • Frame Thumbnail Generation
         │
         ├──► [ AI Transcription (faster-whisper) ]
         │       • ASR with CTranslate2 INT8 quantization
         │       • Word-level timestamp alignment
         │       • 90+ Language Detection & Transcription
         │
         ├──► [ AI Clip Detection Engine (NLP Scoring) ]
         │       • Rhetorical Hook Recognition
         │       • Emotional Pacing & Question-Answer Analysis
         │       • Duration Fitness & Overlap Deduplication
         │
         └──► [ Data & Storage Layer ]
                 • Local Filesystem Storage Adapter (Dev)
                 • Supabase Storage Adapter (Cloud)
                 • Supabase PostgreSQL Database with Row Level Security (RLS)
```

---

## 2. Core Subsystems

### 2.1 Frontend (`apps/web`)
- **Framework**: Vite + React 19 + TypeScript.
- **Styling**: Tailwind CSS with custom brand design tokens (`#7C3AED` violet, `#3B82F6` blue on `#0A0A0F` dark canvas).
- **Video Player & Editor**: Browser canvas with interactive crop, zoom, repositioning, and live caption preview.
- **State Management**: Zustand for auth & persistent workspace state, `@tanstack/react-query` for API caching.

### 2.2 Backend API (`apps/api`)
- **Framework**: FastAPI (async-first Python).
- **Security**: JWT validation for Supabase tokens, role verification (`user` vs `admin`), SSRF URL validation.
- **Worker System**: Dedicated asynchronous `JobRunner` with thread pool execution for CPU/IO bound tasks (Whisper inference and FFmpeg encoding).

### 2.3 Storage Adapter Pattern
- Defined via `StorageAdapter` interface in `app/services/storage_service.py`.
- **Local Adapter**: Saves files directly in `./storage/videos`, `./storage/clips`, `./storage/audio`, `./storage/thumbnails`.
- **Supabase Adapter**: Direct upload to private buckets using the Supabase Python SDK.

### 2.4 Database & Security
- 15 relational tables managed via PostgreSQL migrations.
- Strict Row Level Security policies guaranteeing workspace and user data isolation.
