import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'muted'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-muted text-slate-300 border-surface-border',
  brand:   'bg-brand-600/20 text-brand-300 border-brand-600/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  danger:  'bg-red-500/15 text-red-400 border-red-500/25',
  info:    'bg-accent-500/15 text-accent-400 border-accent-500/25',
  muted:   'bg-surface text-slate-500 border-surface-border',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border',
      variants[variant],
      className,
    )}>
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-emerald-400',
          variant === 'warning' && 'bg-amber-400',
          variant === 'danger'  && 'bg-red-400',
          variant === 'brand'   && 'bg-brand-400',
          variant === 'info'    && 'bg-accent-400',
          (variant === 'default' || variant === 'muted') && 'bg-slate-400',
        )} />
      )}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    pending:    'warning',
    processing: 'info',
    completed:  'success',
    failed:     'danger',
    cancelled:  'muted',
  }
  return <Badge variant={map[status] || 'default'} dot>{status}</Badge>
}
