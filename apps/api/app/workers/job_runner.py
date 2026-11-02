"""
Background job runner for ClipForge AI.

Coordinates asynchronous background tasks:
- Transcription via faster-whisper
- AI clip detection via NLP scoring
- Video rendering and subtitle burn-in via FFmpeg
"""

from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import logging
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.core.database import get_supabase
from app.models.enums import ClipStatus, JobStatus, JobType, VideoStatus
from app.ai.transcription import TranscriptionEngine
from app.ai.clip_detector import ClipDetector
from app.video.processor import VideoProcessor

logger = logging.getLogger(__name__)


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class JobRunner:
    def __init__(self, max_workers: int = 2) -> None:
        self.queue: asyncio.Queue[str] = asyncio.Queue()
        self.executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="cf-worker")
        self._task: asyncio.Task | None = None
        self._running = False
        self.processor = VideoProcessor()
        self.clip_detector = ClipDetector()

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._worker_loop())
        logger.info("Background JobRunner started")

    async def stop(self) -> None:
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self.executor.shutdown(wait=False)
        logger.info("Background JobRunner stopped")

    async def enqueue(self, job_id: str) -> None:
        await self.queue.put(job_id)
        logger.info("Enqueued job: %s (queue size: %d)", job_id, self.queue.qsize())

    async def _worker_loop(self) -> None:
        while self._running:
            try:
                job_id = await asyncio.wait_for(self.queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break

            try:
                await self._process_job(job_id)
            except Exception as exc:
                logger.exception("Unexpected error processing job %s: %s", job_id, exc)
            finally:
                self.queue.task_done()

    def _update_job(self, job_id: str, updates: dict[str, Any]) -> None:
        client = get_supabase()
        updates["updated_at"] = _utcnow()
        try:
            client.table("jobs").update(updates).eq("id", job_id).execute()
        except Exception as exc:
            logger.warning("Failed to update job %s in db: %s", job_id, exc)

    async def _process_job(self, job_id: str) -> None:
        client = get_supabase()
        try:
            resp = client.table("jobs").select("*").eq("id", job_id).single().execute()
            job = resp.data
        except Exception as exc:
            logger.error("Could not fetch job %s from db: %s", job_id, exc)
            return

        if not job:
            logger.error("Job %s not found in database", job_id)
            return

        job_type = job.get("job_type")
        logger.info("Starting processing for job %s (type=%s)", job_id, job_type)

        self._update_job(job_id, {"status": JobStatus.processing.value, "progress": 10})

        loop = asyncio.get_running_loop()

        try:
            if job_type == JobType.transcription.value:
                result = await loop.run_in_executor(
                    self.executor, self._run_transcription, job
                )
            elif job_type == JobType.clip_detection.value:
                result = await loop.run_in_executor(
                    self.executor, self._run_clip_detection, job
                )
            elif job_type == JobType.render.value:
                result = await loop.run_in_executor(
                    self.executor, self._run_render, job
                )
            else:
                raise ValueError(f"Unknown job type: {job_type}")

            self._update_job(
                job_id,
                {
                    "status": JobStatus.completed.value,
                    "progress": 100,
                    "result": result,
                },
            )
            logger.info("Job %s completed successfully", job_id)

        except Exception as exc:
            logger.exception("Job %s failed: %s", job_id, exc)
            self._update_job(
                job_id,
                {
                    "status": JobStatus.failed.value,
                    "error": str(exc),
                },
            )

    def _run_transcription(self, job: dict[str, Any]) -> dict[str, Any]:
        settings = get_settings()
        client = get_supabase()
        video_id = job.get("video_id")
        user_id = job.get("owner_id")

        vid_resp = client.table("video_assets").select("*").eq("id", video_id).single().execute()
        video = vid_resp.data
        if not video:
            raise FileNotFoundError(f"Video {video_id} not found")

        storage_path = video.get("storage_path")
        video_file_path = Path(storage_path)
        if not video_file_path.exists():
            # If relative, resolve against storage
            video_file_path = settings.storage_videos_dir / video.get("filename", "")
        if not video_file_path.exists():
            raise FileNotFoundError(f"Video file {video_file_path} does not exist on disk")

        audio_output = settings.storage_audio_dir / f"{video_id}.wav"
        audio_output.parent.mkdir(parents=True, exist_ok=True)

        logger.info("Extracting audio from %s to %s", video_file_path, audio_output)
        self.processor.extract_audio(str(video_file_path), str(audio_output))

        lang = job.get("result", {}).get("language")
        engine = TranscriptionEngine(model_size=settings.WHISPER_MODEL_SIZE)
        transcription_res = engine.transcribe(str(audio_output), language=lang)

        # Build full text
        full_text = " ".join(s["text"] for s in transcription_res.get("segments", [])).strip()

        # Save to transcripts table
        transcript_record = {
            "video_id": video_id,
            "language": transcription_res.get("language", "en"),
            "content": transcription_res,
            "full_text": full_text,
            "word_count": len(full_text.split()),
            "created_at": _utcnow(),
            "updated_at": _utcnow(),
        }

        try:
            client.table("transcripts").upsert(transcript_record, on_conflict="video_id").execute()
        except Exception as exc:
            logger.warning("Upsert transcript error: %s", exc)

        # Update video status
        client.table("video_assets").update({
            "status": VideoStatus.ready.value,
            "updated_at": _utcnow(),
        }).eq("id", video_id).execute()

        return {
            "segments_count": len(transcription_res.get("segments", [])),
            "language": transcription_res.get("language"),
            "duration": transcription_res.get("duration"),
        }

    def _run_clip_detection(self, job: dict[str, Any]) -> dict[str, Any]:
        client = get_supabase()
        video_id = job.get("video_id")
        user_id = job.get("owner_id")
        config = job.get("result", {})

        min_dur = config.get("min_duration", 15)
        max_dur = config.get("max_duration", 60)
        max_clips = config.get("max_clips", 10)

        t_resp = client.table("transcripts").select("*").eq("video_id", video_id).single().execute()
        transcript_row = t_resp.data
        if not transcript_row:
            raise ValueError(f"No transcription found for video {video_id}. Transcribe the video first.")

        transcript_data = transcript_row.get("content", {})
        candidates = self.clip_detector.detect_clips(
            transcript_data,
            min_duration=min_dur,
            max_duration=max_dur,
            max_clips=max_clips,
        )

        created_clips = []
        for cand in candidates:
            clip_record = {
                "video_id": video_id,
                "owner_id": user_id,
                "title": cand["title"],
                "description": cand["description"],
                "hook": cand.get("hook", ""),
                "transcript_text": cand.get("transcript_text", ""),
                "start_time": cand["start"],
                "end_time": cand["end"],
                "duration": cand["duration"],
                "aspect_ratio": "9:16",
                "status": ClipStatus.detected.value,
                "score": cand["score"],
                "created_at": _utcnow(),
                "updated_at": _utcnow(),
            }
            try:
                res = client.table("clips").insert(clip_record).execute()
                if res.data:
                    created_clips.append(res.data[0])
            except Exception as exc:
                logger.warning("Failed to insert clip: %s", exc)

        return {
            "clips_detected": len(created_clips),
            "candidates_evaluated": len(candidates),
        }

    def _run_render(self, job: dict[str, Any]) -> dict[str, Any]:
        settings = get_settings()
        client = get_supabase()
        clip_id = job.get("clip_id")

        clip_resp = client.table("clips").select("*").eq("id", clip_id).single().execute()
        clip = clip_resp.data
        if not clip:
            raise FileNotFoundError(f"Clip {clip_id} not found")

        video_id = clip.get("video_id")
        vid_resp = client.table("video_assets").select("*").eq("id", video_id).single().execute()
        video = vid_resp.data
        if not video:
            raise FileNotFoundError(f"Source video {video_id} not found")

        video_file_path = Path(video.get("storage_path", ""))
        if not video_file_path.exists():
            video_file_path = settings.storage_videos_dir / video.get("filename", "")
        if not video_file_path.exists():
            raise FileNotFoundError(f"Source video file {video_file_path} not found on disk")

        output_filename = f"{clip_id}_9x16.mp4"
        output_file_path = settings.storage_clips_dir / output_filename
        thumbnail_output = settings.storage_thumbnails_dir / f"{clip_id}.jpg"

        start_time = float(clip["start_time"])
        end_time = float(clip["end_time"])
        aspect_ratio = clip.get("aspect_ratio", "9:16")

        logger.info(
            "Rendering clip %s: start=%.2f, end=%.2f, ratio=%s",
            clip_id, start_time, end_time, aspect_ratio
        )

        self.processor.trim_and_encode(
            input_path=str(video_file_path),
            output_path=str(output_file_path),
            start=start_time,
            end=end_time,
            aspect_ratio=aspect_ratio,
        )

        try:
            self.processor.generate_thumbnail(
                video_path=str(output_file_path),
                output_path=str(thumbnail_output),
                time_offset=0.5,
            )
        except Exception as exc:
            logger.warning("Failed to generate clip thumbnail: %s", exc)

        # Update clip record
        client.table("clips").update({
            "status": ClipStatus.rendered.value,
            "output_path": str(output_file_path),
            "thumbnail_path": str(thumbnail_output),
            "updated_at": _utcnow(),
        }).eq("id", clip_id).execute()

        return {
            "output_path": str(output_file_path),
            "thumbnail_path": str(thumbnail_output),
            "duration": end_time - start_time,
        }


# Global singleton instance
_runner_instance: JobRunner | None = None


def get_job_runner() -> JobRunner:
    global _runner_instance
    if _runner_instance is None:
        _runner_instance = JobRunner()
    return _runner_instance
