import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { Scissors, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react'

export default function About() {
  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="brand" className="mb-3">About ClipForge AI</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
            Honest Video Repurposing for <span className="gradient-text">Creators</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            ClipForge AI is an open-source powered software platform built to transform long-form recordings into clean, vertical short videos.
          </p>
        </div>

        {/* Short, honest product overview */}
        <div className="p-8 md:p-12 rounded-3xl bg-surface-card border border-surface-border mb-16 space-y-6 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-2xl font-bold text-white">What We Do</h2>
          <p>
            Producing short-form videos for YouTube Shorts, Instagram Reels, and TikTok usually demands hours of scrubbing through footage, finding punchy soundbites, cropping 16:9 shots to 9:16 vertical orientation, and manually transcribing subtitles.
          </p>
          <p>
            ClipForge AI streamlines this workflow into a simple pipeline. By combining faster-whisper speech recognition, NLP highlight detection, and FFmpeg media rendering, ClipForge AI extracts hook segments, reframes them for vertical displays, burns kinetic captions (with full Hindi Devanagari font support), and lets creators preview and tweak edits in an interactive in-browser editor before publishing.
          </p>
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center">
              <Zap size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Open Technology Stack</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built on reliable open-source components: faster-whisper for speech transcription, PySceneDetect for cut detection, and FFmpeg for crisp 1080x1920 exports.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Creator Privacy First</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You own 100% of your source footage and generated clips. We never sell your media or use user videos to train third-party machine learning models.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-accent-600/20 text-accent-400 flex items-center justify-center">
              <Layers size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Transparent &amp; Accessible</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every user starts with a free plan providing 10 exports and 30 minutes of transcription per month, with zero hidden fees and no credit card required.
            </p>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/signup">
            <Button size="lg" className="px-8 font-bold">
              Try ClipForge AI Free →
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  )
}
