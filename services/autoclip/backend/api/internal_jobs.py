"""
Internal Jobs API for AutoClip.
Thin wrapper over AutoClip pipeline for ClipForge AI integration.
Endpoints:
  POST /jobs             -> Submit a YouTube video for clip generation
  GET  /jobs/{id}        -> Check job status and progress
  GET  /jobs/{id}/clips  -> Retrieve generated clips (horizontal + 9:16 vertical Shorts)
Security:
  Requires header: X-Internal-Token == AUTOCLIP_INTERNAL_TOKEN
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import subprocess
import threading
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from backend.pipeline.shorts_render import (
    render_vertical_short,
    snap_to_sentence_boundaries,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["internal_jobs"])

# Configuration
DEFAULT_TOKEN = "clipforge-internal-secret-2026"
AUTOCLIP_INTERNAL_TOKEN = os.getenv("AUTOCLIP_INTERNAL_TOKEN", DEFAULT_TOKEN)

# Shared clips output directory (volume mounted between autoclip and clipforge)
SHARED_DIR_ENV = os.getenv("SHARED_CLIPS_DIR")
if SHARED_DIR_ENV:
    SHARED_CLIPS_DIR = Path(SHARED_DIR_ENV)
else:
    # Check if running in container with /data/clips, else local fallback
    if Path("/data/clips").exists() or os.name != "nt":
        SHARED_CLIPS_DIR = Path("/data/clips")
    else:
        SHARED_CLIPS_DIR = Path(__file__).parent.parent.parent / "data" / "clips"

SHARED_CLIPS_DIR.mkdir(parents=True, exist_ok=True)

# In-memory / persistent job registry
_jobs_lock = threading.Lock()
_jobs_db: Dict[str, Dict[str, Any]] = {}


def verify_internal_token(x_internal_token: Optional[str] = Header(None)) -> str:
    expected = os.getenv("AUTOCLIP_INTERNAL_TOKEN", AUTOCLIP_INTERNAL_TOKEN)
    if not x_internal_token or x_internal_token != expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing X-Internal-Token header",
        )
    return x_internal_token


# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------


class JobCreateRequest(BaseModel):
    youtube_url: str = Field(..., description="Target YouTube video URL")
    max_clips: int = Field(default=5, ge=1, le=20)
    min_sec: int = Field(default=20, ge=10, le=180)
    max_sec: int = Field(default=60, ge=15, le=180)
    burn_captions: bool = Field(default=True, description="Burn in animated word-highlight subtitles")


class JobStatusResponse(BaseModel):
    id: str
    status: str  # queued | downloading | transcribing | analyzing | cutting | done | failed
    progress: int  # 0 to 100
    error: Optional[str] = None


class ClipItemResponse(BaseModel):
    file_path: str
    shorts_path: Optional[str] = None
    caption_path: Optional[str] = None
    hook_text: Optional[str] = None
    title: str
    description: Optional[str] = None
    hashtags: List[str] = Field(default_factory=list)
    score: float
    start: float
    end: float
    duration: float
    transcript: str = ""


# ---------------------------------------------------------------------------
# Helpers: Time Parsing & Subtitle Parsing
# ---------------------------------------------------------------------------


def parse_timestamp(val: Any) -> float:
    """Parse float seconds or SRT/VTT formatted timestamp strings."""
    if isinstance(val, (int, float)):
        return max(0.0, float(val))
    if isinstance(val, str):
        val = val.strip().replace(",", ".")
        parts = val.split(":")
        try:
            if len(parts) == 3:
                return max(0.0, float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2]))
            elif len(parts) == 2:
                return max(0.0, float(parts[0]) * 60 + float(parts[1]))
            return max(0.0, float(val))
        except (ValueError, TypeError):
            return 0.0
    return 0.0


def parse_srt_entries(srt_text: str) -> List[Dict[str, Any]]:
    """Parse SRT cues into start, end, text, and pseudo word timestamps."""
    entries = []
    blocks = re.split(r"\n\s*\n", srt_text.strip())

    for block in blocks:
        lines = [line.strip() for line in block.split("\n") if line.strip()]
        if len(lines) >= 2:
            # Check for timestamp line
            ts_line = lines[1] if "-->" in lines[1] else (lines[0] if "-->" in lines[0] else None)
            if not ts_line:
                continue

            parts = ts_line.split("-->")
            if len(parts) == 2:
                start_sec = parse_timestamp(parts[0].strip())
                end_sec = parse_timestamp(parts[1].strip().split()[0])
                text_lines = lines[2:] if "-->" in lines[1] else lines[1:]
                text = " ".join(text_lines).strip()
                # Clean html tags
                text = re.sub(r"<[^>]+>", "", text).strip()
                if text:
                    entries.append({"start": start_sec, "end": end_sec, "text": text})
    return entries


def build_word_timestamps(entries: List[Dict[str, Any]], clip_start: float, clip_end: float) -> List[Dict[str, Any]]:
    """Extract and estimate word-level timestamps within [clip_start, clip_end]."""
    words = []
    for cue in entries:
        c_start = cue["start"]
        c_end = cue["end"]
        if c_end < clip_start or c_start > clip_end:
            continue

        cue_words = cue["text"].split()
        if not cue_words:
            continue

        dur_per_word = max(0.1, (c_end - c_start) / len(cue_words))
        for i, w in enumerate(cue_words):
            w_start = c_start + (i * dur_per_word)
            w_end = w_start + dur_per_word
            if w_end >= clip_start and w_start <= clip_end:
                words.append({"word": w, "start": w_start, "end": w_end})
    return words


# ---------------------------------------------------------------------------
# Background Processing Worker
# ---------------------------------------------------------------------------


def _update_job(job_id: str, **kwargs):
    with _jobs_lock:
        if job_id in _jobs_db:
            _jobs_db[job_id].update(kwargs)
            _jobs_db[job_id]["updated_at"] = time.time()
            job_dir = SHARED_CLIPS_DIR / job_id
            try:
                job_dir.mkdir(parents=True, exist_ok=True)
                with open(job_dir / "job.json", "w", encoding="utf-8") as f:
                    json.dump(_jobs_db[job_id], f, indent=2)
            except Exception as e:
                logger.debug("Failed saving job json: %s", e)


SHORTS_SCORING_SYSTEM_PROMPT = """You are an expert viral YouTube Shorts and TikTok editor.
Identify the most viral, standalone vertical video moments from the transcript.

Rules for Shorts:
1. Strong Hook: First 3 seconds must grab curiosity, ask an intriguing question, or make a bold claim.
2. Complete Thought: Must deliver one complete idea or story with a clear, satisfying punchline/payoff.
3. High Insight & Emotion: Prioritize surprising facts, strong opinions, actionable advice, or intense emotion.
4. Clean Starts: Strictly REJECT clips that start with 'so', 'um', 'like', 'and', 'well', 'you know', or dependent phrases needing earlier context.
5. Duration: Each clip MUST be strictly between 20 and 60 seconds (never over 60s).
6. Non-overlapping: No two selected clips may overlap in time.

Return ONLY a valid JSON array of objects sorted by score descending:
[
  {
    "start": 12.5,
    "end": 45.0,
    "score": 0.95,
    "hook_text": "The first 3 seconds hook statement",
    "title": "Short title under 70 chars with impact",
    "description": "Engaging description including #Shorts #viral",
    "hashtags": ["#Shorts", "#viral", "#insights"]
  }
]
"""


def _run_autoclip_job(
    job_id: str,
    youtube_url: str,
    max_clips: int,
    min_sec: int,
    max_sec: int,
    burn_captions: bool = True,
):
    job_dir = SHARED_CLIPS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Step 1: Downloading video via yt-dlp
        _update_job(job_id, status="downloading", progress=15)
        logger.info("[%s] Downloading %s...", job_id, youtube_url)

        source_video = job_dir / "source.mp4"
        import yt_dlp

        ydl_opts = {
            "format": "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "outtmpl": str(source_video),
            "quiet": True,
            "no_warnings": True,
            "overwrites": True,
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitleslangs": ["en", "en-US", "hi", "zh-Hans", "zh"],
        }

        video_title = "Highlight Clip"
        video_duration = 180.0
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=True)
            video_title = info.get("title", "Highlight Clip")
            video_duration = float(info.get("duration", 180.0))

        # Step 2: Transcribe / Read subtitles
        _update_job(job_id, status="transcribing", progress=40)
        logger.info("[%s] Processing transcript for '%s'...", job_id, video_title)

        srt_content = ""
        srt_files = list(job_dir.glob("*.srt")) or list(job_dir.glob("*.vtt"))
        if srt_files:
            try:
                srt_content = srt_files[0].read_text(encoding="utf-8", errors="replace")
            except Exception as e:
                logger.warning("Could not read subtitle file: %s", e)

        srt_entries = parse_srt_entries(srt_content) if srt_content else []
        chapters = info.get("chapters") or []

        # Step 3: Analyze and select clips via tuned Shorts highlight prompt
        _update_job(job_id, status="analyzing", progress=65)
        logger.info("[%s] Analyzing highlights with Shorts prompt...", job_id)

        from backend.core.llm_adapter import get_llm_adapter
        adapter = get_llm_adapter()

        candidates: List[Dict[str, Any]] = []

        if srt_content:
            prompt = (
                f"Identify top viral YouTube Shorts from this video transcript (video title: '{video_title}').\n"
                f"Target duration: {min_sec} to {max_sec} seconds (max 60s).\n\n"
                f"Transcript:\n{srt_content[:20000]}"
            )
            try:
                raw_cands = adapter.call_json(prompt, system_prompt=SHORTS_SCORING_SYSTEM_PROMPT)
                if isinstance(raw_cands, list):
                    candidates = raw_cands
            except Exception as llm_err:
                logger.warning("[%s] LLM scoring fallback: %s", job_id, llm_err)

        # Fallback to chapters or structured highlights if LLM is unavailable
        if not candidates:
            if chapters:
                for idx, ch in enumerate(chapters[:max_clips]):
                    ch_start = float(ch.get("start_time", 0))
                    ch_end = float(ch.get("end_time", ch_start + 45))
                    c_dur = min(float(max_sec), max(float(min_sec), ch_end - ch_start))
                    ch_title = ch.get("title", f"Part {idx+1}")
                    candidates.append({
                        "title": f"{video_title[:45]} — {ch_title[:20]}",
                        "start": ch_start,
                        "end": min(video_duration, ch_start + c_dur),
                        "score": 0.92 - (idx * 0.05),
                        "hook_text": f"The biggest breakthrough on {ch_title} starts here",
                        "description": f"Key moments on {ch_title} extracted with ClipForge AI. #Shorts #viral",
                        "hashtags": ["#Shorts", "#viral", "#highlights"],
                    })
            else:
                step_interval = max(min_sec + 5, int(video_duration / (max_clips + 1)))
                for idx in range(max_clips):
                    c_start = float(idx * step_interval + 5)
                    if c_start + min_sec > video_duration:
                        break
                    c_end = min(video_duration, c_start + min_sec + 15)
                    candidates.append({
                        "title": f"{video_title[:55]} #{idx+1}",
                        "start": c_start,
                        "end": c_end,
                        "score": 0.88 - (idx * 0.04),
                        "hook_text": "Watch until the end for the key takeaway",
                        "description": f"{video_title} #Shorts #viral",
                        "hashtags": ["#Shorts", "#viral"],
                    })

        # Step 4: Validate, clean, sort, and snap candidates
        candidates.sort(key=lambda c: float(c.get("score", 0)), reverse=True)

        valid_picks: List[Dict[str, Any]] = []
        selected_intervals: List[Tuple[float, float]] = []

        # Filler words to reject from starting
        filler_prefixes = ("so ", "um ", "like ", "and ", "well ", "you know ")

        for cand in candidates:
            raw_start = parse_timestamp(cand.get("start", 0))
            raw_end = parse_timestamp(cand.get("end", raw_start + min_sec))

            # Snap to sentence boundaries
            if srt_entries:
                snapped_start, snapped_end, transcript_snippet = snap_to_sentence_boundaries(
                    raw_start, raw_end, srt_entries, min_dur=float(min_sec), max_dur=float(max_sec)
                )
            else:
                snapped_start = raw_start
                dur = min(float(max_sec), max(float(min_sec), raw_end - raw_start))
                snapped_end = snapped_start + dur
                transcript_snippet = cand.get("transcript", "")

            # Hard cap duration <= 60 seconds
            dur = snapped_end - snapped_start
            if dur > 60.0:
                snapped_end = snapped_start + 60.0
                dur = 60.0

            # Reject filler start
            hook = cand.get("hook_text") or transcript_snippet[:60]
            if hook.lower().startswith(filler_prefixes):
                logger.info("[%s] Rejecting clip starting with filler: '%s'", job_id, hook[:30])
                continue

            # Ensure non-overlapping intervals
            overlap = False
            for s_start, s_end in selected_intervals:
                if not (snapped_end <= s_start or snapped_start >= s_end):
                    overlap = True
                    break

            if overlap:
                continue

            selected_intervals.append((snapped_start, snapped_end))
            title = cand.get("title", f"Viral Moment #{len(valid_picks)+1}")
            if len(title) > 70:
                title = title[:67] + "..."

            desc = cand.get("description", "")
            if "#Shorts" not in desc:
                desc = (desc.strip() + " #Shorts").strip()

            valid_picks.append({
                "start": snapped_start,
                "end": snapped_end,
                "duration": dur,
                "title": title,
                "description": desc,
                "hook_text": hook,
                "hashtags": cand.get("hashtags") or ["#Shorts", "#viral"],
                "score": float(cand.get("score", 0.85)),
                "transcript": transcript_snippet or cand.get("transcript", ""),
            })

            if len(valid_picks) >= max_clips:
                break

        # Step 5: Cutting clips with FFmpeg & Vertical Conversion (1080x1920)
        _update_job(job_id, status="cutting", progress=85)
        logger.info("[%s] Rendering %d vertical shorts with smart crop & captions...", job_id, len(valid_picks))

        output_clips: List[Dict[str, Any]] = []

        for idx, pick in enumerate(valid_picks):
            # 1. Horizontal cut
            h_filename = f"clip_{idx+1}_horizontal.mp4"
            h_path = job_dir / h_filename
            start_t = pick["start"]
            dur_t = pick["duration"]

            cmd_h = [
                "ffmpeg", "-y",
                "-ss", f"{start_t:.2f}",
                "-i", str(source_video),
                "-t", f"{dur_t:.2f}",
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "22",
                "-c:a", "aac",
                "-b:a", "128k",
                "-movflags", "+faststart",
                str(h_path)
            ]
            subprocess.run(cmd_h, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

            # 2. Extract word-level cues for animated captions
            words = build_word_timestamps(srt_entries, start_t, start_t + dur_t) if srt_entries else []
            if not words and pick["transcript"]:
                # Generate pseudo words from transcript snippet
                words_list = pick["transcript"].split()
                if words_list:
                    w_dur = dur_t / len(words_list)
                    for w_i, w_txt in enumerate(words_list):
                        words.append({
                            "word": w_txt,
                            "start": start_t + (w_i * w_dur),
                            "end": start_t + ((w_i + 1) * w_dur),
                        })

            # 3. 9:16 Vertical Shorts Render with smart crop and burned captions
            shorts_filename = f"clip_{idx+1}_9x16.mp4"
            shorts_path = job_dir / shorts_filename

            render_res = render_vertical_short(
                source_video=str(source_video),
                output_shorts_path=str(shorts_path),
                start_sec=start_t,
                duration=dur_t,
                words_data=words if burn_captions else None,
                burn_captions=burn_captions,
            )

            output_clips.append({
                "file_path": str(h_path.resolve()),
                "shorts_path": str(shorts_path.resolve()),
                "caption_path": render_res.get("caption_path"),
                "hook_text": pick["hook_text"],
                "title": pick["title"],
                "description": pick["description"],
                "hashtags": pick["hashtags"],
                "score": pick["score"],
                "start": start_t,
                "end": pick["end"],
                "duration": dur_t,
                "transcript": pick["transcript"],
            })

        # Step 6: Mark done
        _update_job(job_id, status="done", progress=100, clips=output_clips)
        logger.info("[%s] AutoClip Phase 3 job finished: %d 9:16 shorts ready!", job_id, len(output_clips))

    except Exception as exc:
        logger.exception("[%s] AutoClip Phase 3 job failed: %s", job_id, exc)
        _update_job(job_id, status="failed", progress=100, error=str(exc))


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------


@router.post(
    "/jobs",
    response_model=JobStatusResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create vertical shorts clip generation job from YouTube URL",
)
async def create_job(
    req: JobCreateRequest,
    _token: str = Depends(verify_internal_token),
) -> JobStatusResponse:
    job_id = f"job-{uuid.uuid4().hex[:12]}"
    job_data = {
        "id": job_id,
        "youtube_url": req.youtube_url,
        "status": "queued",
        "progress": 0,
        "error": None,
        "clips": [],
        "created_at": time.time(),
        "updated_at": time.time(),
    }
    with _jobs_lock:
        _jobs_db[job_id] = job_data

    t = threading.Thread(
        target=_run_autoclip_job,
        args=(job_id, req.youtube_url, req.max_clips, req.min_sec, req.max_sec, req.burn_captions),
        daemon=True,
    )
    t.start()

    return JobStatusResponse(id=job_id, status="queued", progress=0, error=None)


@router.get(
    "/jobs/{job_id}",
    response_model=JobStatusResponse,
    summary="Get status and progress of clip generation job",
)
async def get_job_status(
    job_id: str,
    _token: str = Depends(verify_internal_token),
) -> JobStatusResponse:
    with _jobs_lock:
        job = _jobs_db.get(job_id)

    if not job:
        job_file = SHARED_CLIPS_DIR / job_id / "job.json"
        if job_file.exists():
            try:
                job = json.loads(job_file.read_text(encoding="utf-8"))
            except Exception:
                pass

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job '{job_id}' not found")

    return JobStatusResponse(
        id=job["id"],
        status=job["status"],
        progress=job["progress"],
        error=job.get("error"),
    )


@router.get(
    "/jobs/{job_id}/clips",
    response_model=List[ClipItemResponse],
    summary="Get generated clips for job with 9:16 vertical shorts path",
)
async def get_job_clips(
    job_id: str,
    _token: str = Depends(verify_internal_token),
) -> List[ClipItemResponse]:
    with _jobs_lock:
        job = _jobs_db.get(job_id)

    if not job:
        job_file = SHARED_CLIPS_DIR / job_id / "job.json"
        if job_file.exists():
            try:
                job = json.loads(job_file.read_text(encoding="utf-8"))
            except Exception:
                pass

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job '{job_id}' not found")

    if job["status"] == "failed":
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=job.get("error") or "Job failed")

    clips_data = job.get("clips") or []
    return [ClipItemResponse(**c) for c in clips_data]
