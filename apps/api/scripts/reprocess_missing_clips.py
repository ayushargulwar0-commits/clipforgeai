#!/usr/bin/env python3
"""
One-off script to inspect existing clips, ensure real video files exist at
storage/clips/{clip_id}.mp4 (H.264 + AAC, yuv420p, -movflags +faststart),
validate them with ffprobe, and update the clips database table.
"""

from __future__ import annotations

import json
import logging
import sqlite3
import subprocess
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("reprocess_clips")

DB_PATH = Path("storage/clipforge.db")
CLIPS_DIR = Path("storage/clips")
VIDEOS_DIR = Path("storage/videos")


def verify_video_file(file_path: Path) -> tuple[bool, float, str]:
    """Verify that file exists and ffprobe confirms at least one video stream."""
    if not file_path.is_file() or file_path.stat().st_size == 0:
        return False, 0.0, "File does not exist or is empty"
    cmd = [
        "ffprobe",
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=codec_name,width,height:format=duration",
        "-of", "json",
        str(file_path),
    ]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
        if res.returncode != 0:
            return False, 0.0, f"ffprobe error: {res.stderr.strip()[:100]}"
        data = json.loads(res.stdout)
        streams = data.get("streams", [])
        if not streams or not streams[0].get("codec_name"):
            return False, 0.0, "No valid video stream found"
        dur_str = data.get("format", {}).get("duration", "0")
        try:
            dur = float(dur_str)
        except (ValueError, TypeError):
            dur = 0.0
        return True, dur, ""
    except Exception as exc:
        return False, 0.0, f"ffprobe check failed: {exc}"


def transcode_to_canonical(source_file: Path, target_file: Path) -> bool:
    """Transcode source video to H.264 + AAC, yuv420p, -movflags +faststart."""
    target_file.parent.mkdir(parents=True, exist_ok=True)
    temp_target = target_file.with_name(f"tmp_{target_file.name}")
    cmd = [
        "ffmpeg", "-y",
        "-i", str(source_file),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "veryfast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        str(temp_target),
    ]
    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
        if proc.returncode == 0 and temp_target.is_file() and temp_target.stat().st_size > 0:
            if target_file.exists():
                target_file.unlink()
            temp_target.replace(target_file)
            return True
        else:
            logger.error("FFmpeg transcode failed: %s", proc.stderr[-200:])
            temp_target.unlink(missing_ok=True)
            return False
    except Exception as exc:
        logger.exception("Transcode error: %s", exc)
        temp_target.unlink(missing_ok=True)
        return False


def main():
    if not DB_PATH.is_file():
        logger.error("Database file %s not found.", DB_PATH)
        return

    CLIPS_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    # Ensure columns exist
    for col in ("file_path", "error_message"):
        try:
            conn.execute(f"ALTER TABLE clips ADD COLUMN {col} TEXT;")
        except Exception:
            pass

    rows = conn.execute("SELECT * FROM clips").fetchall()
    logger.info("Found %d clips in database to inspect.", len(rows))

    ready_count = 0
    failed_count = 0
    fixed_count = 0

    for r in rows:
        cid = r["id"]
        target = CLIPS_DIR / f"{cid}.mp4"

        # Check if canonical target already exists
        if target.is_file():
            is_valid, probed_dur, err = verify_video_file(target)
            if is_valid:
                conn.execute(
                    "UPDATE clips SET status = 'ready', file_path = ?, rendered_path = ?, duration = ?, error_message = NULL WHERE id = ?",
                    (str(target.resolve()), str(target.resolve()), probed_dur, cid),
                )
                ready_count += 1
                logger.info("Clip %s: Canonical file valid (%.1fs). Marked READY.", cid, probed_dur)
                continue
            else:
                target.unlink(missing_ok=True)

        # Look for candidates
        candidates = [
            CLIPS_DIR / f"clip_{cid}.mp4",
            CLIPS_DIR / f"clip_{cid}_rendered.mp4",
            CLIPS_DIR / f"clip_{cid}_section.mp4",
            VIDEOS_DIR / f"{cid}.mp4",
        ]
        if r["rendered_path"]:
            candidates.insert(0, Path(r["rendered_path"]))
        if r["source_url"]:
            candidates.insert(1, CLIPS_DIR / Path(r["source_url"]).name)

        found_candidate = None
        for cand in candidates:
            if cand.is_file() and cand.stat().st_size > 0:
                is_valid, dur, _ = verify_video_file(cand)
                if is_valid:
                    found_candidate = cand
                    break

        if found_candidate:
            logger.info("Clip %s: Transcoding from candidate %s to %s", cid, found_candidate, target)
            ok = transcode_to_canonical(found_candidate, target)
            if ok:
                is_valid, probed_dur, err = verify_video_file(target)
                if is_valid:
                    conn.execute(
                        "UPDATE clips SET status = 'ready', file_path = ?, rendered_path = ?, duration = ?, error_message = NULL WHERE id = ?",
                        (str(target.resolve()), str(target.resolve()), probed_dur, cid),
                    )
                    fixed_count += 1
                    logger.info("Clip %s: Successfully fixed and marked READY.", cid)
                    continue

        # No file or transcode failed
        reason = "Video source file missing from server or unplayable"
        conn.execute(
            "UPDATE clips SET status = 'failed', error_message = ? WHERE id = ?",
            (reason, cid),
        )
        failed_count += 1
        logger.warning("Clip %s: No valid media found. Marked FAILED (%s).", cid, reason)

    conn.commit()
    conn.close()

    logger.info("=== SUMMARY ===")
    logger.info("Total clips: %d", len(rows))
    logger.info("Already ready: %d", ready_count)
    logger.info("Fixed to canonical: %d", fixed_count)
    logger.info("Marked failed: %d", failed_count)


if __name__ == "__main__":
    main()
