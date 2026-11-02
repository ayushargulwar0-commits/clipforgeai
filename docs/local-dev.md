# ClipForge AI — Local Development Guide

ClipForge AI is architected to run 100% locally with zero external paid APIs required during development.

---

## Prerequisites

- **Node.js**: v18+ (tested on Node v24)
- **Python**: 3.10+ (tested on Python 3.14)
- **FFmpeg**: Bundled automatically via `imageio-ffmpeg` or installed via package manager.

---

## 1. Backend Setup

```powershell
cd apps/api

# Create & activate a virtual environment (optional)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```

The API docs will be available at:
`http://localhost:8000/docs`

Health check:
`http://localhost:8000/health`

---

## 2. Frontend Setup

```powershell
cd apps/web

# Install packages
npm install

# Start Vite development server
npm run dev
```

The web dashboard will be available at:
`http://localhost:5173`

Requests to `/api` are automatically proxied by Vite to `http://localhost:8000`.

---

## 3. Storage Directory Layout

During local development with `STORAGE_BACKEND=local`, files are stored under:
```
apps/api/storage/
├── videos/        # Raw source video uploads
├── audio/         # Extracted 16kHz mono audio tracks
├── clips/         # Rendered 9:16 vertical MP4 exports
└── thumbnails/    # Generated video and clip thumbnail frames
```
