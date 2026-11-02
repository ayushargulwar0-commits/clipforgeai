import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'brand' | 'outline' | 'ghost' | 'danger' | 'secondary'
type Size    = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  brand:     'bg-gradient-to-r from-brand-600 to-accent-500 text-white hover:from-brand-700 hover:to-accent-600 shadow-brand hover:shadow-brand-lg',
  outline:   'border border-surface-border text-slate-200 hover:border-brand-500 hover:text-white hover:bg-surface-hover',
  ghost:     'text-slate-300 hover:text-white hover:bg-surface-hover',
  danger:    'bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 hover:text-red-300',
  secondary: 'bg-surface-card text-slate-200 border border-surface-border hover:border-brand-500/50 hover:bg-surface-hover',
}

const sizeClasses: Record<Size, string> = {
  xs:  'text-xs px-2.5 py-1.5 rounded-md gap-1',
  sm:  'text-sm px-3.5 py-2 rounded-lg gap-1.5',
  md:  'text-sm px-4 py-2.5 rounded-lg gap-2',
  lg:  'text-base px-6 py-3 rounded-xl gap-2',
  xl:  'text-lg px-8 py-4 rounded-xl gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'brand', size = 'md', loading, icon, iconRight, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
