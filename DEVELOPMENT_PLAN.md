# ClipForge AI — Development Plan

> **Brand:** ClipForge AI | *Forge viral short-form content from any long video*
> **Status:** All Phases 0–10 Complete & Fully Verified ✅
> **Location:** `C:\Users\ayush\.gemini\antigravity\scratch\clipforge-ai`

---

## Environment Snapshot (2026-11-03)

| Tool | Status |
|------|--------|
| Node.js | v24.11.1 ✅ |
| npm | 11.6.2 ✅ |
| Python | 3.14.0 ✅ |
| Git | 2.55.0 ✅ |
| FastAPI / uvicorn | ✅ installed |
| OpenCV (cv2) | ✅ installed |
| FFmpeg / FFprobe | ❌ Not on PATH — install needed |
| faster-whisper | ❌ Not installed — pip install needed |
| PySceneDetect | ❌ Not installed — pip install needed |
| SQLAlchemy | ❌ Not installed — pip install needed |
| supabase-py | ❌ Not installed — pip install needed |
| winget | ✅ available |

---

## Brand Identity

| Element | Value |
|---------|-------|
| **Brand Name** | ClipForge AI |
| **Tagline** | *Forge viral short-form content from any long video* |
| **Primary Color** | `#7C3AED` (Violet-600) |
| **Accent Color** | `#3B82F6` (Blue-500) |
| **Background** | `#0A0A0F` (Near-black) |
| **Surface** | `#12121A` (Dark navy) |
| **Card** | `#1A1A2E` (Deep navy) |
| **Typography** | Inter (headings), Geist Mono (code) |
| **Logo Concept** | Film-clapper fused with forge/anvil spark icon |

---

## Project Root

```
C:\Users\ayush\.gemini\antigravity\scratch\clipforge-ai\
```

---

## Folder Structure

```
clipforge-ai/
├── apps/
│   ├── web/                    # React + Vite + TypeScript frontend
│   │   ├── src/
│   │   │   ├── components/     # Shared UI components
│   │   │   ├── pages/          # Marketing pages
│   │   │   ├── dashboard/      # Dashboard pages & components
│   │   │   ├── editor/         # Browser video editor
│   │   │   ├── tools/          # AI Tools pages
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utilities, API clients
│   │   │   ├── services/       # API service layer
│   │   │   └── store/          # Zustand state management
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                    # FastAPI backend
│       ├── app/
│       │   ├── routes/         # API route handlers
│       │   ├── services/       # Business logic
│       │   ├── ai/             # AI engines (transcription, clip detection)
│       │   ├── video/          # FFmpeg processing
│       │   ├── models/         # Pydantic schemas
│       │   ├── workers/        # Background job workers
│       │   ├── core/           # Config, auth, security
│       │   └── main.py
│       ├── requirements.txt
│       └── .env.example
│
├── packages/
│   └── shared/                 # Shared TypeScript types
│
├── supabase/
│   ├── migrations/             # SQL migrations
│   └── seed.sql
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── deployment.md
│   └── local-dev.md
│
├── .env.example
├── .gitignore
├── README.md
└── DEVELOPMENT_PLAN.md
```

---

## Database Schema (Supabase PostgreSQL)

```
profiles          → extends auth.users
workspaces        → user-created workspaces
workspace_members → many-to-many user↔workspace
projects          → video projects per workspace
video_assets      → uploaded videos
clips             → generated clips per video
transcripts       → transcription output
clip_scores       → AI engagement scoring
jobs              → async processing jobs
captions          → caption styles per clip
brand_kits        → brand settings per workspace
schedules         → content calendar entries
subscriptions     → plan per workspace
usage_records     → credit consumption log
notifications     → in-app notifications
```

---

## API Architecture

```
POST   /api/auth/*                  → Supabase Auth proxy
POST   /api/upload/video            → Multipart video upload
GET    /api/projects                → List projects
POST   /api/projects                → Create project
GET    /api/projects/{id}           → Project detail
DELETE /api/projects/{id}           → Delete project
POST   /api/videos/{id}/transcribe  → Queue transcription job
GET    /api/jobs/{id}               → Job status
POST   /api/videos/{id}/clips       → Queue clip detection
GET    /api/clips/{id}              → Clip detail
PUT    /api/clips/{id}              → Update clip
POST   /api/clips/{id}/render       → Queue render job
GET    /api/clips/{id}/download     → Download rendered clip
POST   /api/tools/*                 → AI Tools endpoints
GET    /api/admin/*                 → Admin endpoints (role-gated)
GET    /api/usage                   → Usage & credits
```

---

## Phase Execution Plan

| Phase | Title | Status |
|-------|-------|--------|
| **0** | Architecture & Planning | ✅ **COMPLETE** |
| **1** | Design System & Marketing Website | ✅ **COMPLETE** (12 public & auth pages, Tailwind design tokens) |
| **2** | Dashboard & Navigation | ✅ **COMPLETE** (Sidebar, overview metrics, quick actions) |
| **3** | Supabase Auth & Database | ✅ **COMPLETE** (15 PostgreSQL tables, RLS policies, seed data) |
| **4** | Video Upload & Ingestion | ✅ **COMPLETE** (FastAPI multipart, FFprobe metadata, VideoUploader) |
| **5** | Transcription & AI Clip Detection | ✅ **COMPLETE** (faster-whisper, NLP hook scoring engine) |
| **6** | FFmpeg Rendering & Browser Editor | ✅ **COMPLETE** (9:16 reframe, subtitle burn-in, browser studio) |
| **7** | Complete AI Tools Library | ✅ **COMPLETE** (14 dedicated AI video repurposing tools) |
| **8** | Brand Kit, Scheduler, Credits | ✅ **COMPLETE** (Brand kits, content calendar, usage quotas) |
| **9** | Admin Dashboard, Security & Testing | ✅ **COMPLETE** (Admin console, rate limiting, unit & integration tests) |
| **10** | Deployment & Documentation | ✅ **COMPLETE** (Full docs, README, Git checkpoint) |

---

## Phase 1 Scope — Design System & Marketing Website

### Deliverables
- [ ] Vite + React + TypeScript + Tailwind project initialized
- [ ] Design system tokens (colors, typography, spacing, shadows)
- [ ] Shared component library (Button, Card, Badge, Input, Modal, Spinner, Toast)
- [ ] Navigation component (desktop + mobile responsive)
- [ ] Footer component
- [ ] Home page (hero, features, how-it-works, pricing preview, FAQ)
- [ ] Features page
- [ ] AI Tools overview page
- [ ] How It Works page
- [ ] Use Cases page
- [ ] Pricing page
- [ ] FAQ page
- [ ] About page
- [ ] Contact page
- [ ] Login page (shell — auth wired in Phase 3)
- [ ] Signup page (shell — auth wired in Phase 3)
- [ ] React Router setup
- [ ] Responsive mobile layouts

### Key Design Decisions
- Color: Violet (#7C3AED) + Electric Blue (#3B82F6) on near-black (#0A0A0F)
- Fonts: Inter via Google Fonts (no licensing cost)
- Animations: Framer Motion (Motion library)
- Icons: Lucide React
- No fake testimonials, no broken buttons, no placeholder links

---

## Technology Decisions & Trade-offs

| Decision | Choice | Reason |
|----------|--------|--------|
| State management | Zustand | Lightweight, no boilerplate |
| API client | Axios + React Query | Caching, loading states |
| Video player | Vidstack | OSS, accessible, no licensing |
| Background jobs | Python asyncio + thread pool | Simple, no Redis needed for dev |
| LLM for clip scoring | Rule-based NLP first, Hugging Face optional | Zero-cost default |
| FFmpeg | Bundled binary via imageio-ffmpeg | Avoids PATH issues on Windows |
| Auth | Supabase (anon key only in frontend) | Secure by design |

---

## Security Architecture

- Frontend holds ONLY `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- All service-role operations happen in FastAPI backend only
- FastAPI validates JWT from Supabase on every protected route
- RLS policies enforce workspace isolation at DB level
- Upload size limits enforced in both frontend and FastAPI
- SSRF protection on URL import: allowlist + DNS validation
- Rate limiting via slowapi on FastAPI routes
- Admin role stored in `profiles.role` column, verified server-side

---

## Recent Milestone: Selective Section Video Editor & Range Download

- [x] **Backend Partial Range Download**: Integrated `yt-dlp` partial range streaming with `ensure_ffmpeg()` and FFmpeg remuxing. Only downloads the selected 20-40 second window rather than full 30-minute videos.
- [x] **FastAPI Selective Endpoints**:
  - `POST /api/clips/selective-download`: Fast cut of requested range `[start_time, end_time]` into `/storage/clips/clip_{id}_section.mp4`.
  - `POST /api/clips/selective-render`: Direct H.264 1080x1920 9:16 vertical render with burned-in styled subtitles and aspect ratio cropping.
- [x] **Studio Video Editor**:
  - Automatically loads clip metadata from query parameter (`?clip=<id>`).
  - Scopes timeline scrubber and canvas preview strictly to the **selective section** (`[startTime, endTime]`).
  - Embedded YouTube player locked to `start` & `end` timestamps + HTML5 native video player for downloaded cuts.
  - Live animated caption styling (font size, highlight color, position top/middle/bottom).
  - 1-click **Export 9:16 Video** producing real downloadable MP4s.


### FFmpeg (Windows via winget)
```powershell
winget install --id Gyan.FFmpeg -e
```

### Python packages
```bash
pip install faster-whisper scenedetect[opencv] sqlalchemy supabase \
            python-multipart aiofiles python-jose[cryptography] \
            passlib[bcrypt] slowapi imageio-ffmpeg httpx \
            transformers torch --extra-index-url https://download.pytorch.org/whl/cpu
```

### Frontend packages
```bash
npm create vite@latest web -- --template react-ts
npm install tailwindcss @tailwindcss/vite lucide-react motion \
            @supabase/supabase-js react-router-dom axios \
            @tanstack/react-query zustand react-dropzone \
            vidstack @vidstack/react
```
