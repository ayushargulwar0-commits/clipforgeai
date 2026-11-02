import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Link } from 'react-router-dom'
import {
  Scissors,
  Mic,
  Gamepad2,
  Tv,
  Film,
  Volume2,
  Crop,
  FileText,
  Globe2,
  Maximize2,
  VolumeX,
  Layers,
  FileAudio,
  Bot,
  ArrowRight,
} from 'lucide-react'

const TOOLS_LIBRARY = [
  {
    id: 'clip-generator',
    name: 'AI Clip Generator',
    description: 'Automatically analyzes full-length footage to identify high-retention moments and generates ready-to-share viral clips.',
    icon: Scissors,
    tag: 'Popular',
  },
  {
    id: 'podcast-to-reels',
    name: 'Podcast to Reels',
    description: 'Converts audio & video podcast episodes into visual 9:16 clips with animated wave effects and karaoke subtitles.',
    icon: Mic,
    tag: 'Audio/Video',
  },
  {
    id: 'gaming-clipper',
    name: 'Gaming Highlight Clipper',
    description: 'Detects high-energy action, teamfights, and shouts from stream audio, reframing facecam and gameplay simultaneously.',
    icon: Gamepad2,
    tag: 'Twitch/YouTube',
  },
  {
    id: 'webinar-clipper',
    name: 'Webinar Clip Generator',
    description: 'Extracts key executive quotes, product demos, and presentation highlights for LinkedIn and Twitter lead magnets.',
    icon: Tv,
    tag: 'B2B',
  },
  {
    id: 'youtube-to-shorts',
    name: 'YouTube to Shorts',
    description: 'Paste any YouTube link to extract the best performing segment, cropped vertically with auto captions.',
    icon: Film,
    tag: 'URL Import',
  },
  {
    id: 'captions-generator',
    name: 'AI Captions Generator',
    description: 'Generates animated, word-level highlighted subtitles with customizable fonts, colors, and positioning in seconds.',
    icon: Volume2,
    tag: 'Essential',
  },
  {
    id: 'video-reframing',
    name: 'AI Video Reframing',
    description: 'Computer-vision face tracking keeps the speaker centered when converting 16:9 landscape to 9:16 portrait.',
    icon: Crop,
    tag: 'OpenCV',
  },
  {
    id: 'video-summarizer',
    name: 'Video Summarizer',
    description: 'Generates concise bullet-point summaries, executive abstracts, and chapter timestamps from full transcripts.',
    icon: FileText,
    tag: 'NLP',
  },
  {
    id: 'video-translator',
    name: 'AI Video Translator',
    description: 'Translates spoken transcript and subtitles into 50+ languages while preserving exact word-by-word timing.',
    icon: Globe2,
    tag: 'Global',
  },
  {
    id: 'video-resizer',
    name: 'Video Resizer',
    description: 'Instantly convert videos between 9:16 (TikTok), 1:1 (Instagram Feed), and 16:9 (YouTube) with smart padding.',
    icon: Maximize2,
    tag: 'Formatting',
  },
  {
    id: 'silence-remover',
    name: 'Silence Remover',
    description: 'Scans audio waveforms to remove awkward pauses, dead air, and filler sounds for high-tempo retention.',
    icon: VolumeX,
    tag: 'Speed Pacing',
  },
  {
    id: 'split-screen',
    name: 'Split Screen Generator',
    description: 'Creates side-by-side or stacked portrait videos combining speaker reactions with source videos or gameplay.',
    icon: Layers,
    tag: 'Layout',
  },
  {
    id: 'video-transcription',
    name: 'Video Transcription',
    description: 'Production faster-whisper engine converts video speech to text with 98%+ accuracy, exporting SRT or VTT.',
    icon: FileAudio,
    tag: 'faster-whisper',
  },
  {
    id: 'clip-assistant',
    name: 'AI Clip Assistant',
    description: 'Natural language chat interface: &ldquo;Make this 30s long, remove silence, and add yellow captions.&rdquo;',
    icon: Bot,
    tag: 'Interactive',
  },
]

export default function AITools() {
  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="brand" className="mb-3">Comprehensive AI Toolkit</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
            14 Specialized <span className="gradient-text">AI Video Tools</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Every tool is designed to work standalone or in sequence, powered by our open-source processing engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS_LIBRARY.map((tool) => {
            const Icon = tool.icon
            return (
              <Card key={tool.id} hover className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center">
                      <Icon size={24} />
                    </div>
                    <Badge variant="default">{tool.tag}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{tool.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{tool.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-surface-border">
                  <Link to="/signup">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                      Launch Tool <ArrowRight size={12} />
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mt-20 text-center">
          <Link to="/signup">
            <Button size="lg" className="px-8 py-4 font-bold shadow-brand">
              Access All 14 Tools Free →
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  )
}
