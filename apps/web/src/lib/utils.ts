import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

export const PLAN_LIMITS = {
  free:    { uploads: 5, processingMins: 30, exports: 10, storageGB: 1 },
  creator: { uploads: 50, processingMins: 300, exports: 100, storageGB: 10 },
  pro:     { uploads: 200, processingMins: 1000, exports: 500, storageGB: 50 },
  team:    { uploads: 1000, processingMins: 5000, exports: 2000, storageGB: 200 },
} as const

export const ASPECT_RATIOS = [
  { value: '9:16',  label: 'Portrait 9:16',   icon: '📱', desc: 'TikTok, Reels, Shorts' },
  { value: '16:9',  label: 'Landscape 16:9',  icon: '🖥️', desc: 'YouTube, Webinars' },
  { value: '1:1',   label: 'Square 1:1',      icon: '⬛', desc: 'Instagram Feed' },
] as const
