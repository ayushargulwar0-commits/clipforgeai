import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { useYouTubeStore } from '@/store/youtubeStore'
import { Youtube } from '@/components/ui/Icons'
import { YouTubeConnectModal } from '@/components/youtube/YouTubeConnectModal'
import {
  Calendar,
  Send,
  Clock,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Lock,
  Globe,
  EyeOff,
  UserCheck,
  AlertCircle,
  LogOut,
} from 'lucide-react'

interface YouTubePublishModalProps {
  open: boolean
  onClose: () => void
  clip: {
    id: string
    title: string
    description?: string
    hook?: string
    duration?: number
    transcript_text?: string
  } | null
}

export function YouTubePublishModal({ open, onClose, clip }: YouTubePublishModalProps) {
  const { success, error: toastError } = useToast()
  const { channel, uploadNow, scheduleUpload, disconnectAccount, loading } = useYouTubeStore()

  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [mode, setMode] = useState<'upload' | 'schedule'>('upload')
  const [title, setTitle] = useState(
    clip ? `${clip.title.slice(0, 70)} #Shorts` : 'Viral Moment #Shorts'
  )
  const [description, setDescription] = useState(
    clip
      ? `${clip.hook || clip.transcript_text || clip.title}\n\n✂️ Created with ClipForge AI (https://clipforgeai.online)\n#shorts #viral #clipforge`
      : 'Created with ClipForge AI (https://clipforgeai.online)\n#shorts #viral'
  )
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public')
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [scheduleTime, setScheduleTime] = useState('18:00')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [publishedResult, setPublishedResult] = useState<{
    url: string
    studioUrl: string
    title: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clip) return

    if (!channel.connected) {
      setConnectModalOpen(true)
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'upload') {
        const res = await uploadNow({
          clipId: clip.id,
          title,
          description,
          privacy,
        })
        if (res.success) {
          setPublishedResult({
            url: res.youtube_url || 'https://studio.youtube.com',
            studioUrl: res.studio_url || 'https://studio.youtube.com',
            title,
          })
          success('Published to YouTube!', 'Your short-form video was queued and sent to your YouTube Studio.')
        }
      } else {
        const scheduledDateTime = `${scheduleDate}T${scheduleTime}:00`
        const res = await scheduleUpload({
          clipId: clip.id,
          title,
          description,
          privacy,
          scheduledAt: scheduledDateTime,
        })
        if (res.success) {
          success('Scheduled on YouTube!', `Clip will be published on ${scheduleDate} at ${scheduleTime}.`)
          onClose()
        }
      }
    } catch (err: any) {
      toastError('Upload Failed', err?.message || 'Could not process YouTube publication.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="YouTube Shorts Publishing & Scheduling"
        description="Directly publish or schedule your AI clips to your YouTube channel."
        size="lg"
      >
        <div className="p-6 space-y-6">
          {/* SUCCESS BANNER WHEN PUBLISHED */}
          {publishedResult ? (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-surface to-surface border border-emerald-500/40 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Clip Sent to YouTube Studio!</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                  &ldquo;{publishedResult.title}&rdquo; is queued in your YouTube Studio upload stream.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={publishedResult.studioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-600/30"
                >
                  <Youtube size={16} /> Open YouTube Studio <ExternalLink size={12} />
                </a>
                <a
                  href={publishedResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-white text-xs font-semibold transition"
                >
                  View Channel <ExternalLink size={12} />
                </a>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* CHANNEL STATUS CARD */}
              <div className="p-4 rounded-xl bg-surface border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                    <Youtube size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {channel.connected
                          ? channel.channelName
                          : 'Connect YouTube Channel'}
                      </span>
                      {channel.connected ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Sign In Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {channel.connected
                        ? `${channel.channelEmail || channel.channelHandle || 'Verified Account'} • Ready for 1-click publishing`
                        : 'Sign in with your YouTube account to upload directly'}
                    </p>
                  </div>
                </div>

                {!channel.connected ? (
                  <Button
                    size="xs"
                    onClick={() => setConnectModalOpen(true)}
                    loading={loading}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold gap-1.5 shrink-0 shadow-lg shadow-red-600/20"
                  >
                    <Youtube size={14} /> Sign In & Link Channel
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="brand" className="text-xs font-mono">
                      Shorts Ready
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={async () => {
                        await disconnectAccount()
                        success('Logged Out', 'Disconnected from YouTube channel.')
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1 text-xs"
                      title="Log out and disconnect YouTube account"
                    >
                      <LogOut size={12} /> Log Out
                    </Button>
                  </div>
                )}
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ACTION MODE SELECTOR: UPLOAD NOW vs SCHEDULE */}
                <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-surface-card border border-surface-border">
                  <button
                    type="button"
                    onClick={() => setMode('upload')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      mode === 'upload'
                        ? 'bg-brand-600 text-white shadow-brand'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Send size={14} /> Upload Immediately
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('schedule')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      mode === 'schedule'
                        ? 'bg-brand-600 text-white shadow-brand'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Calendar size={14} /> Schedule for Later
                  </button>
                </div>

                {/* TITLE */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Short Title (Hook + Tags)
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. The Truth About Startups #Shorts"
                    required
                    maxLength={100}
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>Aim for under 70 characters for mobile display</span>
                    <span>{title.length}/100</span>
                  </div>
                </div>

                {/* DESCRIPTION & HASHTAGS */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Description & Attribution
                  </label>
                  <TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Enter video description and viral hashtags..."
                  />
                </div>

                {/* PRIVACY SELECTOR */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Visibility
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'public', label: 'Public', icon: Globe, desc: 'Anyone can watch' },
                      { id: 'unlisted', label: 'Unlisted', icon: EyeOff, desc: 'Only with link' },
                      { id: 'private', label: 'Private', icon: Lock, desc: 'Only you' },
                    ].map((p) => {
                      const Icon = p.icon
                      const isSelected = privacy === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPrivacy(p.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-brand-500 bg-brand-600/15 text-white'
                              : 'border-surface-border text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-0.5">
                            <Icon size={12} className={isSelected ? 'text-brand-400' : 'text-slate-400'} />
                            {p.label}
                          </div>
                          <p className="text-[10px] text-slate-400">{p.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* SCHEDULE DATE & TIME (IF SCHEDULE MODE) */}
                {mode === 'schedule' && (
                  <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Clock size={14} className="text-brand-400" /> Auto-Publish Timing
                      </span>
                      <span className="text-[10px] text-brand-300 bg-brand-600/20 px-2 py-0.5 rounded border border-brand-500/30 font-semibold">
                        ⚡ Peak Engagement
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Release Date</label>
                        <Input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Time (Local)</label>
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ClipForge AI will automatically queue the video in your YouTube Studio at your scheduled time.
                    </p>
                  </div>
                )}

                {/* BOTTOM ACTIONS */}
                <div className="flex items-center justify-between pt-4 border-t border-surface-border">
                  <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    size="sm"
                    loading={isSubmitting}
                    className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold shadow-lg shadow-red-600/25"
                  >
                    <Youtube size={16} />
                    {!channel.connected
                      ? 'Sign In to YouTube & Publish'
                      : mode === 'upload'
                      ? 'Upload to YouTube Shorts'
                      : 'Set YouTube Schedule'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </Modal>

      {/* Interactive Google Sign-In & YouTube Account Authorization Modal */}
      <YouTubeConnectModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
      />
    </>
  )
}
