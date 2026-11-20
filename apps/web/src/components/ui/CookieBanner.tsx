import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cf_cookie_consent')
    if (!consent) {
      // Small timeout so it doesn't flicker instantly
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cf_cookie_consent', 'accepted')
    setVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cf_cookie_consent', 'essential_only')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 p-5 rounded-2xl bg-surface-card/95 backdrop-blur-xl border border-surface-border shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <Cookie size={18} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">Cookie &amp; Advertising Notice</h4>
            <button
              onClick={handleDecline}
              aria-label="Close cookie banner"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            We and our partners (including Google AdSense) use cookies to analyze site traffic, personalize content, and serve relevant advertisements. You can review our{' '}
            <Link to="/cookie-policy" className="text-brand-400 underline font-medium">
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-brand-400 underline font-medium">
              Privacy Policy
            </Link>{' '}
            to learn more or manage your preferences.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleAccept} className="text-xs font-semibold px-4 py-1.5 h-8">
              <Check size={14} className="mr-1" /> Accept All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDecline} className="text-xs px-3 py-1.5 h-8">
              Essential Only
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
