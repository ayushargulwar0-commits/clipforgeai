import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  linkToHome?: boolean
  className?: string
  textClassName?: string
}

const SIZES = {
  sm: { img: 'w-7 h-7 rounded-lg', text: 'text-base' },
  md: { img: 'w-8 h-8 rounded-lg', text: 'text-lg' },
  lg: { img: 'w-10 h-10 rounded-xl', text: 'text-xl' },
  xl: { img: 'w-12 h-12 rounded-2xl', text: 'text-2xl' },
}

export function BrandLogo({
  size = 'md',
  showText = true,
  linkToHome = true,
  className = '',
  textClassName = '',
}: BrandLogoProps) {
  const sizeConfig = SIZES[size] || SIZES.md

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 shrink-0 group', className)}>
      <div className={cn(
        'relative flex items-center justify-center p-0.5 overflow-hidden transition-transform duration-300 group-hover:scale-105',
        sizeConfig.img
      )}>
        <img
          src="/logo.png"
          alt="ClipForge AI"
          className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]"
          loading="eager"
        />
      </div>

      {showText && (
        <span className={cn('font-bold tracking-tight text-white flex items-center', sizeConfig.text, textClassName)}>
          Clip<span className="gradient-text">Forge</span>
          <span className="text-slate-400 font-light ml-1 text-xs px-1.5 py-0.5 rounded bg-surface border border-surface-border">
            AI
          </span>
        </span>
      )}
    </div>
  )

  if (linkToHome) {
    return (
      <Link to="/" className="inline-flex shrink-0">
        {content}
      </Link>
    )
  }

  return content
}
