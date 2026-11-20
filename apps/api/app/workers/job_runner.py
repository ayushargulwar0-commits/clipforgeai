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
import json
import subprocess
from app.video.processor import VideoProcessor

logger = logging.getLogger(__name__)

# In-memory store for tracking export jobs across local and remote environments
_export_jobs: dict[str, dict[str, Any]] = {}


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
        updates["updated_at"] = _utcnow()
        if job_id in _export_jobs:
            _export_jobs[job_id].update(updates)
        client = get_supabase()
        try:
            client.table("jobs").update(updates).eq("id", job_id).execute()
        except Exception as exc:
            pass

    async def _process_job(self, job_id: str) -> None:
        job = None
        client = get_supabase()
        try:
            resp = client.table("jobs").select("*").eq("id", job_id).single().execute()
            job = resp.data
        except Exception:
            pass

        if not job and job_id in _export_jobs:
            job = _export_jobs[job_id]

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
            elif job_type in ("export", JobType.export.value):
                result = await loop.run_in_executor(
                    self.executor, self._run_export, job
                )
            else:
                raise ValueError(f"Unknown job type: {job_type}")

            self._update_job(
                job_id,
                {
                    "status": JobStatus.completed.value,
                    "progress": 100,
                    "result": result,
                    "download_url": result.get("download_url") if isinstance(result, dict) else None,
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

    def _run_export(self, job: dict[str, Any]) -> dict[str, Any]:
        """
        One-pass FFmpeg export from saved edit settings:
        trim (in/out) -> crop / split screen / blur-fit to 1080x1920 ->
        burn captions with captions_to_ass() (fontsdir=/app/fonts, so Hindi works) ->
        output H.264 + AAC, +faststart, 30fps. Hard cap 180s.
        Save to storage/exports/{job_id}.mp4 and set it as the clip's shorts_path.
        """
        import uuid
        from app.core.config import get_settings
        from app.core.database import get_sqlite_conn, get_sqlite_clip, save_sqlite_clip, get_supabase
        from app.services.captions_ass import captions_to_ass

        settings = get_settings()
        exports_dir = settings.storage_exports_dir
        exports_dir.mkdir(parents=True, exist_ok=True)

        job_id = job.get("id") or str(uuid.uuid4())
        clip_id = job.get("clip_id")
        user_id = job.get("user_id") or "owner-ayush"

        self._update_job(job_id, {"progress": 15})

        # 1. Resolve source video file
        clip = get_sqlite_clip(clip_id)
        source_path = None
        if clip and clip.get("file_path"):
            p = Path(clip["file_path"])
            if p.is_file():
                source_path = p

        if not source_path:
            from app.routes.youtube import _resolve_video_file_path
            try:
                cand = _resolve_video_file_path(clip_id, None)
                if cand and cand.is_file():
                    source_path = cand
            except Exception:
                pass

        if not source_path:
            cand = settings.storage_clips_dir / f"{clip_id}.mp4"
            if cand.is_file():
                source_path = cand

        if not source_path or not source_path.is_file():
            raise FileNotFoundError(f"Source video file for clip {clip_id} not found on disk")

        # 2. Read saved edit settings
        conn = get_sqlite_conn()
        row = conn.execute("SELECT edit_json FROM clip_edits WHERE clip_id = ?", (clip_id,)).fetchone()
        edit_json: dict[str, Any] = {}
        if row and row["edit_json"]:
            try:
                edit_json = json.loads(row["edit_json"]) if isinstance(row["edit_json"], str) else row["edit_json"]
            except Exception:
                edit_json = {}

        clip_start = float(clip.get("start", 0.0) or 0.0) if clip else 0.0
        clip_end = float(clip.get("end", 30.0) or 30.0) if clip else 30.0

        trim_in = float(edit_json.get("trim", {}).get("in", clip_start) or clip_start)
        trim_out = float(edit_json.get("trim", {}).get("out", clip_end) or clip_end)
        if trim_out <= trim_in:
            trim_out = trim_in + 30.0

        # Hard cap 180s
        duration = min(180.0, max(0.5, trim_out - trim_in))

        self._update_job(job_id, {"progress": 30})

        # 3. Generate captions ASS file
        captions_cfg = edit_json.get("captions", {})
        ass_filename = None
        ass_file_path = None
        if captions_cfg.get("enabled", True):
            words = captions_cfg.get("words", [])
            if not words and clip:
                text = clip.get("transcript_text") or clip.get("hook") or clip.get("title") or "Viral Short Highlight"
                parts = [w for w in text.split() if w]
                if parts:
                    word_duration = duration / max(1, len(parts))
                    words = [
                        {
                            "text": w,
                            "start": round(trim_in + idx * word_duration, 2),
                            "end": round(trim_in + (idx + 1) * word_duration, 2),
                        }
                        for idx, w in enumerate(parts)
                    ]
                    captions_cfg["words"] = words
                    edit_json["captions"] = captions_cfg

            ass_content = captions_to_ass(edit_json)
            if ass_content:
                ass_filename = f"sub_{job_id}.ass"
                ass_file_path = exports_dir / ass_filename
                ass_file_path.write_text(ass_content, encoding="utf-8")

        # 4. Determine fonts directory: /app/fonts for Docker (Hindi support) or local fonts dir
        docker_fonts = Path("/app/fonts")
        local_fonts = Path(__file__).resolve().parent.parent.parent / "fonts"
        if docker_fonts.exists():
            fonts_arg = "fontsdir=/app/fonts"
        elif local_fonts.exists():
            try:
                rel_fonts = local_fonts.relative_to(exports_dir).as_posix()
            except ValueError:
                rel_fonts = "../../fonts"
            fonts_arg = f"fontsdir={rel_fonts}"
        else:
            fonts_arg = "fontsdir=/app/fonts"

        self._update_job(job_id, {"progress": 45})

        # 5. Build framing filter (1080x1920)
        framing = edit_json.get("framing", {})
        mode = framing.get("mode", "crop")  # "crop", "split", "blur_fit"
        subtitles_str = f"subtitles={ass_filename}:{fonts_arg}" if ass_filename else ""

        if mode == "split":
            fc = (
                "[0:v]split=2[s_top][s_bot];"
                "[s_top]crop=w=iw:h=ih/2:x=0:y=0,scale=1080:960:flags=lanczos[top];"
                "[s_bot]crop=w=iw:h=ih/2:x=0:y=ih/2,scale=1080:960:flags=lanczos[bot];"
                "[top][bot]vstack[base]"
            )
            if subtitles_str:
                fc += f";[base]{subtitles_str}[v_out]"
            else:
                fc += ";[base]copy[v_out]"
        elif mode == "blur_fit":
            fc = (
                "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg];"
                "[0:v]scale=1080:-2:force_original_aspect_ratio=decrease[fg];"
                "[bg][fg]overlay=(W-w)/2:(H-h)/2[base]"
            )
            if subtitles_str:
                fc += f";[base]{subtitles_str}[v_out]"
            else:
                fc += ";[base]copy[v_out]"
        else:
            # Smart Crop (default)
            crop_cfg = framing.get("crop", {})
            cx = float(crop_cfg.get("x", 34.0) or 34.0)
            cy = float(crop_cfg.get("y", 0.0) or 0.0)
            cw = float(crop_cfg.get("w", 31.64) or 31.64)
            ch = float(crop_cfg.get("h", 100.0) or 100.0)
            if cw > 0 and ch > 0:
                crop_filter = (
                    f"crop=w='min(iw,iw*{cw/100:.4f})':h='min(ih,ih*{ch/100:.4f})':"
                    f"x='max(0,min(iw-out_w,iw*{cx/100:.4f}))':y='max(0,min(ih-out_h,ih*{cy/100:.4f}))',"
                    f"scale=1080:1920:flags=lanczos"
                )
            else:
                crop_filter = (
                    "scale='if(gt(ih/iw,16/9),trunc(ih*9/16/2)*2,iw)':'if(gt(ih/iw,16/9),ih,trunc(iw*16/9/2)*2)',"
                    "crop='if(gt(ih/iw,16/9),trunc(ih*9/16/2)*2,iw)':'if(gt(ih/iw,16/9),ih,trunc(iw*16/9/2)*2)',"
                    "scale=1080:1920"
                )
            if subtitles_str:
                fc = f"[0:v]{crop_filter},{subtitles_str}[v_out]"
            else:
                fc = f"[0:v]{crop_filter}[v_out]"

        # Check if source video has audio
        has_audio = False
        try:
            probe_cmd = [
                "ffprobe", "-v", "error",
                "-select_streams", "a:0",
                "-show_entries", "stream=codec_type",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(source_path.resolve()),
            ]
            p_res = subprocess.run(probe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
            has_audio = (p_res.returncode == 0 and "audio" in p_res.stdout.lower())
        except Exception:
            has_audio = True

        out_mp4_name = f"{job_id}.mp4"
        out_mp4_path = exports_dir / out_mp4_name

        cmd = [
            "ffmpeg", "-y",
            "-ss", str(trim_in),
            "-t", str(duration),
            "-i", str(source_path.resolve()),
        ]

        if not has_audio:
            # Guarantee audio is present even for silent source clips
            cmd.extend(["-f", "lavfi", "-t", str(duration), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100"])

        cmd.extend([
            "-filter_complex", fc,
            "-map", "[v_out]",
        ])

        if has_audio:
            cmd.extend(["-map", "0:a", "-c:a", "aac", "-b:a", "128k", "-ar", "44100"])
        else:
            cmd.extend(["-map", "1:a", "-c:a", "aac", "-b:a", "128k", "-ar", "44100"])

        cmd.extend([
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "veryfast",
            "-crf", "22",
            "-r", "30",
            "-movflags", "+faststart",
            str(out_mp4_path.resolve()),
        ])

        self._update_job(job_id, {"progress": 60})

        logger.info("Executing 1-pass FFmpeg export for %s (job %s)", clip_id, job_id)
        proc = subprocess.run(cmd, cwd=str(exports_dir), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=300)

        # Clean up temporary ASS file
        if ass_file_path and ass_file_path.exists():
            try:
                ass_file_path.unlink()
            except Exception:
                pass

        if proc.returncode != 0:
            logger.error("FFmpeg export failed (code %d): %s", proc.returncode, proc.stderr[-800:])
            raise RuntimeError(f"FFmpeg export rendering error: {proc.stderr[-300:]}")

        self._update_job(job_id, {"progress": 90})

        if not out_mp4_path.exists() or out_mp4_path.stat().st_size == 0:
            raise RuntimeError("Export failed: output MP4 file was not created or is empty.")

        # Set shorts_path on clip record in SQLite and Supabase
        if clip:
            clip["shorts_path"] = str(out_mp4_path.resolve())
            clip["updated_at"] = _utcnow()
            try:
                save_sqlite_clip(clip)
            except Exception as exc:
                logger.warning("Could not save shorts_path to SQLite: %s", exc)

        client = get_supabase()
        try:
            client.table("clips").update({
                "shorts_path": str(out_mp4_path.resolve()),
                "updated_at": _utcnow(),
            }).eq("id", clip_id).execute()
        except Exception as exc:
            logger.debug("Supabase update shorts_path notice: %s", exc)

        download_url = f"/api/exports/{job_id}/download"
        self._update_job(job_id, {"status": "completed", "progress": 100, "download_url": download_url})
        return {
            "output_path": str(out_mp4_path.resolve()),
            "job_id": job_id,
            "clip_id": clip_id,
            "duration": duration,
            "download_url": download_url,
            "file_size": out_mp4_path.stat().st_size,
        }


# Global singleton instance
_runner_instance: JobRunner | None = None


def get_job_runner() -> JobRunner:
    global _runner_instance
    if _runner_instance is None:
        _runner_instance = JobRunner()
    return _runner_instance
