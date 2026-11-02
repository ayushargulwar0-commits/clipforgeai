import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Feedback'
import { Link } from 'react-router-dom'
import {
  Zap,
  HardDrive,
  Clock,
  Download,
  Film,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
} from 'lucide-react'

export default function Usage() {
  const plan = 'Free Starter'
  const usage = {
    uploads: { used: 2, limit: 5 },
    minutes: { used: 14.5, limit: 30 },
    exports: { used: 3, limit: 10 },
    storage: { used: 0.42, limit: 1.0 }, // in GB
    creditsRemaining: 75,
  }

  const transactions = [
    {
      action: 'Clip 1080p MP4 Render',
      credits: -5,
      date: 'Today, 2:15 PM',
      clip: 'The Hardest Truth About Scaling',
    },
    {
      action: 'Audio Transcription (faster-whisper)',
      credits: -10,
      date: 'Today, 1:40 PM',
      clip: 'Episode_42_AI_Founders.mp4',
    },
    {
      action: 'Monthly Free Plan Credit Refresh',
      credits: +100,
      date: 'Nov 1, 2026',
      clip: 'System Allocation',
    },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Usage & Credits</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track resource consumption, available processing credits, and storage quotas.
          </p>
        </div>
        <Link to="/pricing">
          <Button size="sm" className="gap-2 text-xs font-semibold">
            <Zap size={14} /> Upgrade Plan
          </Button>
        </Link>
      </div>

      {/* Plan Status Banner */}
      <Card className="p-6 bg-gradient-to-r from-surface-card via-surface to-brand-950/20 border-brand-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="brand">{plan}</Badge>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck size={12} /> Active
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {usage.creditsRemaining} Credits Available
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Resets automatically at the start of next billing period.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            <span>
              {usage.uploads.used} / {usage.uploads.limit}
            </span>
          </div>
          <Progress
            value={(usage.uploads.used / usage.uploads.limit) * 100}
            size="sm"
            variant="brand"
          />
          <p className="text-[11px] text-slate-500">
            {usage.uploads.limit - usage.uploads.used} uploads remaining this month
          </p>
        </Card>

        {/* Minutes */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock size={16} className="text-accent-400" /> Audio Transcription
            </span>
            <span>
              {usage.minutes.used} / {usage.minutes.limit}m
            </span>
          </div>
          <Progress
            value={(usage.minutes.used / usage.minutes.limit) * 100}
            size="sm"
            variant="brand"
          />
          <p className="text-[11px] text-slate-500">
            {(usage.minutes.limit - usage.minutes.used).toFixed(1)} minutes remaining
          </p>
        </Card>

        {/* Exports */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Download size={16} className="text-emerald-400" /> MP4 Exports
            </span>
            <span>
              {usage.exports.used} / {usage.exports.limit}
            </span>
          </div>
          <Progress
            value={(usage.exports.used / usage.exports.limit) * 100}
            size="sm"
            variant="success"
          />
          <p className="text-[11px] text-slate-500">
            {usage.exports.limit - usage.exports.used} exports remaining
          </p>
        </Card>

        {/* Storage */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive size={16} className="text-amber-400" /> Cloud Storage
            </span>
            <span>
              {usage.storage.used} / {usage.storage.limit} GB
            </span>
          </div>
          <Progress
            value={(usage.storage.used / usage.storage.limit) * 100}
            size="sm"
            variant="warning"
          />
          <p className="text-[11px] text-slate-500">
            {(usage.storage.limit - usage.storage.used).toFixed(2)} GB available
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
                  tx.credits > 0 ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {tx.credits > 0 ? `+${tx.credits}` : tx.credits} credits
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
