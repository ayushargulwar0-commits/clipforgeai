import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Feedback'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  Zap,
  HardDrive,
  Clock,
  Download,
  Film,
  ShieldCheck,
  Crown,
  Sparkles,
} from 'lucide-react'

export default function Usage() {
  const { isOwner, profile, user } = useAuth()
  const plan = isOwner
    ? '👑 Founder & Platform Owner'
    : profile?.plan
    ? profile.plan.toUpperCase()
    : 'Free Starter'

  const creditsDisplay = isOwner ? '∞ Unlimited' : `${profile?.credits || 75}`

  const usage = {
    uploads: { used: 2, limit: isOwner ? '∞ Unlimited' : '5' },
    minutes: { used: 14.5, limit: isOwner ? '∞ Unlimited' : '30' },
    exports: { used: 3, limit: isOwner ? '∞ Unlimited' : '10' },
    storage: { used: 0.42, limit: isOwner ? '∞ Unlimited' : '1.0' }, // in GB
    creditsRemaining: creditsDisplay,
  }

  const transactions = [
    {
      action: isOwner ? 'Founder Unlimited Quota Allocation' : 'Monthly Credit Refresh',
      credits: isOwner ? '+999,999' : '+100',
      date: 'Active',
      clip: 'Platform Master Privileges',
    },
    {
      action: 'Clip 1080p MP4 Render with Outro',
      credits: isOwner ? '0 (Free)' : -5,
      date: 'Today, 2:15 PM',
      clip: 'The Hardest Truth About Scaling',
    },
    {
      action: 'Audio Transcription (faster-whisper)',
      credits: isOwner ? '0 (Free)' : -10,
      date: 'Today, 1:40 PM',
      clip: 'Episode_42_AI_Founders.mp4',
    },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Usage & Credits
            {isOwner && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                <Crown size={12} /> FULL OWNER ACCESS
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isOwner
              ? 'You have permanent unlimited access to all AI features, 4K rendering, queues, and credits.'
              : 'Track resource consumption, available processing credits, and storage quotas.'}
          </p>
        </div>
        {isOwner ? (
          <Link to="/dashboard/admin">
            <Button size="sm" className="gap-2 text-xs font-semibold bg-gradient-to-r from-amber-500 to-brand-600 hover:from-amber-400 hover:to-brand-500">
              <Crown size={14} /> Open Admin Console
            </Button>
          </Link>
        ) : (
          <Link to="/pricing">
            <Button size="sm" className="gap-2 text-xs font-semibold">
              <Zap size={14} /> Upgrade Plan
            </Button>
          </Link>
        )}
      </div>

      {/* Plan Status Banner */}
      <Card className="p-6 bg-gradient-to-r from-surface-card via-surface to-brand-950/40 border-brand-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="brand" className="font-bold">{plan}</Badge>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck size={12} /> Active Lifetime
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {usage.creditsRemaining} Credits Available
            {isOwner && <Sparkles size={18} className="text-amber-400" />}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isOwner
              ? 'Owner account: No usage limits, zero cooldowns, full access to all AI tools.'
              : 'Resets automatically at the start of next billing period.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isOwner ? (
            <Link to="/dashboard/tools">
              <Button size="sm" className="text-xs gap-1.5 shadow-brand">
                <Sparkles size={13} /> Launch AI Tools
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/pricing">
                <Button variant="outline" size="sm" className="text-xs">
                  View All Tiers
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="sm" className="text-xs">
                  Upgrade to Creator
                </Button>
              </Link>
            </>
          )}
        </div>
      </Card>

      {/* Usage Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Uploads */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Film size={16} className="text-brand-400" /> Video Uploads
            </span>
            <span className="font-semibold text-slate-200">
              {usage.uploads.used} / {usage.uploads.limit}
            </span>
          </div>
          <Progress
            value={isOwner ? 5 : (usage.uploads.used / 5) * 100}
            size="sm"
            variant="brand"
          />
          <p className="text-[11px] text-slate-500">
            {isOwner ? 'Unlimited uploads enabled' : '3 uploads remaining this month'}
          </p>
        </Card>

        {/* Minutes */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock size={16} className="text-accent-400" /> Audio Transcription
            </span>
            <span className="font-semibold text-slate-200">
              {usage.minutes.used}m / {usage.minutes.limit}
            </span>
          </div>
          <Progress
            value={isOwner ? 10 : (usage.minutes.used / 30) * 100}
            size="sm"
            variant="brand"
          />
          <p className="text-[11px] text-slate-500">
            {isOwner ? 'Unlimited Whisper AI transcription' : '15.5 minutes remaining'}
          </p>
        </Card>

        {/* Exports */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Download size={16} className="text-emerald-400" /> MP4 Exports
            </span>
            <span className="font-semibold text-slate-200">
              {usage.exports.used} / {usage.exports.limit}
            </span>
          </div>
          <Progress
            value={isOwner ? 8 : (usage.exports.used / 10) * 100}
            size="sm"
            variant="success"
          />
          <p className="text-[11px] text-slate-500">
            {isOwner ? 'Unlimited 1080p & 4K exports' : '7 exports remaining'}
          </p>
        </Card>

        {/* Storage */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive size={16} className="text-amber-400" /> Cloud Storage
            </span>
            <span className="font-semibold text-slate-200">
              {usage.storage.used} GB / {usage.storage.limit}
            </span>
          </div>
          <Progress
            value={isOwner ? 5 : (usage.storage.used / 1.0) * 100}
            size="sm"
            variant="warning"
          />
          <p className="text-[11px] text-slate-500">
            {isOwner ? 'Unlimited cloud storage' : '0.58 GB available'}
          </p>
        </Card>
      </div>

      {/* Credit Activity Log */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-white mb-4">Recent Usage & Deductions</h3>
        <div className="divide-y divide-surface-border">
          {transactions.map((tx, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-200">{tx.action}</p>
                <p className="text-slate-500">{tx.clip} • {tx.date}</p>
              </div>
              <span
                className={`font-mono font-bold ${
                  (typeof tx.credits === 'number' ? tx.credits > 0 : String(tx.credits).startsWith('+'))
                    ? 'text-emerald-400'
                    : 'text-slate-300'
                }`}
              >
                {typeof tx.credits === 'number' && tx.credits > 0 ? `+${tx.credits}` : tx.credits} credits
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
