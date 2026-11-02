import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { Zap, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const { error, success } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      error('Email required', 'Please enter your account email')
      return
    }

    setLoading(true)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (resetErr) {
        error('Reset Failed', resetErr.message)
      } else {
        setSent(true)
        success('Email Sent', 'Instructions to reset your password have been sent.')
      }
    } catch (err: any) {
      error('Error', err.message || 'Failed to request reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout hideFooter>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-brand">
                <Zap size={20} className="text-white" fill="white" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Clip<span className="gradient-text">Forge</span>
                <span className="text-slate-400 font-light ml-0.5 text-xs">AI</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-white">Reset your password</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your registered email address to receive reset instructions
            </p>
          </div>

          <Card className="p-8">
            {sent ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-lg font-bold text-white">Check Your Inbox</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We have sent password reset instructions to <strong className="text-slate-200">{email}</strong>.
                </p>
                <Link to="/login" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={16} />}
                />
                <Button type="submit" loading={loading} className="w-full font-semibold">
                  Send Reset Link
                </Button>
                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </PublicLayout>
  )
}
