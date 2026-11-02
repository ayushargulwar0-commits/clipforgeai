"""
AI clip detector — analyzes a transcript and scores segments to find the
best short-form clip candidates.

Algorithm
---------
1. Slide a window over transcript segments in the requested duration range.
2. Score each window based on:
   - Hook words (surprise, reveal, secret, amazing, etc.)
   - Questions (who/what/how/why + "?")
   - Emotional intensity indicators
   - Sentence completeness (starts after a pause, ends at sentence boundary)
   - Duration fitness (how close to the ideal 30–45 s sweet spot)
   - Pause penalty (long gaps inside the window)
3. Return the top-N windows sorted by score descending.
"""

from __future__ import annotations

import re
import logging
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Scoring vocabulary
# ---------------------------------------------------------------------------

HOOK_WORDS: frozenset[str] = frozenset(
    {
        "surprising", "surprised", "shocking", "shocked", "revealed", "revealing",
        "reveal", "secret", "secrets", "never", "nobody", "always", "every",
        "amazing", "incredible", "unbelievable", "insane", "crazy", "massive",
        "game-changer", "game changer", "breakthrough", "discovered", "discovery",
        "truth", "lie", "mistake", "biggest", "most", "worst", "best",
        "actually", "literally", "honestly", "real", "hidden", "underground",
        "banned", "forbidden", "illegal", "controversial", "dangerous",
        "immediately", "instantly", "overnight", "guaranteed",
    }
)

QUESTION_STARTERS: frozenset[str] = frozenset(
    {"who", "what", "how", "why", "when", "where", "which", "can", "could",
     "should", "would", "do", "does", "did", "is", "are", "was", "were"}
)

EMOTION_WORDS: frozenset[str] = frozenset(
    {
        "love", "hate", "fear", "angry", "excited", "frustrated", "happy",
        "sad", "worried", "terrified", "passionate", "desperate", "proud",
        "embarrassed", "disgusted", "thrilled", "horrified", "shocked",
    }
)

SENTENCE_ENDINGS: re.Pattern = re.compile(r"[.!?]\s*$")

IDEAL_DURATION_MIN = 25.0  # seconds
IDEAL_DURATION_MAX = 45.0  # seconds


# ---------------------------------------------------------------------------
# Clip Detector
# ---------------------------------------------------------------------------


class ClipDetector:
    """
    Scores transcript windows to surface the highest-value clip moments.
    """

    def detect_clips(
        self,
        transcript: dict[str, Any],
        min_duration: float = 15.0,
        max_duration: float = 60.0,
        max_clips: int = 10,
    ) -> list[dict[str, Any]]:
        """
        Analyze a transcript dict and return up to *max_clips* candidates.

        Parameters
        ----------
        transcript   : Output of ``TranscriptionEngine.transcribe()``
                       {segments: [{start, end, text, words}], language, duration}
        min_duration : Minimum clip length in seconds (inclusive).
        max_duration : Maximum clip length in seconds (inclusive).
        max_clips    : Maximum number of candidates to return.

        Returns
        -------
        List of dicts sorted by ``score`` descending:
            {start, end, title, description, hook, transcript_text,
             score, score_explanation}
        """
        segments: list[dict[str, Any]] = transcript.get("segments", [])

        if not segments:
            logger.warning("ClipDetector received empty transcript segments")
            return []

        candidates: list[dict[str, Any]] = []

        # ---- Sliding window over segments ----
        for i in range(len(segments)):
            window_segments: list[dict[str, Any]] = [segments[i]]
            window_start: float = segments[i]["start"]

            for j in range(i + 1, len(segments)):
                window_segments.append(segments[j])
                window_end: float = segments[j]["end"]
                duration: float = window_end - window_start

                if duration < min_duration:
                    continue  # too short, keep extending

                if duration > max_duration:
                    break  # too long, stop this window

                # ---- Score this window ----
                score, explanation, hook_phrase = self._score_window(
                    window_segments, window_start, window_end
                )

                if score <= 0:
                    continue

                transcript_text = " ".join(
                    s["text"] for s in window_segments if s["text"]
                ).strip()

                title = self._generate_title(window_segments, hook_phrase)
                description = self._generate_description(window_segments)

                candidates.append(
                    {
                        "start": round(window_start, 3),
                        "end": round(window_end, 3),
                        "duration": round(duration, 3),
                        "title": title,
                        "description": description,
                        "hook": hook_phrase,
                        "transcript_text": transcript_text,
                        "score": round(score, 4),
                        "score_explanation": explanation,
                    }
                )

        if not candidates:
            logger.info("No clip candidates found with current settings")
            return []

        # ---- Deduplicate (greedy non-overlap by highest score) ----
        candidates.sort(key=lambda c: c["score"], reverse=True)
        selected: list[dict[str, Any]] = []
        for cand in candidates:
            if len(selected) >= max_clips:
                break
            # Discard if it overlaps > 50% with an already-selected clip
            if not any(
                self._overlap_ratio(cand, sel) > 0.5 for sel in selected
            ):
                selected.append(cand)

        logger.info("ClipDetector: %d candidates → %d selected", len(candidates), len(selected))
        return selected

    # ------------------------------------------------------------------
    # Scoring
    # ------------------------------------------------------------------

    def _score_window(
        self,
        segments: list[dict[str, Any]],
        start: float,
        end: float,
    ) -> tuple[float, str, str]:
        """
        Return (score, explanation_string, best_hook_phrase).
        """
        text_combined = " ".join(s["text"] for s in segments).lower()
        words_lower = re.findall(r"\b\w+\b", text_combined)
        word_set = set(words_lower)

        score = 0.0
        reasons: list[str] = []
        best_hook = ""

        # ---- Hook word hits ----
        hook_hits = HOOK_WORDS & word_set
        if hook_hits:
            hook_score = min(len(hook_hits) * 0.15, 0.60)
            score += hook_score
            best_hook = max(hook_hits, key=lambda w: text_combined.count(w))
            reasons.append(f"hook_words({','.join(list(hook_hits)[:3])})+{hook_score:.2f}")

        # ---- Questions ----
        question_count = text_combined.count("?")
        for seg in segments:
            first_word = re.split(r"\s+", seg["text"].strip())[0].lower().rstrip("?,.")
            if first_word in QUESTION_STARTERS:
                question_count += 1

        if question_count:
            q_score = min(question_count * 0.12, 0.36)
            score += q_score
            reasons.append(f"questions({question_count})+{q_score:.2f}")

        # ---- Emotional words ----
        emotion_hits = EMOTION_WORDS & word_set
        if emotion_hits:
            e_score = min(len(emotion_hits) * 0.08, 0.24)
            score += e_score
            reasons.append(f"emotion({len(emotion_hits)})+{e_score:.2f}")

        # ---- Sentence boundary bonus ----
        first_text = segments[0]["text"].strip()
        last_text = segments[-1]["text"].strip()

        # Good start: previous segment ended with a sentence-ending punctuation
        # (approximated: first segment text starts with a capital letter)
        if first_text and first_text[0].isupper():
            score += 0.08
            reasons.append("starts_at_sentence+0.08")

        # Good end: final segment ends with sentence-ending punctuation
        if SENTENCE_ENDINGS.search(last_text):
            score += 0.08
            reasons.append("ends_at_sentence+0.08")

        # ---- Duration fitness ----
        duration = end - start
        if IDEAL_DURATION_MIN <= duration <= IDEAL_DURATION_MAX:
            score += 0.20
            reasons.append("ideal_duration+0.20")
        elif duration < IDEAL_DURATION_MIN:
            penalty = (IDEAL_DURATION_MIN - duration) / IDEAL_DURATION_MIN * 0.10
            score -= penalty
            reasons.append(f"short_penalty-{penalty:.2f}")
        else:
            penalty = (duration - IDEAL_DURATION_MAX) / IDEAL_DURATION_MAX * 0.10
            score -= penalty
            reasons.append(f"long_penalty-{penalty:.2f}")

        # ---- Pause penalty: long internal gaps reduce score ----
        for k in range(len(segments) - 1):
            gap = segments[k + 1]["start"] - segments[k]["end"]
            if gap > 2.0:
                penalty = min((gap - 2.0) * 0.05, 0.15)
                score -= penalty
                reasons.append(f"pause_gap({gap:.1f}s)-{penalty:.2f}")

        # ---- Word density bonus: penalize very sparse speech ----
        speech_duration = sum(s["end"] - s["start"] for s in segments)
        word_count = len(words_lower)
        if speech_duration > 0:
            wpm = (word_count / speech_duration) * 60
            if wpm >= 100:
                score += 0.05
                reasons.append("good_pace+0.05")
            elif wpm < 60:
                score -= 0.05
                reasons.append("slow_pace-0.05")

        explanation = "; ".join(reasons) if reasons else "no_signal"
        return max(score, 0.0), explanation, best_hook

    # ------------------------------------------------------------------
    # Title / description generation from transcript text
    # ------------------------------------------------------------------

    def _generate_title(
        self,
        segments: list[dict[str, Any]],
        hook: str,
    ) -> str:
        """
        Generate a short title for the clip.
        Prefers the first sentence of the first segment that contains a hook word,
        otherwise the first sentence, truncated to ~60 characters.
        """
        for seg in segments:
            text = seg["text"].strip()
            if not text:
                continue
            text_lower = text.lower()
            if hook and hook in text_lower:
                # Use this sentence as the title
                title = _first_sentence(text)
                return _truncate(title, 80)

        # Fallback: first segment text
        first = segments[0]["text"].strip() if segments else "Clip"
        return _truncate(_first_sentence(first), 80)

    def _generate_description(self, segments: list[dict[str, Any]]) -> str:
        """
        Generate a 1–2 sentence description from the clip transcript.
        """
        sentences: list[str] = []
        for seg in segments:
            text = seg["text"].strip()
            parts = re.split(r"(?<=[.!?])\s+", text)
            sentences.extend(p.strip() for p in parts if p.strip())

        # Pick first two sentences
        desc = " ".join(sentences[:2])
        return _truncate(desc, 200)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _overlap_ratio(a: dict, b: dict) -> float:
        """Fraction of clip *a* that overlaps with clip *b*."""
        overlap_start = max(a["start"], b["start"])
        overlap_end = min(a["end"], b["end"])
        overlap = max(0.0, overlap_end - overlap_start)
        duration_a = a["end"] - a["start"]
        return overlap / duration_a if duration_a > 0 else 0.0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _first_sentence(text: str) -> str:
    m = SENTENCE_ENDINGS.search(text)
    if m:
        return text[: m.end()].strip()
    return text


def _truncate(text: str, max_len: int) -> str:
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip() + "…"
