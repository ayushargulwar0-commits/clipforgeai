import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Video,
  Scissors,
  Loader2,
  HardDrive,
  Upload,
  FolderPlus,
  Type,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  ArrowRight,
  Film,
  Clock,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress, EmptyState } from '@/components/ui/Feedback'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewStats {
  totalVideos: number
  clipsGenerated: number
  processingJobs: number
  storageUsedMB: number
  storageMaxGB: number
  creditsUsed: number
  creditsTotal: number
}

interface Project {
  id: string
  name: string
  videoCount: number
  clipCount: number
  status: 'in_progress' | 'completed' | 'draft'
  createdAt: string
  thumbnailColor: string
}

interface Clip {
  id: string
  title: string
  duration: number
  score: number
  projectName: string
  createdAt: string
  aspectRatio: string
}

// ─── Default / placeholder data ───────────────────────────────────────────────

const DEFAULT_STATS: OverviewStats = {
  totalVideos: 0,
  clipsGenerated: 0,
  processingJobs: 0,
  storageUsedMB: 0,
  storageMaxGB: 1,
  creditsUsed: 0,
  creditsTotal: 50,
}

const DEFAULT_PROJECTS: Project[] = []
const DEFAULT_CLIPS: Clip[] = []

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  iconBg?: string
  delay?: number
}

function StatCard({ icon: Icon, label, value, trend, trendLabel, iconBg = 'bg-brand-600/20', delay = 0 }: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
    >
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {trendLabel && (
              <div className={cn('flex items-center gap-1 mt-1.5 text-xs', trendColor)}>
                <TrendIcon size={12} />
                {trendLabel}
              </div>
            )}
          </div>
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
            <Icon size={18} className="text-white/80" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

const STATUS_BADGE: Record<Project['status'], { label: string; variant: 'success' | 'info' | 'muted' }> = {
  completed:   { label: 'Completed',   variant: 'success' },
  in_progress: { label: 'In Progress', variant: 'info' },
  draft:       { label: 'Draft',       variant: 'muted' },
}

function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate()
  const s = STATUS_BADGE[project.status]
  return (
    <Card
      hover
      onClick={() => navigate(`/dashboard/projects/${project.id}`)}
      className="overflow-hidden"
    >
      {/* Thumbnail */}
      <div
        className="h-28 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${project.thumbnailColor}33, ${project.thumbnailColor}11)` }}
      >
        <Film size={32} className="text-white/30" />
      </div>
      <CardBody className="pt-3 pb-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-200 text-sm leading-tight">{project.name}</p>
          <Badge variant={s.variant}>{s.label}</Badge>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Video size={11} /> {project.videoCount} video{project.videoCount !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1"><Scissors size={11} /> {project.clipCount} clip{project.clipCount !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-xs text-slate-600 mt-1.5">{formatRelativeTime(project.createdAt)}</p>
      </CardBody>
    </Card>
  )
}

function ClipRow({ clip }: { clip: Clip }) {
  const scoreColor =
    clip.score >= 80 ? 'text-emerald-400' :
    clip.score >= 60 ? 'text-amber-400' :
    'text-red-400'

  return (
    <div className="flex items-center gap-3 py-3 border-b border-surface-border last:border-0 hover:bg-white/[0.02] rounded-lg px-2 transition-colors">
      {/* Thumbnail */}
      <div className="w-16 h-10 rounded-md bg-surface flex items-center justify-center shrink-0">
        <Scissors size={14} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300 font-medium truncate">{clip.title}</p>
        <p className="text-xs text-slate-500">{clip.projectName} · {clip.aspectRatio}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={cn('text-sm font-semibold', scoreColor)}>{clip.score}</span>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock size={11} />
          {Math.floor(clip.duration / 60)}:{String(clip.duration % 60).padStart(2, '0')}
        </div>
        <span className="text-xs text-slate-600">{formatRelativeTime(clip.createdAt)}</span>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function Overview() {
  const navigate = useNavigate()
  const { user, profile, isOwner, isAdmin } = useAuth()

  const { data: stats = DEFAULT_STATS } = useQuery<OverviewStats>({
    queryKey: ['overview-stats'],
    queryFn: () => Promise.resolve(DEFAULT_STATS),
    staleTime: 60_000,
  })

  const { data: projects = DEFAULT_PROJECTS } = useQuery<Project[]>({
    queryKey: ['recent-projects'],
    queryFn: () => Promise.resolve(DEFAULT_PROJECTS),
    staleTime: 60_000,
  })

  const { data: clips = DEFAULT_CLIPS } = useQuery<Clip[]>({
    queryKey: ['recent-clips'],
    queryFn: () => Promise.resolve(DEFAULT_CLIPS),
    staleTime: 60_000,
  })

  const storageLabel = isOwner ? '0.42 GB / ∞ Unlimited' : `${stats.storageUsedMB} MB / ${stats.storageMaxGB} GB`
  const creditsPct = isOwner ? 0 : (stats.creditsTotal > 0 ? (stats.creditsUsed / stats.creditsTotal) * 100 : 0)
  const creditVariant = creditsPct >= 90 ? 'danger' : creditsPct >= 70 ? 'warning' : 'brand'

  const planVariant =
    isOwner ? 'brand' :
    profile?.plan === 'pro' ? 'brand' :
    profile?.plan === 'team' ? 'success' :
    profile?.plan === 'creator' ? 'info' :
    'muted'


  const QUICK_ACTIONS = [
    { label: 'Upload Video',    icon: Upload,     href: '/dashboard/videos',          color: 'from-brand-600/20 to-brand-700/10 hover:from-brand-600/30' },
    { label: 'Generate Clips',  icon: Scissors,   href: '/dashboard/clips',           color: 'from-accent-500/20 to-accent-600/10 hover:from-accent-500/30' },
    { label: 'New Project',     icon: FolderPlus, href: '/dashboard/projects',        color: 'from-emerald-500/20 to-emerald-600/10 hover:from-emerald-500/30' },
    { label: 'AI Captions',     icon: Type,       href: '/dashboard/tools/captions',  color: 'from-amber-500/20 to-amber-600/10 hover:from-amber-500/30' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Video}
          label="Total Videos"
          value={stats.totalVideos}
          iconBg="bg-brand-600/20"
          trend="neutral"
          trendLabel="No uploads yet"
          delay={0}
        />
        <StatCard
          icon={Scissors}
          label="Clips Generated"
          value={stats.clipsGenerated}
          iconBg="bg-accent-500/20"
          trend="neutral"
          trendLabel="No clips yet"
          delay={0.05}
        />
        <StatCard
          icon={Loader2}
          label="Processing Jobs"
          value={stats.processingJobs}
          iconBg="bg-amber-500/20"
          trend="neutral"
          delay={0.1}
        />
        <StatCard
          icon={HardDrive}
          label="Storage Used"
          value={storageLabel}
          iconBg="bg-emerald-500/20"
          trend="neutral"
          delay={0.15}
        />
      </div>

      {/* Middle row: Credits + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Credits card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                  <Zap size={16} className="text-brand-400" />
                  Credits & Plan
                </h2>
                <Badge variant={planVariant} className="capitalize">
                  {isOwner ? '👑 Founder' : (profile?.plan ?? 'free')}
                </Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Credits used</span>
                  <span className="text-slate-300 font-medium">
                    {isOwner ? '0 / ∞ Unlimited' : `${stats.creditsUsed} / ${stats.creditsTotal}`}
                  </span>
                </div>
                <Progress value={isOwner ? 0 : stats.creditsUsed} max={stats.creditsTotal} variant={creditVariant} size="md" />
                {creditsPct >= 80 && (
                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                    <TrendingUp size={11} /> Running low on credits
                  </p>
                )}
              </div>
              <Button variant="brand" size="sm" className="w-full" icon={<Zap size={14} />} onClick={() => navigate('/dashboard/usage')}>
                {isOwner ? '👑 Founder Quota Settings' : profile?.plan === 'free' ? 'Upgrade Plan' : 'Buy More Credits'}
              </Button>

            </CardBody>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader>
              <h2 className="font-semibold text-slate-200">Quick Actions</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUICK_ACTIONS.map(({ label, icon: Icon, href, color }) => (
                  <button
                    key={href}
                    onClick={() => navigate(href)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br transition-all duration-200 border border-surface-border hover:border-brand-500/30 group',
                      color,
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon size={18} className="text-white/80" />
                    </div>
                    <span className="text-xs text-slate-300 font-medium text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row: Recent Projects + Recent Clips */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-200">Recent Projects</h2>
                <Button variant="ghost" size="xs" iconRight={<ArrowRight size={12} />} onClick={() => navigate('/dashboard/projects')}>
                  View all
                </Button>
              </div>
            </CardHeader>
            {projects.length === 0 ? (
              <EmptyState
                icon={<FolderPlus size={24} />}
                title="No projects yet"
                description="Create your first project to start organizing your videos and clips."
                action={
                  <Button size="sm" icon={<FolderPlus size={14} />} onClick={() => navigate('/dashboard/projects')}>
                    Create your first project
                  </Button>
                }
              />
            ) : (
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projects.slice(0, 4).map((p) => <ProjectCard key={p.id} project={p} />)}
                </div>
              </CardBody>
            )}
          </Card>
        </motion.div>

        {/* Recent Clips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-200">Recent Clips</h2>
                <Button variant="ghost" size="xs" iconRight={<ArrowRight size={12} />} onClick={() => navigate('/dashboard/clips')}>
                  View all
                </Button>
              </div>
            </CardHeader>
            {clips.length === 0 ? (
              <EmptyState
                icon={<Scissors size={24} />}
                title="No clips generated yet"
                description="Upload a video and let AI find your best moments."
                action={
                  <Button size="sm" icon={<Scissors size={14} />} onClick={() => navigate('/dashboard/videos')}>
                    Upload a video
                  </Button>
                }
              />
            ) : (
              <CardBody className="pt-0 pb-2">
                {clips.slice(0, 6).map((c) => <ClipRow key={c.id} clip={c} />)}
              </CardBody>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default Overview

