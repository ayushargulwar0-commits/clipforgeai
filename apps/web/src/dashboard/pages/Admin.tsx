import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import {
  ShieldAlert,
  Users,
  Cpu,
  HardDrive,
  Activity,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Server,
} from 'lucide-react'

export default function AdminDashboard() {
  const { success, error } = useToast()

  const stats = [
    { label: 'Registered Users', val: '1,248', change: '+12% this week', icon: Users },
    { label: 'Active Jobs', val: '4', change: 'faster-whisper / FFmpeg', icon: Cpu },
    { label: 'Failed Jobs', val: '2', change: 'Last 24 hours', icon: AlertTriangle },
    { label: 'Disk Storage Used', val: '48.6 GB', change: 'Local Adapter', icon: HardDrive },
  ]

  const [jobs, setJobs] = useState([
    {
      id: 'job-9842',
      type: 'transcription',
      user: 'alex@creator.io',
      status: 'completed',
      duration: '42s',
      timestamp: '10 mins ago',
    },
    {
      id: 'job-9843',
      type: 'clip_detection',
      user: 'sarah@podcasts.net',
      status: 'completed',
      duration: '14s',
      timestamp: '18 mins ago',
    },
    {
      id: 'job-9844',
      type: 'render',
      user: 'team@agency.com',
      status: 'failed',
      duration: '1m 20s',
      timestamp: '1 hour ago',
    },
    {
      id: 'job-9845',
      type: 'render',
      user: 'dev@startup.io',
      status: 'processing',
      duration: '25s',
      timestamp: 'Just now',
    },
  ])

  const handleRetryJob = (jobId: string) => {
    setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status: 'processing' } : j)))
    success('Job Re-queued', `Worker picked up ${jobId} for re-processing.`)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Operations Console</h1>
            <Badge variant="danger" className="text-[10px]">Staff Only</Badge>
          </div>
          <p className="text-xs text-slate-400">
            System health monitoring, background workers, storage metrics, and failed job remediation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            WORKERS: ONLINE
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => {
          const Icon = s.icon
          return (
            <Card key={idx} className="p-5">
              <div className="flex items-center justify-between mb-3 text-slate-400">
                <span className="text-xs font-semibold">{s.label}</span>
                <Icon size={18} className="text-brand-400" />
              </div>
              <div className="text-2xl font-black text-white mb-1">{s.val}</div>
              <p className="text-[11px] text-slate-500 font-mono">{s.change}</p>
            </Card>
          )
        })}
      </div>

      {/* Background Processing Queue Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Recent Worker Processing Jobs</h2>
          <Button variant="outline" size="xs" onClick={() => success('Refreshed', 'Queue refreshed.')}>
            Refresh Queue
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-border text-slate-400">
                <th className="py-2.5 px-3">Job ID</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Elapsed</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3 text-right">Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-300">{job.id}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-surface border border-surface-border text-[11px] font-mono text-brand-300">
                      {job.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{job.user}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono">{job.duration}</td>
                  <td className="py-3 px-3 text-slate-500">{job.timestamp}</td>
                  <td className="py-3 px-3 text-right">
                    {job.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleRetryJob(job.id)}
                        className="gap-1 text-[11px]"
                      >
                        <RotateCcw size={12} /> Retry
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
