import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Sparkles,
  ArrowRight,
  Play,
  Upload,
  Zap,
  Scissors,
  Layers,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Video,
  Clock,
  Share2,
  Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { useAuth } from '@/hooks/useAuth'

const PLATFORMS = [
  { name: 'TikTok', icon: '🎵', tag: '9:16 Vertical' },
  { name: 'Instagram Reels', icon: '📸', tag: '9:16 Vertical' },
  { name: 'YouTube Shorts', icon: '▶️', tag: '9:16 Vertical' },
  { name: 'Podcasts', icon: '🎙️', tag: 'Audiograms' },
  { name: 'Gaming Highlights', icon: '🎮', tag: 'Action Clips' },
]

const STATS = [
  { value: '10x', label: 'Faster Production', desc: 'Turn 1-hr recordings into 10+ clips in under 3 minutes' },
  { value: '92%', label: 'Retention Boost', desc: 'Kinetic word-by-word captions keep viewers hooked' },
  { value: '100%', label: 'Open-Source AI', desc: 'Powered by faster-whisper, PySceneDetect & FFmpeg' },
  { value: '₹0', label: 'To Get Started', desc: 'Free plan includes 10 exports per month, no card needed' },
]

const FEATURES = [
  {
    icon: Scissors,
    title: 'AI Clip Detection',
    description: 'Intelligent algorithms analyze speech hooks, pacing, emotion, and question-answer pairs to identify high-retention moments.',
    badge: 'Core Engine',
  },
  {
    icon: Volume2,
    title: 'Kinetic AI Captions',
    description: 'Auto-generate animated, word-level highlighted captions with customizable fonts, colors, and TikTok-style pop effects.',
    badge: 'Multi-lingual',
  },
  {
    icon: Layers,
    title: 'Smart 9:16 Reframing',
    description: 'Convert standard 16:9 horizontal videos into full-screen 9:16 portrait videos with speaker centering and background blur.',
    badge: 'Auto Crop',
  },
  {
    icon: Video,
    title: 'Split-Screen Layouts',
    description: 'Place speaker webcam and gameplay or slides simultaneously in stacked portrait format for reactions and tutorials.',
    badge: 'Creator Favorite',
  },
  {
    icon: Calendar,
    title: 'Content Scheduler',
    description: 'Organize your short-form release schedule with our calendar dashboard, draft posts, and export directly when ready.',
    badge: 'Productivity',
  },
  {
    icon: Zap,
    title: 'Silence & Filler Remover',
    description: 'Automatically cut out awkward pauses, dead air, and ums/ahs to keep the video snappy and high-velocity.',
    badge: 'Speed Boost',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Upload Long Video',
    desc: 'Drag & drop any MP4, MOV, WebM up to 500MB, or import from URL.',
    icon: Upload,
  },
  {
    step: '02',
    title: 'AI Transcription & Analysis',
    desc: 'faster-whisper extracts word-level timestamps and scores hook virality.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'Customize in Browser Editor',
    desc: 'Tweak trim timestamps, choose caption style, aspect ratio and branding.',
    icon: Scissors,
  },
  {
    step: '04',
    title: 'Render & Export in 1080p',
    desc: 'Production-grade FFmpeg renders compatible H.264/AAC MP4 ready for social platforms.',
    icon: Share2,
  },
]

const FAQS = [
  {
    q: 'Is ClipForge AI really free to start?',
    a: 'Yes! The Free plan gives you 5 video uploads, 30 minutes of transcription processing, and 10 rendered MP4 exports every month without requiring a credit card or paid subscriptions.',
  },
  {
    q: 'What video formats and resolutions are supported?',
    a: 'We support MP4, MOV, WebM, and MKV files up to 4K resolution and 60fps. Output clips are rendered in crisp 1080p (1080x1920 for 9:16 vertical) with H.264 video and AAC audio.',
  },
  {
    q: 'How does the AI identify the best moments?',
    a: 'Our NLP detection engine evaluates question-answer structures, hook phrases, emotional pacing, audience retention cues, and sentence completeness to extract cohesive short clips.',
  },
  {
    q: 'Do I need a high-end GPU or paid OpenAI API key?',
    a: 'No paid API keys are required! ClipForge runs with open-source faster-whisper and OpenCV locally. It runs efficiently on CPU and accelerates automatically if an NVIDIA GPU is available.',
  },
  {
    q: 'Can I customize caption animations and fonts?',
    a: 'Absolutely. You can choose font family, font size, primary text color, outline color, and active word highlight colors, plus position captions anywhere on the video frame.',
  },
  {
    q: 'Can I export clips for commercial and client work?',
    a: 'Yes, all videos rendered on ClipForge AI are 100% yours with full commercial rights and no watermarks on paid tiers.',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [quickUrl, setQuickUrl] = useState('')

  const handleQuickStart = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickUrl.trim()) return
    sessionStorage.setItem('cf_pending_url', quickUrl.trim())
    if (user) {
      navigate(`/dashboard/clips?import=${encodeURIComponent(quickUrl.trim())}`)
    } else {
      navigate(`/signup?import=${encodeURIComponent(quickUrl.trim())}`)
    }
  }

  return (
    <PublicLayout>
      {/* =====================================================================
          HERO SECTION
          ===================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-grid">
        {/* Glow blobs */}
        <div className="hero-blob w-96 h-96 bg-brand-600 top-10 left-1/4" />
        <div className="hero-blob w-80 h-80 bg-accent-500 top-40 right-1/4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Top pill badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-surface-border text-xs font-medium text-brand-300 mb-6"
            >
              <Sparkles size={14} className="text-brand-400" />
              <span>Next-Gen Video Repurposing SaaS • 100% Open Source Stack</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6"
            >
              Turn Long Videos Into{' '}
              <span className="gradient-text block mt-1">Scroll-Stopping Shorts.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
            >
              Transform podcasts, interviews, webinars and long videos into engaging
              short-form content using AI. Auto-hook detection, kinetic captions & 9:16 reframing in one click.
            </motion.p>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 py-4 gap-2 font-semibold shadow-brand">
                  Start Free — No Card Needed
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-6 py-4 gap-2">
                  <Play size={16} className="text-brand-400" fill="currentColor" />
                  See How It Works
                </Button>
              </Link>
            </motion.div>

            {/* Quick URL Input Mockup */}
            <motion.form
              onSubmit={handleQuickStart}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-xl mx-auto p-2 bg-surface-card/90 backdrop-blur border border-surface-border rounded-xl shadow-2xl flex flex-col sm:flex-row gap-2"
            >
              <div className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-slate-300">
                <Video size={18} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Paste YouTube, podcast or video link..."
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  className="bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-500 w-full text-sm"
                />
              </div>
              <Button type="submit" size="sm" className="shrink-0 font-medium">
                Generate Clips
              </Button>
            </motion.form>

            {/* Supported platforms pills */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mr-2">Optimized For</span>
              {PLATFORMS.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card border border-surface-border text-xs text-slate-300"
                >
                  <span>{p.icon}</span>
                  <span className="font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          STATS ROW
          ===================================================================== */}
      <section className="py-12 border-y border-surface-border bg-bg-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-surface-card/50 border border-surface-border">
                <div className="text-3xl sm:text-4xl font-extrabold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm font-semibold text-slate-200 mb-1">{stat.label}</div>
                <div className="text-xs text-slate-400">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          FEATURES GRID
          ===================================================================== */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="brand" className="mb-3">Engineered For Growth</Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Everything You Need to Dominate Short-Form
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Stop spending 8 hours cutting podcasts manually. ClipForge analyzes audio pacing, extracts the hook, adds dynamic subtitles, and renders ready-to-publish vertical clips.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card key={idx} hover className="p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-brand-600/15 border border-brand-500/20 flex items-center justify-center text-brand-400">
                        <Icon size={24} />
                      </div>
                      <Badge variant="default">{feature.badge}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-surface-border flex items-center text-xs font-semibold text-brand-400 group cursor-pointer">
                    Explore feature <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          HOW IT WORKS
          ===================================================================== */}
      <section className="py-24 bg-bg-2 border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="info" className="mb-3">Streamlined Workflow</Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              From Raw Footage to Viral Clip in 4 Steps
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Our automated processing pipeline takes the heavy lifting out of editing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, idx) => {
              const Icon = s.icon
              return (
                <div key={idx} className="relative p-6 rounded-2xl bg-surface-card border border-surface-border flex flex-col">
                  <div className="text-4xl font-black text-brand-500/20 mb-4">{s.step}</div>
                  <div className="w-10 h-10 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed flex-1">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          PRICING PREVIEW
          ===================================================================== */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="brand" className="mb-3">Transparent Plans</Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Start Free, Scale as You Grow
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              No hidden fees. Full access to AI transcription and vertical reframing from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <Card className="p-8 flex flex-col justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-400 mb-2">Free Plan</div>
                <div className="text-4xl font-extrabold text-white mb-4">₹0<span className="text-sm text-slate-500 font-normal"> /mo</span></div>
                <p className="text-xs text-slate-400 mb-6">Perfect for trying out the AI pipeline on personal clips.</p>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> 5 video uploads / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> 30 min audio transcription</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> 10 rendered MP4 exports</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> 720p/1080p resolution</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Basic caption presets</li>
                </ul>
              </div>
              <div className="mt-8">
                <Link to="/signup" className="w-full block">
                  <Button variant="outline" className="w-full">Get Started Free</Button>
                </Link>
              </div>
            </Card>

            {/* Creator (Popular) */}
            <Card glow className="p-8 flex flex-col justify-between border-brand-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 text-white text-xs font-bold uppercase tracking-wider shadow-brand">
                  Most Popular
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-brand-300 mb-2">Creator</div>
                <div className="text-4xl font-extrabold text-white mb-4">₹999<span className="text-sm text-slate-500 font-normal"> /mo</span></div>
                <p className="text-xs text-slate-400 mb-6">For independent podcasters, YouTubers & streamers.</p>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> 50 video uploads / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> 300 min transcription</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> 100 1080p exports</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Custom Brand Kit & fonts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Silence & filler word remover</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Priority processing queue</li>
                </ul>
              </div>
              <div className="mt-8">
                <Link to="/signup" className="w-full block">
                  <Button className="w-full">Upgrade to Creator</Button>
                </Link>
              </div>
            </Card>

            {/* Pro */}
            <Card className="p-8 flex flex-col justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-400 mb-2">Pro Agency</div>
                <div className="text-4xl font-extrabold text-white mb-4">₹2,499<span className="text-sm text-slate-500 font-normal"> /mo</span></div>
                <p className="text-xs text-slate-400 mb-6">For media agencies managing multiple client channels.</p>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> 200 video uploads / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> 1,000 min transcription</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Unlimited 1080p exports</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Multiple brand kits & logos</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Video translator (50+ languages)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Content calendar scheduler</li>
                </ul>
              </div>
              <div className="mt-8">
                <Link to="/signup" className="w-full block">
                  <Button variant="outline" className="w-full">Start Pro Trial</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FAQ ACCORDION
          ===================================================================== */}
      <section className="py-24 bg-bg-2 border-t border-surface-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="warning" className="mb-3">Answers</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400">Everything you need to know about the product and technology.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={index}
                  className="rounded-xl border border-surface-border bg-surface-card overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-slate-100 hover:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${
                        isOpen ? 'rotate-180 text-brand-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-surface-border/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          BOTTOM CTA
          ===================================================================== */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-brand-900/50 via-surface-card to-accent-950/50 border border-brand-500/30 p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="hero-blob w-72 h-72 bg-brand-500 top-0 left-1/3" />
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 relative z-10">
              Ready to Forge Your First Viral Clip?
            </h2>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto mb-8 relative z-10">
              Join thousands of creators turning long footage into automated Reels, TikToks, and Shorts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link to="/signup">
                <Button size="lg" className="px-8 py-4 font-bold text-base shadow-brand">
                  Create Your Free Account →
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="secondary" size="lg" className="px-6 py-4 text-base">
                  View Full Feature Matrix
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
