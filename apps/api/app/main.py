"""
ClipForge AI — FastAPI application entry point.

Features
--------
* CORS middleware with configurable origins
* SlowAPI rate limiting (Redis-backed in prod, in-memory for dev)
* Global exception handler
* Lifespan context manager for startup / shutdown hooks
* All route modules mounted under /api prefix
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.core.config import get_settings
from app.core.database import get_supabase
from app.routes import admin, clips, health, jobs, projects, usage, videos
from app.workers.job_runner import get_job_runner

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rate limiter (shared instance imported by route modules)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown logic executed once per process lifetime."""
    settings = get_settings()

    # Create local storage directories if using local backend
    if settings.STORAGE_BACKEND == "local":
        for d in (
            settings.storage_videos_dir,
            settings.storage_clips_dir,
            settings.storage_thumbnails_dir,
            settings.storage_audio_dir,
        ):
            d.mkdir(parents=True, exist_ok=True)
            logger.info("Storage dir ready: %s", d)

    # Verify Supabase connectivity
    try:
        get_supabase()
        logger.info("Supabase client initialised successfully")
    except Exception as exc:
        logger.warning("Supabase init warning: %s", exc)

    # Start background job runner
    runner = get_job_runner()
    await runner.start()
    logger.info("Job runner started")

    yield  # ← application serves requests here

    # Shutdown
    await runner.stop()
    logger.info("Job runner stopped")
    logger.info("ClipForge API shutdown complete")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "ClipForge AI — backend API for AI-powered short-form video clip generation."
        ),
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # -------------------------------------------------------------------
    # Rate limiting
    # -------------------------------------------------------------------
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # -------------------------------------------------------------------
    # CORS
    # -------------------------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # -------------------------------------------------------------------
    # Request timing middleware
    # -------------------------------------------------------------------
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = time.perf_counter() - start
        response.headers["X-Process-Time"] = f"{elapsed:.4f}"
        return response

    # -------------------------------------------------------------------
    # Global exception handlers
    # -------------------------------------------------------------------
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": exc.errors(),
                "message": "Request validation failed",
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception("Unhandled exception for %s %s", request.method, request.url)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred."},
        )

    # -------------------------------------------------------------------
    # Routers
    # -------------------------------------------------------------------
    app.include_router(health.router, tags=["Health"])
    app.include_router(projects.router, prefix="/api", tags=["Projects"])
    app.include_router(videos.router, prefix="/api", tags=["Videos"])
    app.include_router(clips.router, prefix="/api", tags=["Clips"])
    app.include_router(jobs.router, prefix="/api", tags=["Jobs"])
    app.include_router(usage.router, prefix="/api", tags=["Usage"])
    app.include_router(admin.router, prefix="/api", tags=["Admin"])

    # -------------------------------------------------------------------
    # Static files (local storage)
    # -------------------------------------------------------------------
    from fastapi.staticfiles import StaticFiles

    settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")

    return app


app = create_app()


# ---------------------------------------------------------------------------
# Dev entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
