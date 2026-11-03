import { Youtube } from '@/components/ui/Icons'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, TextArea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useYouTubeStore } from '@/store/youtubeStore'
import { YouTubePublishModal } from '@/components/youtube/YouTubePublishModal'
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
} from 'lucide-react'

interface ScheduledItem {
  id: string
  title: string
  platform: 'instagram' | 'tiktok' | 'youtube'
  date: string
  time: string
  status: 'draft' | 'scheduled' | 'published'
  caption: string
  youtube_url?: string
}

const INITIAL_SCHEDULE: ScheduledItem[] = [
  {
    id: 's-1',
    title: 'The Hardest Truth About Scaling past $10M #Shorts',
    platform: 'youtube',
    date: '2026-11-04',
    time: '18:00',
    status: 'scheduled',
    caption: 'Why scaling past $10M breaks everything you built. Auto-clipped by ClipForge AI. #shorts #founder #growth',
  },
  {
    id: 's-2',
    title: 'Microservices vs Monolith debate',
    platform: 'youtube',
    date: '2026-11-05',
    time: '12:00',
    status: 'scheduled',
    caption: 'Stop over-engineering before product-market fit. Full breakdown in this Short.',
  },
  {
    id: 's-3',
    title: '3-Second Retention Framework',
    platform: 'tiktok',
    date: '2026-11-03',
    time: '19:30',
    status: 'published',
    caption: 'How we scaled our organic TikTok and Reels reach without ad spend.',
  },
]

export default function Scheduler() {
  const { success, error: toastError } = useToast()
  const { channel, connectAccount, scheduledList, uploadNow, loading: ytLoading } = useYouTubeStore()

  const [items, setItems] = useState<ScheduledItem[]>(INITIAL_SCHEDULE)
  const [modalOpen, setModalOpen] = useState(false)
  const [ytModalOpen, setYtModalOpen] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState<'instagram' | 'tiktok' | 'youtube'>('youtube')
  const [date, setDate] = useState('2026-11-06')
  const [time, setTime] = useState('18:00')
  const [caption, setCaption] = useState('')

  // Sync YouTube store scheduled uploads
  useEffect(() => {
    if (scheduledList && scheduledList.length > 0) {
      const mapped: ScheduledItem[] = scheduledList.map((s) => ({
        id: s.id,
        title: s.title,
        platform: 'youtube',
        date: s.scheduled_at.split('T')[0],
        time: s.scheduled_at.split('T')[1]?.slice(0, 5) || '18:00',
        status: (s.status as any) || 'scheduled',
        caption: s.description,
        youtube_url: s.youtube_url,
      }))
      // Merge unique
      setItems((prev) => {
        const ids = new Set(prev.map((p) => p.id))
        const added = mapped.filter((m) => !ids.has(m.id))
        return [...added, ...prev]
      })
    }
  }, [scheduledList])

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    const newItem: ScheduledItem = {
      id: 's-' + Date.now(),
      title,
      platform,
      date,
      time,
      status: 'scheduled',
      caption,
    }
    setItems([newItem, ...items])
    success('Post Scheduled', `Video queued for ${date} at ${time} on ${platform.toUpperCase()}.`)
    setTitle('')
    setCaption('')
    setModalOpen(false)
  }

  const handleInstantUpload = async (item: ScheduledItem) => {
    if (!channel.connected) {
      toastError('YouTube Required', 'Please link your YouTube channel first.')
      return
    }
    setPublishingId(item.id)
    try {
      const res = await uploadNow({
        clipId: item.id,
        title: item.title,
        description: item.caption,
        privacy: 'public',
      })
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'published', youtube_url: res.youtube_url } : i
          )
        )
        success('Published to YouTube!', `"${item.title}" is now uploaded as a YouTube Short!`)
      }
    } catch (err: any) {
      toastError('Upload Failed', err?.message || 'Could not push upload to YouTube.')
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Content Scheduler & YouTube Auto-Publisher</h1>
          <p className="text-xs text-slate-400 mt-1">
            Schedule releases or directly auto-publish AI-generated short videos to YouTube Shorts, TikTok, and Instagram.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setYtModalOpen(true)}
            className="gap-2 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/25"
          >
            <Youtube size={16} /> YouTube Auto-Publisher
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
                  <CheckCircle2 size={10} /> Connected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Channel Disconnected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {channel.connected
                ? `${channel.subscriberCount || 'Official Creator Account'} • Direct 1-Click Upload & Scheduling active.`
                : 'Connect your YouTube channel to push clips directly to YouTube Shorts or queue them for optimal release windows.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {channel.connected ? (
            <Button
              size="sm"
              onClick={() => setYtModalOpen(true)}
              className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-bold gap-1.5 shadow-lg shadow-red-600/20 text-xs"
            >
              <Send size={14} /> Quick Upload to Shorts
            </Button>
          ) : (
            <Button
              size="sm"
              loading={ytLoading}
              onClick={async () => {
                await connectAccount()
                success('YouTube Connected', 'Account linked! You can now publish directly.')
              }}
              className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-bold gap-1.5 shadow-lg shadow-red-600/20 text-xs"
            >
              <Youtube size={14} /> Connect YouTube Channel
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
                <Badge variant={item.status === 'published' ? 'success' : 'brand'}>
                  {item.status}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-3 mb-4 bg-surface p-2.5 rounded-lg border border-surface-border/50">
                {item.caption}
              </p>
            </div>

            <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock size={12} /> {item.date} • {item.time}
              </span>

              <div className="flex items-center gap-1.5">
                {item.youtube_url ? (
                  <a
                    href={item.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 transition"
                  >
                    <Youtube size={12} /> Watch <ExternalLink size={10} />
                  </a>
                ) : item.platform === 'youtube' && item.status !== 'published' ? (
                  <Button
                    variant="brand"
                    size="xs"
                    loading={publishingId === item.id}
                    onClick={() => handleInstantUpload(item)}
                    className="gap-1 text-[11px] bg-red-600 hover:bg-red-500 text-white font-bold"
                  >
                    <Send size={11} /> Upload Now
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
        description="Select video, destination platform, date, and draft captions."
      >
        <form onSubmit={handleSchedule} className="p-6 space-y-4">
          <Input
            label="Post Title / Clip"
            placeholder="e.g. Episode 42 Viral Highlight"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

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
              label="Time"
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

      {/* Dedicated YouTube Publish & Schedule Modal */}
      <YouTubePublishModal
        open={ytModalOpen}
        onClose={() => setYtModalOpen(false)}
        clip={{
          id: 'clip-direct-1',
          title: 'Top AI Viral Moments #Shorts',
          description: 'Auto-cut and formatted with ClipForge AI (https://clipforgeai.online)',
          hook: 'The AI moment that changed everything...',
        }}
      />
    </div>
  )
}
