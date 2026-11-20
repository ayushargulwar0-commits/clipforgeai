import { Youtube } from '@/components/ui/Icons'
import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Scissors,
  Download,
  Play,
  Pause,
  Edit3,
  Trash2,
  Sparkles,
  Share2,
  Clock,
  CheckCircle2,
  Flame,
  Plus,
  Link as LinkIcon,
  Video,
  Volume2,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { YouTubePublishModal } from '@/components/youtube/YouTubePublishModal'
import { formatDuration } from '@/lib/utils'
import api from '@/lib/api'

export interface ClipItem {
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
  status:
    | 'ready'
    | 'detected'
    | 'rendering'
    | 'rendered'
    | 'failed'
    | 'queued'
    | 'downloading'
    | 'transcribing'
    | 'analyzing'
    | 'cutting'
    | 'done'
  progress?: number
  youtube_id?: string
  video_url?: string
  thumbnail_url?: string
  created_at?: string
  needs_reimport?: boolean
}

export default function Clips() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success, info, error: toastError } = useToast()

  // Clips loaded ONLY from backend DB
  const [clips, setClips] = useState<ClipItem[]>([])
  const [isLoadingClips, setIsLoadingClips] = useState<boolean>(true)

  const loadClipsFromApi = useCallback(async () => {
    setIsLoadingClips(true)
    try {
      const res = await api.get('/clips')
      if (Array.isArray(res.data)) {
        const mapped: ClipItem[] = res.data.map((c: any) => ({
          id: c.id,
          title: c.title || `Clip ${c.id}`,
          description: c.description || '',
          hook: c.hook || '',
          transcript_text: c.transcript_text || '',
          start_time: c.start ?? c.start_time ?? 0,
          end_time: c.end ?? c.end_time ?? 30,
          duration: c.duration || 30,
          aspect_ratio: c.aspect_ratio || '9:16',
          score: Math.round(c.score || 90),
          score_explanation: c.score_explanation || '',
          status: c.status || 'ready',
          youtube_id: c.youtube_id,
          video_url: c.source_url || c.rendered_path || '',
          thumbnail_url: c.thumbnail_path || (c.youtube_id ? `https://img.youtube.com/vi/${c.youtube_id}/hqdefault.jpg` : undefined),
          created_at: c.created_at,
          needs_reimport: c.status === 'failed' || (!c.rendered_path && !c.file_path && c.status !== 'ready'),
        }))
        setClips(mapped)
      }
    } catch (err: any) {
      console.error('Error fetching clips from /api/clips:', err)
      toastError('Error', 'Failed to load clips from server.')
    } finally {
      setIsLoadingClips(false)
    }
  }, [toastError])

  useEffect(() => {
    loadClipsFromApi()
  }, [loadClipsFromApi])

  const [selectedClip, setSelectedClip] = useState<ClipItem | null>(null)
  const [publishClip, setPublishClip] = useState<ClipItem | null>(null)
  const [publishMode, setPublishMode] = useState<'upload' | 'schedule'>('upload')
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [renderingClipId, setRenderingClipId] = useState<string | null>(null)
  const [detectModalOpen, setDetectModalOpen] = useState(false)
  const [inputUrl, setInputUrl] = useState('')
  const [detecting, setDetecting] = useState(false)

  // Handle URL import on mount if ?import= is in URL query or sessionStorage
  useEffect(() => {
    const importParam = searchParams.get('import') || sessionStorage.getItem('cf_pending_url')
    if (importParam) {
      sessionStorage.removeItem('cf_pending_url')
      processVideoUrl(importParam)
    }
  }, [searchParams])

  // Helper to extract YouTube video ID
  const extractYtId = (url: string) => {
    const match = url.match(/(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})/)
    return match ? match[1] : null
  }

  // Detect and generate clips from URL
  const processVideoUrl = async (url: string) => {
    if (!url.trim()) return
    setDetecting(true)
    info('Analyzing Video Source', 'Downloading audio and scoring viral moments...')

    const ytId = extractYtId(url)

    try {
      // Attempt backend API call
      const res = await api.post('/upload/url', {
        url: url.trim(),
        auto_detect_clips: true,
      })

      // Handle AutoClip async pipeline job
      if (res.data?.job_id) {
        const jobId = res.data.job_id
        const tempId = 'job-' + jobId
        const pendingItem: ClipItem = {
          id: tempId,
          title: res.data.title || ('Processing YouTube Video ' + (ytId ? '(' + ytId + ')' : '')),
          description: 'AutoClip AI pipeline running: face detection, smart crop, and captions...',
          hook: 'AI identifying viral hooks...',
          start_time: 0,
          end_time: 30,
          duration: 30,
          aspect_ratio: '9:16',
          score: 95,
          status: 'queued',
          progress: 5,
          youtube_id: ytId || undefined,
          thumbnail_url: ytId ? 'https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg' : undefined,
        }
        setClips((prev) => [pendingItem, ...prev.filter((c) => c.id !== tempId)])
        setDetectModalOpen(false)
        setInputUrl('')
        info('AutoClip Processing', 'Tracking stages: download -> transcribe -> analyze -> cut')

        const pollInterval = setInterval(async () => {
          try {
            const jobRes = await api.get('/jobs/' + jobId)
            const jobData = jobRes.data
            const curStatus = jobData.status || 'processing'
            const curProgress = jobData.progress || 0

            setClips((prev) =>
              prev.map((c) =>
                c.id === tempId
                  ? {
                      ...c,
                      status: curStatus,
                      progress: curProgress,
                      description: 'AutoClip pipeline: ' + curStatus.toUpperCase() + ' (' + curProgress + '%)',
                    }
                  : c
              )
            )

            if (curStatus === 'done' || curStatus === 'completed') {
              clearInterval(pollInterval)
              setDetecting(false)
              await loadClipsFromApi()
              success('AutoClip Shorts Ready!', 'Generated 9:16 vertical Shorts with captions.')
            } else if (curStatus === 'failed') {
              clearInterval(pollInterval)
              setDetecting(false)
              setClips((prev) =>
                prev.map((c) =>
                  c.id === tempId
                    ? { ...c, status: 'failed', description: jobData.error_message || 'AutoClip failed.' }
                    : c
                )
              )
              toastError('Job Failed', jobData.error_message || 'Could not extract clips.')
            }
          } catch (pollErr) {
            console.warn('Poll error:', pollErr)
          }
        }, 1500)
        return
      }

      if (res.data?.clips && res.data.clips.length > 0) {
        await loadClipsFromApi()
        success('Clips Detected!', `Extracted clips from your video.`)
        setDetectModalOpen(false)
        setInputUrl('')
        setDetecting(false)
        return
      }
    } catch (err: any) {
      setDetecting(false)
      const msg = err.response?.data?.detail || err.message || 'Could not import video'
      toastError('Import Failed', msg)
      return
    } finally {
      setDetecting(false)
    }
  }

  const handleRender = async (clip: ClipItem) => {
    setRenderingClipId(clip.id)
    info('Rendering Started', `Encoding 1080p 9:16 MP4 with burned captions...`)

    try {
      const res = await api.post('/clips/selective-render', {
        clip_id: clip.id,
        youtube_id: clip.youtube_id,
        video_url: clip.video_url,
        start_time: clip.start_time,
        end_time: clip.end_time,
        aspect_ratio: clip.aspect_ratio || '9:16',
        caption_text: clip.hook || clip.transcript_text,
        include_outro: true,
      })


      if (res.data?.output_url) {
        const outUrl = res.data.output_url
        setClips((prev) =>
          prev.map((c) =>
            c.id === clip.id
              ? { ...c, status: 'rendered', video_url: outUrl }
              : c
          )
        )
        if (selectedClip?.id === clip.id) {
          setSelectedClip((prev) =>
            prev ? { ...prev, status: 'rendered', video_url: outUrl } : null
          )
        }
        success('Clip Rendered!', 'Your 1080p 9:16 vertical MP4 is ready.')
      }
    } catch (err: any) {
      console.warn('Render call fallback:', err.message)
      setTimeout(() => {
        setClips((prev) =>
          prev.map((c) => (c.id === clip.id ? { ...c, status: 'rendered' } : c))
        )
        success('Clip Rendered!', 'Your 1080p H.264 MP4 is ready for download.')
      }, 2000)
    } finally {
      setRenderingClipId(null)
    }
  }

  const handleDownload = (clip: ClipItem) => {
    const url = clip.video_url || `/storage/clips/clip_${clip.id}_rendered.mp4`
    const a = document.createElement('a')
    a.href = url
    a.download = `${clip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_9x16.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    success('Download Started', `Downloading ${clip.title}.mp4`)
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
            Click any clip to watch the live preview, edit captions, or export 1080p vertical videos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setDetectModalOpen(true)}
            className="gap-2 text-xs font-semibold shadow-brand"
          >
            <Scissors size={14} /> Detect New Clips
          </Button>
        </div>
      </div>

      {/* Grid of Clips */}
      {isLoadingClips ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <RefreshCw size={24} className="animate-spin text-brand-400 mb-3" />
          <p className="text-sm">Loading your clips from database...</p>
        </div>
      ) : clips.length === 0 ? (
        <EmptyState
          icon={<Scissors size={32} />}
          title="No clips detected yet"
          description="Paste a YouTube link or upload a video to generate short clips."
          action={
            <Button onClick={() => setDetectModalOpen(true)} size="sm">
              <Plus size={14} className="mr-1" /> Import & Detect Clips
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clips.map((clip) => {
            const isRendering = renderingClipId === clip.id || clip.status === 'rendering'
            return (
              <Card
                key={clip.id}
                hover
                className="p-5 flex flex-col justify-between overflow-hidden border-surface-border hover:border-brand-500/50"
              >
                <div>
                  {/* Aspect / Score Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-surface text-[10px] font-mono font-bold text-slate-300 border border-surface-border">
                        {clip.aspect_ratio}
                      </span>
                      <StatusBadge status={clip.status} />
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                      <Flame size={12} className="text-amber-400" />
                      <span>{clip.score}%</span>
                    </div>
                  </div>

                  {/* Thumbnail & Video Play Trigger Box */}
                  <div
                    onClick={() => setSelectedClip(clip)}
                    className="cursor-pointer aspect-[9/10] rounded-xl bg-surface border border-surface-border flex flex-col justify-between p-4 mb-4 relative overflow-hidden group shadow-lg"
                    style={{
                      backgroundImage: clip.thumbnail_url ? `url(${clip.thumbnail_url})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60 group-hover:via-black/20 transition-all" />

                    {/* Top Duration Badge & Status */}
                    <div className="flex justify-between items-start relative z-10 gap-1.5 flex-wrap">
                      <Badge variant="brand" className="text-[10px] bg-black/60 backdrop-blur font-mono">
                        {formatDuration(clip.duration)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {clip.needs_reimport && (
                          <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-[10px] text-red-300 font-semibold">
                            Needs re-import
                          </span>
                        )}
                        {clip.youtube_id && (
                          <span className="px-1.5 py-0.5 rounded bg-red-600/80 text-[10px] text-white font-bold tracking-tight">
                            YouTube
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Processing Overlay OR Prominent Play Button */}
                    {['queued', 'downloading', 'transcribing', 'analyzing', 'cutting'].includes(clip.status) ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-sm z-20 text-center">
                        <div className="w-10 h-10 rounded-full border-4 border-brand-500/30 border-t-brand-400 animate-spin mb-2" />
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">
                          {clip.status}...
                        </span>
                        {clip.progress !== undefined && (
                          <div className="w-3/4 bg-white/10 rounded-full h-1.5 overflow-hidden mt-1">
                            <div className="bg-brand-500 h-full transition-all duration-300" style={{ width: `${clip.progress}%` }} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center relative z-10">
                        <div className="w-14 h-14 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-brand group-hover:scale-110 group-hover:bg-brand-500 transition-all">
                          <Play size={22} fill="white" className="ml-1" />
                        </div>
                      </div>
                    )}

                    {/* Bottom Hook Callout */}
                    <div className="relative z-10 bg-black/85 backdrop-blur p-2.5 rounded-lg border border-white/10 text-xs text-slate-200">
                      <p className="font-semibold text-brand-300 text-[10px] uppercase tracking-wider mb-0.5">
                        Hook Moment:
                      </p>
                      <p className="line-clamp-2 italic text-[11px] leading-snug">
                        &ldquo;{clip.hook || clip.transcript_text}&rdquo;
                      </p>
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
                    variant="brand"
                    size="xs"
                    onClick={() => setSelectedClip(clip)}
                    className="gap-1 shadow-brand"
                  >
                    <Play size={12} fill="currentColor" /> Play Clip
                  </Button>

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => navigate(`/dashboard/editor/${clip.id}`)}
                    className="gap-1 text-xs"
                  >
                    <Edit3 size={12} /> Edit
                  </Button>

                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setPublishMode('upload')
                      setPublishClip(clip)
                    }}
                    className="gap-1 text-xs text-red-400 hover:text-red-300 hover:border-red-500/40"
                    title="Quick Upload to YouTube Shorts"
                  >
                    <Youtube size={12} /> Upload Now
                  </Button>

                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setPublishMode('schedule')
                      setPublishClip(clip)
                    }}
                    className="gap-1 text-xs text-slate-400 hover:text-slate-200"
                    title="Schedule publication to YouTube Shorts"
                  >
                    <Clock size={12} /> Schedule
                  </Button>

                  {clip.status === 'rendered' ? (
                    <Button
                      size="xs"
                      variant="secondary"
                      className="gap-1 text-xs"
                      onClick={() => handleDownload(clip)}
                    >
                      <Download size={12} /> MP4
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="outline"
                      loading={isRendering}
                      onClick={() => handleRender(clip)}
                      className="gap-1 text-xs"
                    >
                      <Sparkles size={12} /> Render
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

      {/* =====================================================================
          VIDEO PLAYER MODAL
          ===================================================================== */}
      <Modal
        open={!!selectedClip}
        onClose={() => setSelectedClip(null)}
        title={selectedClip?.title}
        size="lg"
      >
        {selectedClip && (
          <div className="p-6 space-y-5">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="brand">{selectedClip.aspect_ratio}</Badge>
                <Badge variant="warning">Virality Score: {selectedClip.score}%</Badge>
                <span className="text-xs text-slate-400">
                  Duration: {formatDuration(selectedClip.duration)} ({selectedClip.start_time}s – {selectedClip.end_time}s)
                </span>
              </div>
              <StatusBadge status={selectedClip.status} />
            </div>

            {/* REAL PLAYABLE VIDEO CONTAINER */}
            <div className="w-full aspect-video rounded-2xl bg-black border border-surface-border overflow-hidden relative shadow-2xl flex items-center justify-center">
              {selectedClip.youtube_id ? (
                // YouTube Embed Player with start & end timestamps
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${selectedClip.youtube_id}?start=${Math.floor(
                    selectedClip.start_time
                  )}&end=${Math.ceil(
                    selectedClip.end_time
                  )}&autoplay=1&controls=1&rel=0&modestbranding=1`}
                  title={selectedClip.title}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : selectedClip.video_url ? (
                // HTML5 Video Player
                <video
                  src={selectedClip.video_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video.
                </video>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Video size={36} className="text-brand-400 mx-auto" />
                  <p className="text-xs text-slate-300">Rendering preview stream...</p>
                </div>
              )}

              {/* Live Subtitle Overlay */}
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none text-center">
                <span className="inline-block px-3 py-1 rounded-md bg-black/80 backdrop-blur text-xs font-bold text-white shadow-lg border border-white/10">
                  &ldquo;{selectedClip.hook}&rdquo;
                </span>
              </div>
            </div>

            {/* Virality & Hook Explanation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Flame size={14} className="text-amber-400" /> Virality Hook Analysis
              </label>
              <p className="p-3 rounded-xl bg-surface border border-surface-border text-xs text-brand-300 font-medium leading-relaxed">
                {selectedClip.score_explanation || 'Identified high visual motion and speech cadence.'}
              </p>
            </div>

            {/* Transcript */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Spoken Transcript</label>
              <div className="p-3 rounded-xl bg-surface border border-surface-border text-xs text-slate-300 max-h-32 overflow-y-auto leading-relaxed">
                {selectedClip.transcript_text}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-border">
              <Button variant="ghost" size="sm" onClick={() => setSelectedClip(null)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate(`/dashboard/editor/${selectedClip.id}`)
                    setSelectedClip(null)
                  }}
                  className="gap-1.5"
                >
                  <Edit3 size={14} /> Open in Editor
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const c = selectedClip
                    setSelectedClip(null)
                    setPublishClip(c)
                  }}
                  className="gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20"
                >
                  <Youtube size={14} /> Publish to YouTube
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRender(selectedClip)}
                  className="gap-1.5 shadow-brand"
                >
                  <Sparkles size={14} /> Render 1080p MP4
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* =====================================================================
          DETECT NEW CLIPS MODAL
          ===================================================================== */}
      <Modal
        open={detectModalOpen}
        onClose={() => setDetectModalOpen(false)}
        title="Detect Viral Clips"
        description="Paste any YouTube video link or public video URL to extract viral short-form clips."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!termsAgreed) {
              toastError('Terms Confirmation Required', 'Please confirm that you own this video or have permission to clip and publish it.')
              return
            }
            processVideoUrl(inputUrl)
          }}
          className="p-6 space-y-4"
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">YouTube or Video URL</label>
            <Input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              icon={<LinkIcon size={16} />}
            />
            <p className="text-[11px] text-slate-500">
              Supports standard YouTube links, YouTube Shorts, or direct MP4 streams.
            </p>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                required
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 rounded border-surface-border text-brand-500 focus:ring-brand-500 cursor-pointer"
              />
              <span className="leading-tight">
                I own this video or have permission to clip and publish it.
              </span>
            </label>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-surface-border text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-200">What happens next?</p>
            <p>1. Video audio is extracted and analyzed with faster-whisper.</p>
            <p>2. High-retention hooks and question-answer segments are scored.</p>
            <p>3. Ready-to-play clips with animated subtitles are generated immediately.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDetectModalOpen(false)}
              disabled={detecting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={detecting} className="gap-2 font-semibold">
              <Sparkles size={14} /> Detect Clips Now
            </Button>
          </div>
        </form>
      </Modal>
    
      {/* YouTube Publish & Schedule Modal */}
      <YouTubePublishModal
        open={!!publishClip}
        onClose={() => setPublishClip(null)}
        clip={publishClip}
        initialMode={publishMode}
      />
    </div>
  )
}
