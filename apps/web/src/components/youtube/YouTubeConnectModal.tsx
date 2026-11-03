import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useYouTubeStore } from '@/store/youtubeStore'
import { Youtube } from '@/components/ui/Icons'
import {
  CheckCircle2,
  ShieldCheck,
  Lock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react'

interface YouTubeConnectModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function YouTubeConnectModal({ open, onClose, onSuccess }: YouTubeConnectModalProps) {
  const { user, isOwner } = useAuth()
  const { success, error: toastError } = useToast()
  const { connectAccount } = useYouTubeStore()

  const defaultEmail = user?.email || (isOwner ? 'ayushargulwar0@gmail.com' : 'creator@example.com')
  const defaultName = isOwner ? 'Ayush Argulwar' : 'My YouTube Channel'

  const [step, setStep] = useState<'form' | 'authorizing' | 'success'>('form')
  const [channelEmail, setChannelEmail] = useState(defaultEmail)
  const [channelName, setChannelName] = useState(defaultName)
  const [channelHandle, setChannelHandle] = useState('@' + defaultName.toLowerCase().replace(/\s+/g, ''))

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!channelEmail || !channelName) {
      toastError('Missing Details', 'Please enter your channel name and email.')
      return
    }

    setStep('authorizing')

    // Simulate real OAuth authorization handshake delay
    setTimeout(async () => {
      try {
        await connectAccount({
          channelName,
          channelEmail,
          channelHandle,
        })
        setStep('success')
        success('YouTube Channel Connected!', `"${channelName}" has been authorized for automatic uploads.`)
        setTimeout(() => {
          setStep('form')
          onClose()
          if (onSuccess) onSuccess()
        }, 1500)
      } catch (err: any) {
        setStep('form')
        toastError('Authorization Failed', err?.message || 'Could not authorize YouTube account.')
      }
    }, 1200)
  }

  const handleClose = () => {
    if (step !== 'authorizing') {
      setStep('form')
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title=""
      size="md"
    >
      <div className="p-6">
        {step === 'authorizing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 animate-pulse">
                <Youtube size={36} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center animate-spin">
                <Sparkles size={12} />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Connecting with Google OAuth 2.0...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Authenticating <span className="text-white font-mono">{channelEmail}</span> with YouTube Data API v3.
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Channel Successfully Authorized!</h3>
              <p className="text-xs text-slate-300 mt-1">
                &ldquo;{channelName}&rdquo; ({channelHandle}) is ready for automatic Shorts publishing.
              </p>
            </div>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleAuthorize} className="space-y-5">
            {/* GOOGLE SIGN IN HEADER BANNER */}
            <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Sign In with Google Account</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                    <Youtube size={10} /> YouTube API
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Link your YouTube channel to enable automatic video uploads & scheduling.
                </p>
              </div>
            </div>

            {/* CHANNEL ACCOUNT INPUTS */}
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Google / YouTube Email
                </label>
                <Input
                  type="email"
                  required
                  value={channelEmail}
                  onChange={(e) => setChannelEmail(e.target.value)}
                  placeholder="your-channel@gmail.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Channel Name
                  </label>
                  <Input
                    type="text"
                    required
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="e.g. Ayush Argulwar"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Channel Handle
                  </label>
                  <Input
                    type="text"
                    required
                    value={channelHandle}
                    onChange={(e) => setChannelHandle(e.target.value)}
                    placeholder="@ayushargulwar"
                  />
                </div>
              </div>
            </div>

            {/* PERMISSIONS REQUESTED BOX */}
            <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-2">
              <p className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck size={14} className="text-emerald-400" /> Permissions requested by ClipForge AI:
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 pl-1">
                <li className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                  <span>Upload and schedule videos as YouTube Shorts</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                  <span>Set titles, descriptions, and hashtags automatically</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                  <span>View upload quota & published video IDs</span>
                </li>
              </ul>
            </div>

            <div className="text-[11px] text-slate-500 flex items-start gap-1.5 leading-relaxed">
              <Lock size={12} className="shrink-0 mt-0.5 text-slate-400" />
              <span>
                ClipForge AI will only upload videos that you explicitly approve. You can revoke access at any time from your Google Account security settings.
              </span>
            </div>

            {/* BUTTONS */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-border">
              <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold shadow-lg shadow-red-600/25"
              >
                <Youtube size={16} /> Allow & Connect Channel
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
