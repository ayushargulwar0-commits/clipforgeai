import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, TextArea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useYouTubeStore } from '@/store/youtubeStore'
import { YouTubePublishModal } from '@/components/youtube/YouTubePublishModal'
import { YouTubeConnectModal } from '@/components/youtube/YouTubeConnectModal'
import { Youtube } from '@/components/ui/Icons'
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Video,
  Share2,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  ExternalLink,
  Layers,
  Radio,
  LogOut,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

interface ScheduledItem {
  id: string
  clip_id?: string
  file_path?: string
  title: string
  platform: 'instagram' | 'tiktok' | 'youtube'
  date: string
  time: string
  status: 'draft' | 'scheduled' | 'uploading' | 'published' | 'failed'
  caption: string
  youtube_url?: string
  error?: string | null
}

const INITIAL_SCHEDULE: ScheduledItem[] = [
  {
    id: 's-1',
    clip_id: 'clip_test_render_rendered',
    title: 'The Hardest Truth About Scaling past $10M #Shorts',
    platform: 'youtube',
    date: '2026-11-04',
    time: '18:00',
    status: 'scheduled',
    caption: 'Why scaling past $10M breaks everything you built. Auto-clipped by ClipForge AI. #shorts #founder #growth',
    youtube_url: 'https://studio.youtube.com',
  },
  {
    id: 's-2',
    clip_id: 'clip_test_render_rendered',
    title: 'Microservices vs Monolith debate',
    platform: 'youtube',
    date: '2026-11-05',
    time: '12:00',
    status: 'scheduled',
    caption: 'Stop over-engineering before product-market fit. Full breakdown in this Short.',
    youtube_url: 'https://studio.youtube.com',
  },
  {
    id: 's-3',
    clip_id: 'clip_test_render_rendered',
    title: '3-Second Retention Framework',
    platform: 'tiktok',
    date: '2026-11-03',
    time: '19:30',
    status: 'published',
    caption: 'How we scaled our organic TikTok and Reels reach without ad spend.',
  },
]

export default function Scheduler() {
  const { success, error: toastError, info } = useToast()
  const {
    channel,
    scheduledList,
    uploadNow,
    scheduleUpload,
    disconnectAccount,
    fetchScheduled,
    runSchedulerNow,
    loading: ytLoading,
  } = useYouTubeStore()

  const [items, setItems] = useState<ScheduledItem[]>(INITIAL_SCHEDULE)
  const [modalOpen, setModalOpen] = useState(false)
  const [ytModalOpen, setYtModalOpen] = useState(false)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [isCheckingScheduler, setIsCheckingScheduler] = useState(false)

  const [title, setTitle] = useState('')
  const [selectedClipId, setSelectedClipId] = useState('clip_test_render_rendered')
  const [platform, setPlatform] = useState<'instagram' | 'tiktok' | 'youtube'>('youtube')
  const [date, setDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [time, setTime] = useState(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() + 5)
    return d.toTimeString().slice(0, 5)
  })
  const [caption, setCaption] = useState('')

  // Available clips from local storage
  const [availableClips, setAvailableClips] = useState<{ id: string; title: string }[]>([
    { id: 'clip_test_render_rendered', title: '1080p Rendered 9:16 Short (Ready on server)' },
    { id: 'clip_yt-clip-1793646981407-1_rendered', title: 'Viral AI Extracted Highlight #1' },
    { id: 'outro_clipforge_9x16', title: 'ClipForge Outro Reel (1080x1920)' },
  ])

  // Load clips from user storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cf_user_clips')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userClips = parsed.map((c: any) => ({
            id: c.id,
            title: c.title || `Clip #${c.id}`,
          }))
          setAvailableClips((prev) => [...userClips, ...prev])
        }
      }
    } catch (_) {}
  }, [])

  // Poll scheduled list on mount and periodically every 20 seconds
  useEffect(() => {
    fetchScheduled()
    const timer = setInterval(() => {
      fetchScheduled()
    }, 20000)
    return () => clearInterval(timer)
  }, [fetchScheduled])

  // Sync scheduledList from backend store
  useEffect(() => {
    if (scheduledList && scheduledList.length > 0) {
      const mapped: ScheduledItem[] = scheduledList.map((s) => ({
        id: s.id,
        clip_id: s.clip_id || 'clip_test_render_rendered',
        title: s.title,
        platform: 'youtube',
        date: s.scheduled_at.split('T')[0],
        time: s.scheduled_at.split('T')[1]?.slice(0, 5) || '18:00',
        status: (s.status as any) || 'scheduled',
        caption: s.description,
        youtube_url: s.youtube_url || s.studio_url || 'https://studio.youtube.com',
        error: s.error,
      }))

      setItems((prev) => {
        const ids = new Set(mapped.map((m) => m.id))
        const remaining = prev.filter((p) => !ids.has(p.id))
        return [...mapped, ...remaining]
      })
    }
  }, [scheduledList])

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetDateTime = `${date}T${time}:00`

    try {
      await scheduleUpload({
        clipId: selectedClipId,
        title,
        description: caption,
        privacy: 'public',
        scheduledAt: targetDateTime,
      })

      success('Post Scheduled', `Video queued for ${date} at ${time}. The background worker will auto-publish it at that time.`)
      setTitle('')
      setCaption('')
      setModalOpen(false)
    } catch (err: any) {
      toastError('Schedule Failed', err?.message || 'Could not queue post.')
    }
  }

  const handleInstantUpload = async (item: ScheduledItem) => {
    if (!channel.connected) {
      setConnectModalOpen(true)
      return
    }

    setPublishingId(item.id)
    // Mark as uploading immediately
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', error: null } : i))
    )

    try {
      const res = await uploadNow({
        clipId: item.clip_id || 'clip_test_render_rendered',
        title: item.title,
        description: item.caption,
        privacy: 'public',
      })

      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'published', youtube_url: res.youtube_url, error: null }
              : i
          )
        )
        success('Published to YouTube!', `"${item.title}" uploaded! Click "Watch" to view.`)
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Could not push upload to YouTube.'
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'failed', error: errorMsg } : i
        )
      )
      toastError('Upload Failed', errorMsg)
    } finally {
      setPublishingId(null)
    }
  }

  const handleTriggerSchedulerCheck = async () => {
    setIsCheckingScheduler(true)
    try {
      const res = await runSchedulerNow()
      info(
        'Worker Checked',
        res.processed_count > 0
          ? `Uploaded ${res.processed_count} due scheduled post(s)!`
          : 'Scheduler worker checked: No pending posts were due yet.'
      )
    } catch (err: any) {
      toastError('Worker Error', err?.message || 'Could not execute background scheduler.')
    } finally {
      setIsCheckingScheduler(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Content Scheduler & YouTube Auto-Publisher</h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated worker runs every 30 seconds to upload due vertical 9:16 Shorts to YouTube.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerSchedulerCheck}
            loading={isCheckingScheduler}
            className="text-xs gap-1.5 border-surface-border text-slate-300 hover:text-white"
            title="Check and auto-upload any posts scheduled for right now"
          >
            <RefreshCw size={13} className={isCheckingScheduler ? 'animate-spin' : ''} /> Check Due Posts
          </Button>

          <Button
            onClick={() => {
              if (!channel.connected) setConnectModalOpen(true)
              else setYtModalOpen(true)
            }}
            className="gap-2 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/25"
          >
            <Youtube size={16} /> Quick Upload to Shorts
          </Button>

          <Button onClick={() => setModalOpen(true)} variant="outline" className="gap-2 text-xs font-semibold">
            <Plus size={16} /> Schedule Post
          </Button>
        </div>
      </div>

      {/* YOUTUBE CONNECTION STATUS HERO BANNER */}
      <div className="p-5 rounded-2xl bg-surface-card border border-surface-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
            <Youtube size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                {channel.connected ? channel.channelName : 'Direct YouTube Shorts Automation'}
              </h2>
              {channel.connected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={10} /> {channel.channelHandle || 'Connected'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Channel Sign In Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {channel.connected
                ? `Authorized as ${channel.channelEmail || 'Google Account'} • Background worker active.`
                : 'Sign in with your YouTube account to link channel and push AI-generated clips directly to YouTube Shorts.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {channel.connected ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => setYtModalOpen(true)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold gap-1.5 shadow-lg shadow-red-600/20 text-xs"
              >
                <Send size={14} /> Quick Upload to Shorts
              </Button>
              <a
                href="https://studio.youtube.com"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-white text-xs font-semibold flex items-center gap-1 transition"
              >
                YouTube Studio <ExternalLink size={12} />
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await disconnectAccount()
                  success('Logged Out', 'You have been disconnected from YouTube.')
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-surface-border hover:border-red-500/40 text-xs font-semibold gap-1.5"
                title="Log out from your YouTube account"
              >
                <LogOut size={13} /> Log Out
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              loading={ytLoading}
              onClick={() => setConnectModalOpen(true)}
              className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-bold gap-1.5 shadow-lg shadow-red-600/20 text-xs"
            >
              <Youtube size={14} /> Sign In & Connect YouTube Channel
            </Button>
          )}
        </div>
      </div>

      {/* Content Feed / Calendar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="p-5 flex flex-col justify-between border-surface-border hover:border-brand-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                    item.platform === 'youtube'
                      ? 'bg-red-600/15 border-red-500/30 text-red-300'
                      : 'bg-surface border-surface-border text-brand-300'
                  }`}
                >
                  {item.platform === 'youtube' && <Youtube size={12} className="text-red-400" />}
                  {item.platform}
                </span>

                <Badge
                  variant={
                    item.status === 'published'
                      ? 'success'
                      : item.status === 'uploading'
                      ? 'warning'
                      : item.status === 'failed'
                      ? 'danger'
                      : 'brand'
                  }
                  className="capitalize font-mono text-[10px]"
                >
                  {item.status}
                </Badge>
              </div>

              <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-3 mb-3 bg-surface p-2.5 rounded-lg border border-surface-border/50">
                {item.caption}
              </p>

              {/* Exact Error Message Banner if Failed */}
              {item.status === 'failed' && item.error && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] mb-3 flex items-start gap-1.5">
                  <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{item.error}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Clock size={12} /> {item.date} • {item.time}
              </span>

              <div className="flex items-center gap-1.5">
                {item.platform === 'youtube' && item.status === 'published' ? (
                  <a
                    href={
                      item.youtube_url && !item.youtube_url.includes('@')
                        ? item.youtube_url
                        : 'https://studio.youtube.com/channel/videos/shorts'
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 transition shadow"
                  >
                    <Youtube size={12} />{' '}
                    {item.youtube_url && item.youtube_url.includes('/shorts/') && !item.youtube_url.includes('studio')
                      ? 'Watch'
                      : 'Studio'}{' '}
                    <ExternalLink size={10} />
                  </a>
                ) : item.platform === 'youtube' ? (
                  <Button
                    variant="brand"
                    size="xs"
                    loading={publishingId === item.id || item.status === 'uploading'}
                    onClick={() => handleInstantUpload(item)}
                    className="gap-1 text-[11px] bg-red-600 hover:bg-red-500 text-white font-bold"
                  >
                    <Send size={11} /> {item.status === 'failed' ? 'Retry Upload' : 'Upload Now'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => success('Reminder Set', 'Notification alert registered')}
                  >
                    Reminder
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Manual Schedule Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Social Post"
        description="Select video clip, destination platform, date, and draft captions."
      >
        <form onSubmit={handleSchedule} className="p-6 space-y-4">
          <Input
            label="Post Title / Clip Hook"
            placeholder="e.g. Episode 42 Viral Highlight #Shorts"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Select Rendered Video Clip</label>
            <select
              value={selectedClipId}
              onChange={(e) => setSelectedClipId(e.target.value)}
              className="w-full bg-surface border border-surface-border text-xs text-white rounded-xl px-3 py-2.5 focus:border-brand-500 outline-none"
            >
              {availableClips.map((c) => (
                <option key={c.id} value={c.id} className="bg-bg text-white">
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Target Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'youtube', label: 'YouTube Shorts' },
                { id: 'tiktok', label: 'TikTok' },
                { id: 'instagram', label: 'Reels' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id as any)}
                  className={`p-2 rounded-lg text-xs font-semibold border ${
                    platform === p.id
                      ? 'border-brand-500 bg-brand-600/20 text-white'
                      : 'border-surface-border text-slate-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Time (Local)"
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <TextArea
            label="Caption & Hashtags"
            rows={3}
            placeholder="Enter description and tags..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Schedule</Button>
          </div>
        </form>
      </Modal>

      {/* Dedicated YouTube Publish & Schedule Modal (Pre-linked to real 1080p rendered clip) */}
      <YouTubePublishModal
        open={ytModalOpen}
        onClose={() => setYtModalOpen(false)}
        clip={{
          id: 'clip_test_render_rendered',
          title: 'Top AI Viral Moments #Shorts',
          description: 'Auto-cut and formatted with ClipForge AI (https://clipforgeai.online)',
          hook: 'The AI moment that changed everything...',
        }}
      />

      {/* Google Sign In & Channel Authorization Modal */}
      <YouTubeConnectModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onSuccess={() => setYtModalOpen(true)}
      />
    </div>
  )
}
