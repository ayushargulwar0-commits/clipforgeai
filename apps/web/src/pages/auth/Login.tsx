import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { Zap, Lock, Mail, ArrowRight } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { error, success } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const errs: typeof formErrors = {}
    if (!email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email address'
    if (!password) errs.password = 'Password is required'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authErr) {
        error('Sign In Failed', authErr.message)
      } else if (data.user) {
        success('Welcome back!', 'Signed in successfully.')
        navigate('/dashboard')
      }
    } catch (err: any) {
      error('Sign In Error', err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error: oErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (oErr) error('OAuth Failed', oErr.message)
    } catch (err: any) {
      error('OAuth Error', err.message)
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
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access your workspace
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="name@example.com"
                value={email}
                error={formErrors.email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={16} />}
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  error={formErrors.password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={16} />}
                />
              </div>

              <Button type="submit" loading={loading} className="w-full font-semibold">
                Sign In <ArrowRight size={16} className="ml-1" />
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface-card px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full gap-2 text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Google
            </Button>
          </Card>

          <p className="text-center text-xs text-slate-400 mt-6">
            Don&rsquo;t have an account?{' '}
            <Link to="/signup" className="text-brand-400 font-semibold hover:text-brand-300">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}
