import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, TextArea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Video,
  Share2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface ScheduledItem {
  id: string
  title: string
  platform: 'instagram' | 'tiktok' | 'youtube'
  date: string
  time: string
  status: 'draft' | 'scheduled' | 'published'
  caption: string
}

const INITIAL_SCHEDULE: ScheduledItem[] = [
  {
    id: 's-1',
    title: 'The Hardest Truth About Scaling',
    platform: 'tiktok',
    date: '2026-11-04',
    time: '18:00',
    status: 'scheduled',
    caption: 'Why scaling past $10M breaks everything you built. #startup #founder #growth',
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
    platform: 'instagram',
    date: '2026-11-03',
    time: '19:30',
    status: 'draft',
    caption: 'How we scaled our organic TikTok and Reels reach without ad spend.',
  },
]

export default function Scheduler() {
  const { success } = useToast()
  const [items, setItems] = useState<ScheduledItem[]>(INITIAL_SCHEDULE)
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState<'instagram' | 'tiktok' | 'youtube'>('tiktok')
  const [date, setDate] = useState('2026-11-06')
  const [time, setTime] = useState('17:00')
  const [caption, setCaption] = useState('')

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
    setItems([...items, newItem])
    success('Post Scheduled', `Video queued for ${date} at ${time}. Reminder set.`)
    setTitle('')
    setCaption('')
    setModalOpen(false)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Content Scheduler</h1>
          <p className="text-xs text-slate-400 mt-1">
            Plan your short-form video releases across TikTok, Instagram Reels, and YouTube Shorts.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 text-xs font-semibold">
          <Plus size={16} /> Schedule Post
        </Button>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex items-start gap-3 text-xs text-slate-300">
        <AlertCircle size={18} className="text-brand-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Platform Publishing Architecture:</span>{' '}
          ClipForge prepares your 1080p video, hook copy, and hashtags. Direct automatic publishing requires connecting official platform OAuth credentials in workspace settings.
        </div>
      </div>

      {/* Content Feed / Calendar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface border border-surface-border text-brand-300">
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
              <Button
                variant="outline"
                size="xs"
                onClick={() => success('Reminder Set', 'Notification alert registered')}
              >
                Reminder
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Schedule Modal */}
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
                { id: 'tiktok', label: 'TikTok' },
                { id: 'instagram', label: 'Reels' },
                { id: 'youtube', label: 'Shorts' },
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
    </div>
  )
}
