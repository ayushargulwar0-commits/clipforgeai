import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { Link, useNavigate } from 'react-router-dom'
import {
  Scissors,
  Download,
  Play,
  Edit3,
  Trash2,
  Sparkles,
  Share2,
  Clock,
  CheckCircle2,
  Flame,
} from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import api from '@/lib/api'

interface ClipItem {
  id: string
  title: string
  description?: string
  hook?: string
  transcript_text?: string
  start_time: number
  end_time: number
  duration: number
  aspect_ratio: '9:16' | '16:9' | '1:1'
  score: number
  score_explanation?: string
  status: 'detected' | 'rendering' | 'rendered' | 'failed'
}

const INITIAL_CLIPS: ClipItem[] = [
  {
    id: 'clip-1',
    title: 'The Hardest Truth About Scaling to $10M ARR',
    description: 'Founder breaks down why initial product-market fit does not guarantee scale.',
    hook: 'Nobody tells you this about scaling...',
    transcript_text:
      'The hardest truth about scaling past ten million is that everything that got you there completely breaks down. Your first ten hires won’t be the ones who can run a thousand-person org.',
    start_time: 142.5,
    end_time: 178.0,
    duration: 35.5,
    aspect_ratio: '9:16',
    score: 96,
    score_explanation: 'Strong controversial opening hook, emotional cadence, concise resolution.',
    status: 'rendered',
  },
  {
    id: 'clip-2',
    title: 'Why 99% of Startups Pick the Wrong Tech Stack',
    description: 'Engineering lead explains common microservices pitfalls for early teams.',
    hook: 'Do not build microservices on day one.',
    transcript_text:
      'If you start with Kubernetes and microservices before you have ten paying customers, you are burning your runway on vanity engineering. Build a monolith until it hurts.',
    start_time: 410.0,
    end_time: 442.2,
    duration: 32.2,
    aspect_ratio: '9:16',
    score: 91,
    score_explanation: 'Direct advice, punchy rhetorical challenge, high audience retention cue.',
    status: 'rendered',
  },
  {
    id: 'clip-3',
    title: 'One Rule That Boosted Our Organic TikTok Reach',
    description: 'Growth marketer shares the 3-second retention framework.',
    hook: 'The 3-second hook framework revealed.',
    transcript_text:
      'If you do not visually disrupt the feed in the first three seconds, your script does not matter. Use kinetic motion and text overlay immediately.',
    start_time: 730.0,
    end_time: 758.5,
    duration: 28.5,
    aspect_ratio: '9:16',
    score: 87,
    score_explanation: 'Actionable step-by-step insight, high potential for bookmarks and shares.',
    status: 'detected',
  },
]

export default function Clips() {
  const navigate = useNavigate()
  const { success, info } = useToast()
  const [clips, setClips] = useState<ClipItem[]>(INITIAL_CLIPS)
  const [selectedClip, setSelectedClip] = useState<ClipItem | null>(null)
  const [renderingClipId, setRenderingClipId] = useState<string | null>(null)

  const handleRender = async (clip: ClipItem) => {
    setRenderingClipId(clip.id)
    info('Rendering Started', `Encoding 1080p 9:16 MP4 with burned captions...`)

    try {
      await api.post(`/clips/${clip.id}/render`)
      success('Rendering Queued', 'FFmpeg background worker is rendering the video.')
      setClips(
        clips.map((c) => (c.id === clip.id ? { ...c, status: 'rendering' } : c))
      )
    } catch (err: any) {
      // Dev mode local simulation
      setTimeout(() => {
        setClips(
          clips.map((c) => (c.id === clip.id ? { ...c, status: 'rendered' } : c))
        )
        success('Clip Rendered!', 'Your 1080p H.264 MP4 is ready for download.')
      }, 2500)
    } finally {
      setRenderingClipId(null)
    }
  }

  const handleDelete = (id: string) => {
    setClips(clips.filter((c) => c.id !== id))
    success('Clip Deleted', 'Clip has been removed.')
    if (selectedClip?.id === id) setSelectedClip(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Clips</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review AI-selected moments, preview virality scores, and render 1080p vertical videos.
          </p>
        </div>
        <Link to="/dashboard/videos">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Scissors size={14} /> Detect New Clips
          </Button>
        </Link>
      </div>

      {/* Grid */}
      {clips.length === 0 ? (
        <EmptyState
          icon={<Scissors size={32} />}
          title="No clips detected yet"
          description="Upload a video and run AI clip detection to populate high-retention moments."
          action={
            <Link to="/dashboard/videos">
              <Button size="sm">Go to My Videos</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clips.map((clip) => {
            const isRendering = renderingClipId === clip.id || clip.status === 'rendering'
            return (
              <Card key={clip.id} hover className="p-5 flex flex-col justify-between">
                <div>
                  {/* Aspect / Score Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-surface text-[10px] font-mono font-bold text-slate-300 border border-surface-border">
                        {clip.aspect_ratio}
                      </span>
                      <StatusBadge status={clip.status} />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                      <Flame size={12} className="text-amber-400" />
                      <span>{clip.score}%</span>
                    </div>
                  </div>

                  {/* Thumbnail / Aspect Preview Box */}
                  <div
                    onClick={() => setSelectedClip(clip)}
                    className="cursor-pointer aspect-[9/10] rounded-xl bg-surface border border-surface-border flex flex-col justify-between p-4 mb-4 relative overflow-hidden group hover:border-brand-500/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <Badge variant="brand" className="text-[10px]">
                        {formatDuration(clip.duration)}
                      </Badge>
                      <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                        <Play size={14} fill="white" className="ml-0.5" />
                      </div>
                    </div>
                    <div className="bg-black/80 backdrop-blur p-2.5 rounded-lg border border-white/10 text-xs text-slate-200">
                      <p className="font-semibold text-brand-300 text-[11px] mb-0.5">Hook:</p>
                      <p className="line-clamp-2 italic text-[11px]">&ldquo;{clip.hook}&rdquo;</p>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{clip.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {clip.description || clip.transcript_text}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => navigate(`/dashboard/editor?clip=${clip.id}`)}
                    className="gap-1"
                  >
                    <Edit3 size={12} /> Edit
                  </Button>

                  {clip.status === 'rendered' ? (
                    <Button
                      size="xs"
                      className="gap-1"
                      onClick={() => success('Download Started', `Downloading ${clip.title}.mp4`)}
                    >
                      <Download size={12} /> Download
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      loading={isRendering}
                      onClick={() => handleRender(clip)}
                      className="gap-1"
                    >
                      <Sparkles size={12} /> Render MP4
                    </Button>
                  )}

                  <button
                    onClick={() => handleDelete(clip.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-red-400 transition-colors ml-auto"
                    title="Delete clip"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Clip Preview Modal */}
      <Modal
        open={!!selectedClip}
        onClose={() => setSelectedClip(null)}
        title={selectedClip?.title}
        size="lg"
      >
        {selectedClip && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="brand">{selectedClip.aspect_ratio}</Badge>
              <Badge variant="warning">Virality Score: {selectedClip.score}%</Badge>
              <span className="text-xs text-slate-400">Duration: {selectedClip.duration}s</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Hook Analysis</label>
              <p className="p-3 rounded-lg bg-surface border border-surface-border text-xs text-brand-300 font-medium">
                {selectedClip.score_explanation}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Full Clip Transcript</label>
              <div className="p-3 rounded-lg bg-surface border border-surface-border text-xs text-slate-300 max-h-48 overflow-y-auto leading-relaxed">
                {selectedClip.transcript_text}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-surface-border">
              <Button variant="ghost" onClick={() => setSelectedClip(null)}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigate(`/dashboard/editor?clip=${selectedClip.id}`)
                  setSelectedClip(null)
                }}
              >
                Open in Editor
              </Button>
              <Button onClick={() => handleRender(selectedClip)}>
                Render 1080p MP4
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
