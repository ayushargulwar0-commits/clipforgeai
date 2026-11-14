"""
Internal AutoClip Microservice Entry Point.
Listens on port 8000 (or PORT env var) to serve internal clip jobs for ClipForge AI.
"""
import os
import sys
from pathlib import Path

# Ensure services/autoclip is on PYTHONPATH
root_dir = Path(__file__).parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.internal_jobs import router as internal_router

app = FastAPI(
    title="AutoClip Internal Engine API",
    description="Internal backend video clipping engine for ClipForge AI",
    version="1.0.0",
    docs_url=None,   # Internal only
    redoc_url=None,  # Internal only
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(internal_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "autoclip-internal-engine"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("AUTOCLIP_HOST", "0.0.0.0")
    uvicorn.run("backend.internal_server:app", host=host, port=port, reload=False)
