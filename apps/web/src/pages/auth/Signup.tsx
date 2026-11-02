import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore, isOwnerEmail, isOwnerName } from '@/store/authStore'
import { Zap, Lock, Mail, User, ArrowRight, CheckCircle2, Crown } from 'lucide-react'

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan') || 'free'
  const { error, success } = useToast()
  const { setUser, setProfile } = useAuthStore()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  const handleOwnerFastTrack = () => {
    setUser({
      id: 'owner-ayush',
      email: 'ayushargulwar0@gmail.com',
      user_metadata: { full_name: 'Ayush Argulwar', plan: 'team' },
    })
    setProfile({
      id: 'owner-ayush',
      full_name: 'Ayush Argulwar',
      avatar_url: null,
      role: 'admin',
      plan: 'team',
      credits: 999999,
    })
    success('👑 Welcome Ayush!', 'Logged in as Platform Owner & Super Admin with Full Access.')
    navigate('/dashboard')
  }

  const validate = () => {
    const errs: typeof formErrors = {}
    if (!fullName.trim()) errs.fullName = 'Full name is required'
    if (!email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email address'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (!agreed) errs.agreed = 'You must agree to the Terms of Service'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const isOwner = isOwnerEmail(email) || isOwnerName(fullName)

    // Fallback helper for local session
    const setLocalSession = () => {
      const mockUser = {
        id: isOwner ? 'owner-ayush' : ('usr-' + Date.now()),
        email,
        user_metadata: { full_name: isOwner ? 'Ayush Argulwar' : fullName, plan: isOwner ? 'team' : plan },
      }
      setUser(mockUser)
      setProfile({
        id: mockUser.id,
        full_name: isOwner ? 'Ayush Argulwar' : fullName,
        avatar_url: null,
        role: isOwner ? 'admin' : 'user',
        plan: isOwner ? 'team' : ((plan as any) || 'free'),
        credits: isOwner ? 999999 : 100,
      })
      if (isOwner) {
        success('Welcome Owner!', 'Account registered with Full Platform Owner & Admin privileges.')
      } else {
        success('Welcome to ClipForge AI!', 'Account created (Local Development Mode).')
      }
      navigate('/dashboard')
    }


    if (!isSupabaseConfigured) {
      setLocalSession()
      setLoading(false)
      return
    }

    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            plan: plan,
          },
        },
      })

      if (authErr) {
        // If Supabase returns an error, fallback to local dev session
        console.warn('Supabase auth error, falling back to local session:', authErr.message)
        setLocalSession()
      } else if (data.user) {
        if (data.session) {
          setUser(data.user as any)
          setProfile({
            id: data.user.id,
            full_name: fullName,
            avatar_url: null,
            role: 'user',
            plan: (plan as any) || 'free',
            credits: 100,
          })
          success('Account created!', 'Welcome to ClipForge AI.')
          navigate('/dashboard')
        } else {
          setRegistered(true)
        }
      }
    } catch (err: any) {
      // Network failure / Failed to fetch fallback
      console.warn('Supabase fetch failed, creating local session:', err.message)
      setLocalSession()
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout hideFooter>
      <div className="min-h-[calc(100vh-4rem)] pt-8 pb-16 px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-brand">
                <Zap size={20} className="text-white" fill="white" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Clip<span className="gradient-text">Forge</span>
                <span className="text-slate-400 font-light ml-0.5 text-xs">AI</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-white">Create your free account</h1>
            <p className="text-xs text-slate-400 mt-1">
              Start turning long videos into viral clips today. No credit card required.
            </p>
          </div>

          <Card className="p-8">
            {/* 👑 Instant Owner Login Banner */}
            <div className="mb-6 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-purple-600/15 border border-amber-500/35 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300">
                <Crown size={15} className="text-amber-400" />
                <span>Platform Owner Fast-Track</span>
              </div>
              <Button
                type="button"
                onClick={handleOwnerFastTrack}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 border border-amber-400 gap-1.5"
              >
                <Crown size={15} className="fill-black" />
                <span>Log in as Owner (Ayush Argulwar)</span>
              </Button>
              <p className="text-[10px] text-slate-400">
                ayushargulwar0@gmail.com • Unlimited Credits & All Features Unlocked
              </p>
            </div>

            {registered ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-lg font-bold text-white">Check Your Email</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We sent a verification link to <strong className="text-slate-200">{email}</strong>. Please click the link to activate your account and jump into the dashboard.
                </p>
                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="w-full">
                      Proceed to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="Alex Rivera"
                  value={fullName}
                  error={formErrors.fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  icon={<User size={16} />}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  error={formErrors.email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={16} />}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  error={formErrors.password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={16} />}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-type password"
                  value={confirmPassword}
                  error={formErrors.confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Lock size={16} />}
                />

                <div className="pt-1">
                  <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-surface-border bg-surface text-brand-600 focus:ring-brand-500"
                    />
                    <span>
                      I agree to the{' '}
                      <a href="#" className="text-brand-400 underline hover:text-brand-300">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-brand-400 underline hover:text-brand-300">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                  {formErrors.agreed && (
                    <p className="text-[11px] text-red-400 mt-1">{formErrors.agreed}</p>
                  )}
                </div>

                <Button type="submit" loading={loading} className="w-full font-semibold">
                  Get Started for Free <ArrowRight size={16} className="ml-1" />
                </Button>
              </form>
            )}
          </Card>

          <p className="text-center text-xs text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 font-semibold hover:text-brand-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}
