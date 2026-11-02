import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Link } from 'react-router-dom'
import {
  Upload,
  Cpu,
  Scissors,
  Download,
  Terminal,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

export default function HowItWorks() {
  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge variant="brand" className="mb-3">Technical Deep-Dive</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
            How <span className="gradient-text">ClipForge AI</span> Works
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            A transparent walkthrough of our transcription, scoring, reframing, and rendering pipeline.
          </p>
        </div>

        {/* Pipeline Architecture Diagram / Steps */}
        <div className="space-y-12">
          {/* Step 1 */}
          <div className="p-8 rounded-3xl bg-surface-card border border-surface-border flex flex-col md:flex-row gap-8 items-start">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center shrink-0 text-xl font-bold">
              01
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-white">Video Ingestion & Stream Inspection</h3>
                <Badge variant="default">FFprobe</Badge>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                When you upload a video or submit a permitted source URL, ClipForge performs immediate header analysis via FFprobe. It extracts the container metadata: total duration, frame rate (fps), stream codecs, and native dimensions. The audio track is separated into a 16kHz mono PCM waveform optimized for automatic speech recognition.
              </p>
              <div className="bg-bg p-4 rounded-xl border border-surface-border font-mono text-xs text-brand-300">
                ffmpeg -i input.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-8 rounded-3xl bg-surface-card border border-surface-border flex flex-col md:flex-row gap-8 items-start">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center shrink-0 text-xl font-bold">
              02
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-white">ASR Transcription with faster-whisper</h3>
                <Badge variant="brand">Open-Source AI</Badge>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                The extracted audio feeds into faster-whisper (CTranslate2 implementation of OpenAI Whisper). It transcribes the speech with 98%+ accuracy across 99 languages. Crucially, word-level timestamps are preserved down to the millisecond so each word can be highlighted during video playback.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Multi-language auto-detection</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Word-level alignment timestamps</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Low-latency quantized INT8 CPU inference</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Complete privacy — audio never leaves your machine</li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-8 rounded-3xl bg-surface-card border border-surface-border flex flex-col md:flex-row gap-8 items-start">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center shrink-0 text-xl font-bold">
              03
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-white">Virality Scoring & Clip Window Detection</h3>
                <Badge variant="info">NLP Scoring</Badge>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Rather than random trimming, ClipForge runs a sliding window algorithm that evaluates sentence structure, hook terminology (e.g. &ldquo;the secret is&rdquo;, &ldquo;most people don&rsquo;t realize&rdquo;), question-answer structures, and speech cadence. Candidate clips are ranked by engagement score and deduplicated by non-overlapping windows.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-8 rounded-3xl bg-surface-card border border-surface-border flex flex-col md:flex-row gap-8 items-start">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center shrink-0 text-xl font-bold">
              04
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-white">Production FFmpeg 1080p Rendering</h3>
                <Badge variant="success">H.264 / AAC</Badge>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Once you adjust your trim handles or choose your caption design, the worker process launches a hardware-accelerated FFmpeg job. The video is cropped to 9:16 vertical (or your chosen ratio), the subtitles are styled and burned in, and audio is normalized to social broadcast standards (-14 LUFS).
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 p-10 rounded-3xl bg-gradient-to-br from-surface-card to-bg-2 border border-surface-border text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">See It In Action</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mb-6">
            Upload your first video and let the pipeline turn it into social clips in minutes.
          </p>
          <Link to="/signup">
            <Button size="lg" className="px-8 py-3.5 font-bold shadow-brand">
              Get Started for Free →
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  )
}
