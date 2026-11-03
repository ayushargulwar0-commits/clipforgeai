import { Youtube } from '@/components/ui/Icons'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useYouTubeStore } from '@/store/youtubeStore'
import { User, Lock, Bell, Key, Shield, CheckCircle2, ExternalLink, RefreshCw, Radio } from 'lucide-react'

export default function Settings() {
  const { user, isOwner } = useAuth()
  const { success, error: toastError } = useToast()
  const { channel, connectAccount, disconnectAccount, loading: ytLoading } = useYouTubeStore()
  const [tab, setTab] = useState<'profile' | 'integrations' | 'security' | 'notifications' | 'api'>('profile')

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || (isOwner ? 'Ayush Argulwar' : 'Creator User'))
  const [email] = useState(user?.email || (isOwner ? 'ayushargulwar0@gmail.com' : 'creator@example.com'))
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [customChannel, setCustomChannel] = useState(channel.channelName || 'Ayush Argulwar Shorts')

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    success('Profile Updated', 'Your profile details have been saved.')
  }

  const handleSecuritySave = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPass('')
    setNewPass('')
    success('Password Updated', 'Your password has been changed securely.')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal profile, workspace security, notifications, and API keys.
        </p>
      </div>

      {isOwner && (
        <Card className="p-4 bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-blue-600/20 border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-lg">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Platform Owner & Super Admin</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-600/40 text-brand-200 border border-brand-500/40 font-mono">
                  ayushargulwar0@gmail.com
                </span>
              </div>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Full platform access granted. Unlimited credits, all AI models, 4K rendering, and admin console unlocked.
              </p>
            </div>
          </div>
          <Badge variant="warning" className="text-xs font-mono font-bold">
            ∞ UNLIMITED ACCESS
          </Badge>
        </Card>
      )}


      {/* Tabs */}
      <div className="flex border-b border-surface-border gap-2 overflow-x-auto pb-1">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'integrations', label: 'YouTube & Channels', icon: Youtube },
          { id: 'security', label: 'Security & Password', icon: Lock },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'api', label: 'Developer API', icon: Key },
        ].map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                active
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab 1: Profile */}
      {tab === 'profile' && (
        <Card className="p-6">
          <h2 className="text-base font-bold text-white mb-4">Personal Information</h2>
          <form onSubmit={handleProfileSave} className="space-y-4 max-w-lg">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input label="Email Address" value={email} disabled hint="Email is managed by Supabase Auth" />
            <div className="pt-2">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: YouTube & Channels */}
      {tab === 'integrations' && (
        <div className="space-y-6 max-w-3xl">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-600/10">
                  <Youtube size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">YouTube Integration</h2>
                    {channel.connected ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Connected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface text-slate-400 border border-surface-border">
                        Not Linked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect your YouTube account to automatically upload or schedule Shorts with AI subtitles.
                  </p>
                </div>
              </div>

              {channel.connected ? (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={async () => {
                    await disconnectAccount()
                    success('Disconnected', 'YouTube channel has been unlinked.')
                  }}
                  className="text-red-400 hover:text-red-300 hover:border-red-500/50"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={async () => {
                    await connectAccount(customChannel)
                    success('YouTube Linked!', `Connected to "${customChannel}" successfully.`)
                  }}
                  loading={ytLoading}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold gap-1.5 shadow-lg shadow-red-600/20"
                >
                  <Youtube size={16} /> Connect Account
                </Button>
              )}
            </div>

            {channel.connected ? (
              <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-600/30 border border-red-500/40 flex items-center justify-center text-white font-bold text-sm">
                      YT
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{channel.channelName}</p>
                      <p className="text-xs text-slate-400">
                        {channel.subscriberCount} • Channel ID: <span className="font-mono text-slate-300">{channel.channelId}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                    <Radio size={12} className="animate-pulse" /> Direct Uploads Ready
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-surface-border/60 flex items-center justify-between">
                  <span>Linked on: {new Date(channel.connectedAt || Date.now()).toLocaleDateString()}</span>
                  <span className="text-brand-300">Default Category: 22 (People & Blogs)</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  YouTube Channel Name or Creator Handle
                </label>
                <div className="flex gap-2">
                  <Input
                    value={customChannel}
                    onChange={(e) => setCustomChannel(e.target.value)}
                    placeholder="e.g. Ayush Argulwar / @clipforge"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      await connectAccount(customChannel)
                      success('YouTube Connected', `Linked to "${customChannel}"`)
                    }}
                    loading={ytLoading}
                    className="bg-red-600 hover:bg-red-500 text-white shrink-0 font-bold gap-1"
                  >
                    <Youtube size={14} /> Link
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">
                  After linking, clips rendered in ClipForge AI can be published directly as YouTube Shorts or scheduled for peak engagement times.
                </p>
              </div>
            )}

            {/* Publishing Settings */}
            <div className="pt-2 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
                Automated Upload Defaults
              </h3>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-surface-border cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 rounded text-red-600 focus:ring-red-500" />
                  <div>
                    <p className="text-xs font-semibold text-white">Append #Shorts to all clip titles</p>
                    <p className="text-[11px] text-slate-400">Ensures YouTube algorithms index vertical video in the Shorts feed</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-surface-border cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 rounded text-red-600 focus:ring-red-500" />
                  <div>
                    <p className="text-xs font-semibold text-white">Include ClipForge AI watermark attribution</p>
                    <p className="text-[11px] text-slate-400">Includes &ldquo;✂️ Auto-edited by ClipForge AI (https://clipforgeai.online)&rdquo; in video description</p>
                  </div>
                </label>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Security */}
      {tab === 'security' && (
        <Card className="p-6">
          <h2 className="text-base font-bold text-white mb-4">Change Password</h2>
          <form onSubmit={handleSecuritySave} className="space-y-4 max-w-lg">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Min. 8 characters"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <div className="pt-2">
              <Button type="submit">Update Password</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 3: Notifications */}
      {tab === 'notifications' && (
        <Card className="p-6 space-y-4 max-w-xl">
          <h2 className="text-base font-bold text-white mb-2">Notification Preferences</h2>
          <div className="space-y-3">
            {[
              { title: 'Job Completion Alerts', desc: 'Email me when a video transcription or render finishes' },
              { title: 'Weekly Clip Digest', desc: 'Summary of top performing viral clip recommendations' },
              { title: 'Usage Limit Warnings', desc: 'Notify me when remaining processing minutes drop below 10%' },
            ].map((n, i) => (
              <label key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-surface-border cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-brand-600 focus:ring-brand-500" />
                <div>
                  <p className="text-xs font-semibold text-white">{n.title}</p>
                  <p className="text-[11px] text-slate-400">{n.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <Button onClick={() => success('Saved', 'Notification preferences updated.')} size="sm">
            Save Preferences
          </Button>
        </Card>
      )}

      {/* Tab 4: API */}
      {tab === 'api' && (
        <Card className="p-6 max-w-xl space-y-4">
          <h2 className="text-base font-bold text-white mb-1">Developer API Keys</h2>
          <p className="text-xs text-slate-400">
            Use your personal API token to trigger programmatic video ingestion and render jobs from CI/CD or custom scripts.
          </p>
          <div className="p-3 rounded-lg bg-surface border border-surface-border font-mono text-xs text-slate-300 flex items-center justify-between">
            <span>cf_live_••••••••••••••••••••••••38e2</span>
            <Button variant="outline" size="xs" onClick={() => success('Copied', 'API Key copied to clipboard')}>
              Copy
            </Button>
          </div>
          <Button variant="danger" size="xs">
            Revoke Key
          </Button>
        </Card>
      )}
    </div>
  )
}
