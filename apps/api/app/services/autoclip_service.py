"""
AutoClip Service Client & Orchestrator for ClipForge AI.
Connects the ClipForge API backend to the AutoClip internal service.
Handles:
  1. Creating clip generation jobs
  2. Polling progress through states: queued, downloading, transcribing, analyzing, cutting, done, failed
  3. Copying vertical 9:16 Shorts to ClipForge storage & persisting to DB
  4. Deducting credits only after job succeeds (exempting owner accounts)
"""
from __future__ import annotations

import asyncio
import logging
import os
import shutil
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings
from app.core.database import get_supabase
from app.services.usage_service import deduct_credits, refund_credit, reserve_credit

logger = logging.getLogger(__name__)

# In-memory store for tracking jobs and their synced clips across workers
_local_jobs: Dict[str, Dict[str, Any]] = {}

_owner_emails_env = os.getenv("OWNER_EMAILS", "ayushargulwar0@gmail.com,ayushargulwar77@gmail.com")
OWNER_EMAILS = {e.strip().lower() for e in _owner_emails_env.split(",") if e.strip()}


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_owner(user_id: str, email: str = "") -> bool:
    """Return True if user is the platform owner (unlimited credits)."""
    if user_id in ("owner-ayush", "admin"):
        return True
    clean_email = email.strip().lower()
    return clean_email in OWNER_EMAILS or any(owner in clean_email for owner in OWNER_EMAILS)


class AutoClipService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_url = self.settings.AUTOCLIP_SERVICE_URL.rstrip("/")
        self.internal_token = self.settings.AUTOCLIP_INTERNAL_TOKEN

    def _get_headers(self) -> Dict[str, str]:
        return {
            "X-Internal-Token": self.internal_token,
            "Content-Type": "application/json",
        }

    async def submit_job(
        self,
        youtube_url: str,
        user_id: str,
        user_email: str = "",
        max_clips: int = 5,
        min_sec: int = 20,
        max_sec: int = 60,
        burn_captions: bool = True,
    ) -> Dict[str, Any]:
        """
        Submit a new AutoClip job via the internal microservice or fallback in-process runner.
        """
        payload = {
            "youtube_url": youtube_url,
            "max_clips": max_clips,
            "min_sec": min_sec,
            "max_sec": max_sec,
            "burn_captions": burn_captions,
        }

        # Reserve 1 credit for non-owner accounts atomically; reject if balance is 0
        if not is_owner(user_id, user_email):
            await reserve_credit(user_id=user_id, cost=1, action="autoclip_reservation")

        # Try communicating with AutoClip microservice
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base_url}/jobs",
                    json=payload,
                    headers=self._get_headers(),
                )
                if resp.status_code in (200, 202):
                    data = resp.json()
                    job_id = data["id"]
                    _local_jobs[job_id] = {
                        "id": job_id,
                        "user_id": user_id,
                        "user_email": user_email,
                        "youtube_url": youtube_url,
                        "status": data.get("status", "queued"),
                        "progress": data.get("progress", 0),
                        "clips": [],
                        "created_at": _utcnow(),
                    }
                    # Start background polling in asyncio task
                    asyncio.create_task(
                        self.poll_and_finalize_job(job_id, user_id, user_email, youtube_url)
                    )
                    return data
        except Exception as exc:
            logger.info("AutoClip microservice unreachable at %s (%s). Using in-process runner.", self.base_url, exc)

        # Fallback: In-process execution if microservice is not running
        job_id = str(uuid.uuid4())
        _local_jobs[job_id] = {
            "id": job_id,
            "user_id": user_id,
            "user_email": user_email,
            "youtube_url": youtube_url,
            "status": "queued",
            "progress": 0,
            "clips": [],
            "created_at": _utcnow(),
        }

        # Launch in background thread using local autoclip package
        asyncio.create_task(
            self._run_in_process_job(job_id, youtube_url, user_id, user_email, max_clips, min_sec, max_sec, burn_captions)
        )
        return {"id": job_id, "status": "queued", "progress": 0}

    async def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Check status and progress of a job."""
        # Check local cache first
        local_rec = _local_jobs.get(job_id)

        # Try querying microservice
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self.base_url}/jobs/{job_id}",
                    headers=self._get_headers(),
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if local_rec:
                        local_rec["status"] = data.get("status", local_rec["status"])
                        local_rec["progress"] = data.get("progress", local_rec["progress"])
                        if "error" in data:
                            local_rec["error"] = data["error"]
                        data["clips"] = local_rec.get("clips", [])
                    return data
        except Exception:
            pass

        if local_rec:
            return local_rec

        # Fallback to Supabase / DB job table
        client = get_supabase()
        try:
            db_resp = client.table("jobs").select("*").eq("id", job_id).single().execute()
            if db_resp.data:
                return db_resp.data
        except Exception:
            pass

        return {"id": job_id, "status": "failed", "progress": 0, "error": "Job not found"}

    async def get_job_clips(self, job_id: str) -> List[Dict[str, Any]]:
        """Retrieve finished clips for a job."""
        if job_id in _local_jobs and _local_jobs[job_id].get("clips"):
            return _local_jobs[job_id]["clips"]

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self.base_url}/jobs/{job_id}/clips",
                    headers=self._get_headers(),
                )
                if resp.status_code == 200:
                    return resp.json()
        except Exception:
            pass

        return []

    async def poll_and_finalize_job(
        self,
        job_id: str,
        user_id: str,
        user_email: str,
        youtube_url: str,
        max_wait_seconds: int = 600,
    ) -> None:
        """Polls microservice until job is completed, then persists clips and deducts credits."""
        start_time = asyncio.get_event_loop().time()
        while (asyncio.get_event_loop().time() - start_time) < max_wait_seconds:
            await asyncio.sleep(2.0)
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(
                        f"{self.base_url}/jobs/{job_id}",
                        headers=self._get_headers(),
                    )
                    if resp.status_code != 200:
                        continue
                    data = resp.json()
                    status = data.get("status")
                    progress = data.get("progress", 0)

                    if job_id in _local_jobs:
                        _local_jobs[job_id]["status"] = status
                        _local_jobs[job_id]["progress"] = progress

                    if status == "done":
                        # Fetch clips
                        clips_resp = await client.get(
                            f"{self.base_url}/jobs/{job_id}/clips",
                            headers=self._get_headers(),
                        )
                        raw_clips = clips_resp.json() if clips_resp.status_code == 200 else []
                        await self._persist_and_charge(job_id, user_id, user_email, youtube_url, raw_clips)
                        return
                    elif status == "failed":
                        logger.error("AutoClip job %s failed: %s", job_id, data.get("error"))
                        if not is_owner(user_id, user_email):
                            await refund_credit(user_id=user_id, amount=1, reason="autoclip_job_failed")
                        return
            except Exception as exc:
                logger.warning("Polling error for job %s: %s", job_id, exc)

    async def _run_in_process_job(
        self,
        job_id: str,
        youtube_url: str,
        user_id: str,
        user_email: str,
        max_clips: int,
        min_sec: int,
        max_sec: int,
        burn_captions: bool,
    ) -> None:
        """Run AutoClip pipeline in-process when microservice container is not spun up."""
        try:
            # Ensure autoclip repo is in python path
            autoclip_root = Path(__file__).resolve().parent.parent.parent.parent.parent / "services" / "autoclip"
            if str(autoclip_root) not in sys.path:
                sys.path.insert(0, str(autoclip_root))

            from backend.api import internal_jobs

            with internal_jobs._jobs_lock:
                internal_jobs._jobs_db[job_id] = {
                    "id": job_id,
                    "youtube_url": youtube_url,
                    "max_clips": max_clips,
                    "min_sec": min_sec,
                    "max_sec": max_sec,
                    "burn_captions": burn_captions,
                    "status": "queued",
                    "progress": 0,
                    "clips": [],
                    "error": None,
                }

            # Run in worker thread
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                internal_jobs._run_autoclip_job,
                job_id,
                youtube_url,
                max_clips,
                min_sec,
                max_sec,
                burn_captions,
            )

            # Check status
            job_data = internal_jobs._jobs_db.get(job_id, {})
            if job_data.get("status") == "done":
                raw_clips = job_data.get("clips", [])
                await self._persist_and_charge(job_id, user_id, user_email, youtube_url, raw_clips)
            else:
                if job_id in _local_jobs:
                    _local_jobs[job_id]["status"] = "failed"
                    _local_jobs[job_id]["error"] = job_data.get("error") or "Processing failed"
                if not is_owner(user_id, user_email):
                    await refund_credit(user_id=user_id, amount=1, reason="autoclip_job_failed")
        except Exception as exc:
            logger.exception("In-process AutoClip job %s failed: %s", job_id, exc)
            if job_id in _local_jobs:
                _local_jobs[job_id]["status"] = "failed"
                _local_jobs[job_id]["error"] = str(exc)
            if not is_owner(user_id, user_email):
                await refund_credit(user_id=user_id, amount=1, reason="autoclip_job_failed")

    async def _persist_and_charge(
        self,
        job_id: str,
        user_id: str,
        user_email: str,
        youtube_url: str,
        raw_clips: List[Dict[str, Any]],
    ) -> None:
        """Persist generated 9:16 vertical clips to storage/DB and deduct credits (exempting owner)."""
        settings = self.settings
        client = get_supabase()
        now = _utcnow()

        target_storage_dir = settings.storage_clips_dir
        target_storage_dir.mkdir(parents=True, exist_ok=True)

        persisted_clips: List[Dict[str, Any]] = []

        for idx, rc in enumerate(raw_clips):
            clip_id = str(uuid.uuid4())
            # Prioritize 9:16 vertical short
            source_file = Path(rc.get("shorts_path") or rc.get("file_path", ""))

            stored_filename = f"autoclip_{clip_id[:8]}_shorts.mp4"
            dest_file = target_storage_dir / stored_filename

            if source_file.exists():
                try:
                    shutil.copy2(source_file, dest_file)
                except Exception as exc:
                    logger.warning("Could not copy clip file: %s, using source directly", exc)
                    dest_file = source_file
            
            web_url = f"/storage/clips/{dest_file.name}"
            title = rc.get("title") or f"Short Highlight #{idx + 1}"
            description = rc.get("description") or f"{title} #Shorts"
            if "#Shorts" not in description:
                description = f"{description} #Shorts"

            clip_record = {
                "id": clip_id,
                "video_id": f"autoclip-src-{job_id[:8]}",
                "owner_id": user_id,
                "title": title[:70],
                "description": description,
                "hook": rc.get("hook_text") or "",
                "transcript_text": rc.get("transcript") or "",
                "start_time": rc.get("start", 0.0),
                "end_time": rc.get("end", 0.0),
                "duration": rc.get("duration", 0.0),
                "aspect_ratio": "9:16",
                "status": "rendered",
                "score": rc.get("score", 90),
                "source_url": web_url,
                "video_url": web_url,
                "rendered_path": str(dest_file.resolve()),
                "created_at": now,
                "updated_at": now,
            }

            try:
                client.table("clips").insert(clip_record).execute()
            except Exception as exc:
                logger.warning("Failed to insert clip %s into database: %s", clip_id, exc)

            persisted_clips.append(clip_record)

        # Update local jobs cache
        if job_id in _local_jobs:
            _local_jobs[job_id]["status"] = "done"
            _local_jobs[job_id]["progress"] = 100
            _local_jobs[job_id]["clips"] = persisted_clips

        # Update DB jobs table if exists
        try:
            client.table("jobs").update({
                "status": "completed",
                "progress": 100,
                "result": {"clips": persisted_clips},
                "updated_at": now,
                "completed_at": now,
            }).eq("id", job_id).execute()
        except Exception:
            pass

        # Credits: reserved upfront, confirmed upon success; owner accounts stay unlimited
        if is_owner(user_id, user_email):
            logger.info("Platform owner account (%s / %s): Unlimited credits active. 0 credits deducted.", user_id, user_email)
        else:
            logger.info("AutoClip job %s succeeded. Reserved credit finalized for user %s.", job_id, user_id)


_instance: Optional[AutoClipService] = None


def get_autoclip_service() -> AutoClipService:
    global _instance
    if _instance is None:
        _instance = AutoClipService()
    return _instance
