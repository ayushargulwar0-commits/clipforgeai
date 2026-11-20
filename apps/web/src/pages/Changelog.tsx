import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { GitCommit, Sparkles, Zap, Bug, Film, ShieldCheck } from 'lucide-react'

const releases = [
  {
    version: 'v1.3.0',
    date: 'November 20, 2026',
    title: 'High-Performance Video Pipeline & AdSense Compliance',
    badge: 'Latest Release',
    highlights: [
      'Added dedicated fast byte-range MP4 streaming with signed stream-tokens for instant scrubbing in HTML5 video player.',
      'Comprehensive Google AdSense compliance integration including updated Privacy Policy, Terms, and Cookie Management.',
      'Fixed clip switching in editor: keyed instance synchronization prevents stale clip cross-talk.',
      'Enhanced ffprobe metadata inspection and automatic SQLite database validation for all media assets.',
    ],
  },
  {
    version: 'v1.2.0',
    date: 'November 15, 2026',
    title: 'Kinetic Subtitles & 9:16 Auto-Framing Engine',
    badge: 'Major Update',
    highlights: [
      'Automated word-by-word highlighted captions rendered using ASS subtitle styling with support for multiple languages.',
      'Smart 9:16 portrait reframing with face centering and blurred background padding for horizontal 16:9 recordings.',
      'One-click video export pipeline with GPU-accelerated FFmpeg producing high-bitrate H.264 MP4 videos.',
      'Added Content Scheduler to organize video posting calendars across TikTok, YouTube Shorts, and Instagram Reels.',
    ],
  },
  {
    version: 'v1.0.0',
    date: 'November 1, 2026',
    title: 'ClipForge AI Public Launch',
    badge: 'Initial Release',
    highlights: [
      'Core video ingestion pipeline supporting direct MP4/MOV file upload and YouTube URL importing.',
      'Speech transcription powered by faster-whisper with word-level timestamp generation.',
      'Interactive browser timeline editor with trim handles, playhead controls, and safe zone overlays.',
      'Free starter tier with 10 monthly exports and no credit card required.',
    ],
  },
]

export default function Changelog() {
  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" className="mb-3">Product Updates</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Changelog &amp; Releases
          </h1>
          <p className="text-slate-400 text-sm">
            Stay updated with continuous improvements, new features, and performance enhancements across ClipForge AI.
          </p>
        </div>

        <div className="space-y-8">
          {releases.map((rel) => (
            <Card key={rel.version} className="p-8 border-surface-border bg-surface-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold">
                    <GitCommit size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{rel.title}</h2>
                    <p className="text-xs text-slate-400">{rel.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="brand">{rel.version}</Badge>
                  <Badge variant="default">{rel.badge}</Badge>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-slate-300">
                {rel.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Sparkles size={16} className="text-brand-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  )
}
