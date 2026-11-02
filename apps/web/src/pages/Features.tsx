import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Link } from 'react-router-dom'
import {
  Scissors,
  Volume2,
  Crop,
  Layers,
  Calendar,
  Sparkles,
  Zap,
  Globe2,
  FileVideo,
  CheckCircle2,
  Cpu,
  BarChart3,
} from 'lucide-react'

const DETAILED_FEATURES = [
  {
    title: 'Intelligent AI Clip Detection',
    subtitle: 'Find virality automatically without re-watching hours of footage',
    description:
      'Our speech understanding engine uses faster-whisper to transcribe every word, then scores candidate segments by detecting hook phrases, rhetorical questions, emotional peaks, storytelling structures, and complete sentences.',
    bullets: [
      'Configurable clip duration target (15s, 30s, 60s, 90s)',
      'Transparent engagement score calculation (0–100%)',
      'Automatic removal of overlapping or duplicate moments',
      'Instant title and hook generation for social copywriting',
    ],
    icon: Scissors,
    tag: 'AI Core',
  },
  {
    title: 'Kinetic Word-by-Word Captions',
    subtitle: 'Keep viewers glued with animated, synchronized subtitles',
    description:
      '85% of social media feeds are watched without sound. ClipForge burns crystal-clear, animated captions directly onto the video with karaoke-style active word highlighting, customizable fonts, and dynamic borders.',
    bullets: [
      'Sub-millisecond word timestamp synchronization',
      'Multiple caption animation styles (karaoke, pop, bounce, clean)',
      'Custom fonts, primary text colors, and outline strokes',
      'Export subtitles as standalone .SRT or burn directly into MP4',
    ],
    icon: Volume2,
    tag: 'Retention Booster',
  },
  {
    title: 'Smart 9:16 Video Reframing',
    subtitle: 'Portrait cropping that keeps the speaker center-stage',
    description:
      'Horizontal 16:9 recordings look tiny on mobile phones. ClipForge reframes your footage into native 9:16 vertical video using computer vision face tracking and intelligent center crops, flanked by blurred background padding.',
    bullets: [
      '1080x1920 Full HD portrait rendering',
      'Smart face detection and speaker centering via OpenCV',
      'Blurred Gaussian background layout fallback for wide shots',
      'Manual pan & crop adjustments via the browser editor',
    ],
    icon: Crop,
    tag: 'Reframing',
  },
  {
    title: 'Split-Screen Multi-Cam Layouts',
    subtitle: 'Stack facecam over gameplay or slide decks',
    description:
      'Perfect for gaming streamers, tutorial creators, and reaction videos. Stack the webcam in the upper half and game footage or presentations in the lower half with customizable split dividers and margins.',
    bullets: [
      'Preset 50/50, 40/60 and picture-in-picture split templates',
      'Zero quality degradation during FFmpeg video concatenation',
      'Synced dual-track audio mixing',
      'Ideal for Twitch vods, Discord streams, and Loom walkthroughs',
    ],
    icon: Layers,
    tag: 'Layouts',
  },
  {
    title: 'Automated Silence & Dead-Air Remover',
    subtitle: 'Keep high-octane pacing by pruning pauses',
    description:
      'Nothing kills viewer retention like long silent breaks or speaker hesitation. ClipForge scans the decibel waveform to find silence exceeding your threshold and seamlessly splices the video without popping.',
    bullets: [
      'Configurable decibel threshold (-20dB to -40dB)',
      'Adjustable minimum pause duration (from 0.3s to 2.0s)',
      'Smooth audio cross-fades to avoid audio clicks',
      'Saves up to 25% of overall video duration automatically',
    ],
    icon: Zap,
    tag: 'Pacing',
  },
  {
    title: 'Global Video Translator (50+ Languages)',
    subtitle: 'Translate captions and reach worldwide audiences',
    description:
      'Expand your reach beyond your native tongue. Translate full video transcripts and captions into Hindi, Spanish, French, German, Japanese, and 45+ languages while maintaining timing synchronization.',
    bullets: [
      'Maintains exact word and sentence timestamps',
      'Multi-language SRT export and burned-in subtitle export',
      'Cultural idiom adaptation and natural flow preservation',
      'Zero extra processing charge on Pro and Team plans',
    ],
    icon: Globe2,
    tag: 'Global Reach',
  },
]

export default function Features() {
  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge variant="brand" className="mb-3">Deep Feature Inspection</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-6">
            Engineered for <span className="gradient-text">Maximum Retention</span>
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Every tool in ClipForge AI was built to solve a specific bottleneck in the short-form content workflow. Explore the full suite below.
          </p>
        </div>

        <div className="space-y-16">
          {DETAILED_FEATURES.map((item, index) => {
            const Icon = item.icon
            const isEven = index % 2 === 0
            return (
              <div
                key={index}
                className={`flex flex-col ${
                  isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } items-center gap-12 p-8 md:p-12 rounded-3xl bg-surface-card border border-surface-border`}
              >
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center">
                      <Icon size={22} />
                    </div>
                    <Badge variant="brand">{item.tag}</Badge>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{item.title}</h2>
                  <p className="text-sm font-medium text-brand-300">{item.subtitle}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                  <ul className="space-y-2.5 pt-2">
                    {item.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex-1 w-full flex items-center justify-center">
                  <div className="w-full max-w-md aspect-video rounded-2xl bg-gradient-to-br from-surface to-surface-muted border border-surface-border p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Cpu size={14} className="text-brand-400" /> FFmpeg Pipeline
                      </span>
                      <span className="font-mono text-emerald-400">STATUS: READY</span>
                    </div>
                    <div className="text-center py-6">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                        <Icon size={28} />
                      </div>
                      <div className="text-xs font-semibold text-slate-200">{item.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">Hardware Accelerated H.264/AAC</div>
                    </div>
                    <div className="h-1.5 w-full bg-surface-border rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-600 to-accent-500 w-3/4 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <Link to="/signup">
            <Button size="lg" className="px-8 py-4 font-bold text-base shadow-brand">
              Try All Features Free →
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  )
}
