import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  hover?: boolean
  glow?: boolean
  onClick?: () => void
}

export function Card({ className, children, hover, glow, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface-card border border-surface-border rounded-xl',
        hover && 'cursor-pointer transition-all duration-200 hover:border-brand-500/40 hover:shadow-card-hover hover:-translate-y-0.5',
        glow && 'glow-brand',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-5 py-4 border-b border-surface-border', className)}>
      {children}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-5 py-4 border-t border-surface-border', className)}>
      {children}
    </div>
  )
}
