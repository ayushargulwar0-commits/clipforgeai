import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'

export default function Signup() {
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(true)

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) return
    navigate('/dashboard')
  }

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
            <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Experience the full suite of AI clipping tools, 9:16 smart cropping, and caption styling with no upfront payment.
            </p>
          </div>

          <form onSubmit={handleEnter} className="space-y-4 text-left">
            {/* Agreement Checkbox */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface border border-surface-border text-xs text-slate-300">
              <input
                type="checkbox"
                id="agree-legal"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-surface text-brand-500 focus:ring-brand-500/20 cursor-pointer"
                required
              />
              <label htmlFor="agree-legal" className="cursor-pointer select-none leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="text-brand-400 underline hover:text-brand-300 font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="text-brand-400 underline hover:text-brand-300 font-medium">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2 font-bold shadow-brand"
              disabled={!agreed}
            >
              Start Free in Studio <ArrowRight size={18} />
            </Button>
          </form>

          <p className="text-[11px] text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 underline hover:text-brand-300 font-medium">
              Log in here
            </Link>
          </p>
        </Card>
      </div>
    </PublicLayout>
  )
}
