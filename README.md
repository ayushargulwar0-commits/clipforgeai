# ClipForge AI 🎬⚡

> **Forge viral short-form content from any long video.**  
> An open-source AI video repurposing SaaS platform inspired by ScaleReach, built with FastAPI, faster-whisper, PySceneDetect, FFmpeg, React 19, and Supabase.

---

## Key Features

- ✂️ **AI Clip Detection**: Automatic identification of viral moments using speech hook scoring, rhetorical question detection, and sentence completion logic.
- 💬 **Kinetic Word-by-Word Captions**: Sub-millisecond synchronized subtitle animations with customizable karaoke highlight effects, fonts, and colors.
- 📱 **Smart 9:16 Video Reframing**: Converts landscape 16:9 recordings to portrait vertical format with speaker centering and background Gaussian blur.
- 🎮 **Split-Screen Multi-Cam**: Stack facecam over gameplay or slide decks for Twitch streamers and EdTech educators.
- 🔇 **Silence & Filler Remover**: Automatically prunes awkward pauses and dead air based on audio decibel thresholds.
- 🌐 **Global Video Translator**: Transcribes and translates speech into 50+ languages with timestamp synchronization.
- 📅 **Content Scheduler & Brand Kit**: Plan your social media drops and preserve brand colors, watermarks, and caption styles.
- 🛠️ **Browser-Based Video Editor**: Trim, zoom, reframe, edit captions, and preview in real time before triggering background FFmpeg rendering.
- 🔒 **Zero Cost / Open-Source Stack**: Built to run entirely on free & open-source software (faster-whisper, OpenCV, FFmpeg) with ₹0 initial development budget.

---

## Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Motion, Lucide Icons |
| **Backend** | Python 3, FastAPI, SlowAPI (rate limiting), Pydantic v2 |
| **Database & Auth** | Supabase PostgreSQL, Row Level Security (RLS), Supabase Auth |
| **AI Transcription** | faster-whisper (CTranslate2 INT8 quantized ASR) |
| **Video Engine** | FFmpeg, FFprobe, imageio-ffmpeg, OpenCV |
| **Storage** | Local filesystem adapter (dev) / Supabase Storage (prod) |

---

## Directory Structure

```
clipforge-ai/
├── apps/
│   ├── web/                    # React 19 + Vite frontend
│   │   ├── src/
│   │   │   ├── components/     # UI primitives, layout, uploader
│   │   │   ├── pages/          # Public marketing & auth pages
│   │   │   ├── dashboard/      # Overview, Projects, Videos, Clips, Editor, Scheduler
│   │   │   ├── hooks/          # useAuth, custom hooks
│   │   │   └── lib/            # api client, supabase client, utilities
│   │   └── package.json
│   │
│   └── api/                    # FastAPI backend
│       ├── app/
│       │   ├── ai/             # faster-whisper transcription & clip detector
│       │   ├── core/           # config, database, security
│       │   ├── models/         # Pydantic v2 schemas and enums
│       │   ├── routes/         # REST API endpoints
│       │   ├── services/       # Video, clip, project, and storage services
│       │   ├── video/          # FFmpeg processor & thumbnail generator
│       │   └── workers/        # Async background job runner
│       └── requirements.txt
│
├── packages/
│   └── shared/                 # Shared TypeScript interfaces
├── supabase/
│   ├── migrations/             # Complete 001_initial_schema.sql
│   └── seed.sql                # Seed data for local testing
├── docs/                       # Architecture, API, Deployment, Local Dev
└── README.md
```

---

## Quick Start (Local Dev)

### 1. Start the FastAPI Backend
```bash
cd apps/api
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Open `http://localhost:8000/docs` to inspect the interactive Swagger API docs.

### 2. Start the Frontend
```bash
cd apps/web
npm install
npm run dev
```
Open `http://localhost:5173` to browse the marketing website and dashboard.

---

## License

MIT License — Built with open-source technologies.
