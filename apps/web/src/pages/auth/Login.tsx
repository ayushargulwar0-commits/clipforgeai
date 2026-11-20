import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'

export default function Login() {
  const navigate = useNavigate()

  useEffect(() => {
    // Direct instant access: no login wall
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true })
    }, 600)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <PublicLayout hideFooter>
      <div className="py-20 max-w-md mx-auto px-4">
        <Card className="p-8 text-center space-y-6 border-surface-border bg-surface-card">
          <div className="flex justify-center">
            <BrandLogo size="lg" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 size={14} /> Open Access Mode Active
            </div>
            <h1 className="text-2xl font-bold text-white">No Login Required</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Account gating has been temporarily removed. You have immediate, unrestricted access to the full video clipping and editing suite.
            </p>
          </div>

          <Button
            size="lg"
            className="w-full gap-2 font-bold shadow-brand"
            onClick={() => navigate('/dashboard')}
          >
            Enter Studio Directly <ArrowRight size={18} />
          </Button>

          <p className="text-[11px] text-slate-500">
            Redirecting automatically…
          </p>
        </Card>
      </div>
    </PublicLayout>
  )
}
