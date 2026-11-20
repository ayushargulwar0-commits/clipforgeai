import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Sparkles,
  ArrowRight,
  Upload,
  Scissors,
  Layers,
  ChevronDown,
  CheckCircle2,
  Share2,
  Volume2,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PublicLayout } from '@/components/layout/PublicLayout'

const PLATFORMS = [
  { name: 'YouTube Shorts', icon: '▶️', tag: '9:16 Vertical' },
  { name: 'Instagram Reels', icon: '📸', tag: '9:16 Vertical' },
  { name: 'TikTok', icon: '🎵', tag: '9:16 Vertical' },
  { name: 'Podcasts', icon: '🎙️', tag: 'Audiograms' },
]

// Real facts only - taken from defined code features
const FEATURES = [
  {
    icon: Layers,
    title: '9:16 Smart Crop',
    description: 'Convert standard horizontal 16:9 videos into full 9:16 vertical shorts with smart speaker centering and background blur.',
    badge: 'Reframing',
  },
  {
    icon: Volume2,
    title: 'Captions incl. Hindi',
    description: 'Auto-generate kinetic word-by-word animated captions with complete support for English and Devanagari Hindi fonts.',
    badge: 'Multi-lingual',
  },
  {
    icon: Scissors,
    title: 'In-Browser Editor',
    description: 'Fine-tune in/out trim points, adjust crop boundaries, style subtitles, and preview rendered frames in real time.',
    badge: 'Timeline Editor',
  },
  {
    icon: Share2,
    title: 'YouTube Auto-Publish',
    description: 'Connect your YouTube channel via Google OAuth to upload or schedule rendered 1080p Shorts directly to your channel.',
    badge: 'Direct Publishing',
  },
]

// 3-step workflow
const STEPS = [
  {
    step: '01',
    title: 'Paste URL or Upload',
    desc: 'Paste any YouTube link or upload MP4/MOV video footage up to 500MB.',
    icon: Upload,
  },
  {
    step: '02',
    title: 'AI Finds Viral Clips',
    desc: 'faster-whisper and NLP algorithms detect high-retention hooks and highlight timestamps.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'Edit and Publish',
    desc: 'Refine 9:16 crops, add animated captions with Hindi support, and publish directly to YouTube Shorts.',
    icon: Scissors,
  },
]

// Exactly 5 FAQs
const FAQS = [
  {
    q: 'Is ClipForge AI really free to start?',
    a: 'Yes. The Free Starter plan gives you 10 exports and 30 minutes of transcription processing every month at ₹0 without requiring a credit card.',
  },
  {
    q: 'What video formats and resolutions are supported?',
    a: 'We support MP4, MOV, WebM, and MKV files up to 4K resolution. Rendered clips are exported in crisp 1080p (1080x1920) with H.264 video and AAC audio.',
  },
  {
    q: 'How does the AI detect the best moments?',
    a: 'Our detection engine transcribes speech with word-level timestamps using faster-whisper, scoring hook strength, question-and-answer pairs, and audience retention markers to extract cohesive segments.',
  },
  {
    q: 'Can I customize captions and edit clips before exporting?',
    a: 'Yes. The built-in editor allows you to adjust trim in/out timestamps, switch between smart crop and split screen, customize subtitle font styles (including Hindi Devanagari fonts), and preview the output in real time.',
  },
  {
    q: 'How does YouTube auto-publishing work?',
    a: 'ClipForge AI integrates with YouTube API Services via secure Google OAuth. Once you approve the connection, you can publish or schedule your rendered 1080p Shorts directly to your YouTube channel.',
  },
]

// Real plans from code
const PLANS = [
  {
    name: 'Free Starter',
    price: '₹0',
    period: '/mo',
    desc: 'Ideal for trying out the AI clipping engine.',
    features: [
      '5 video uploads / month',
      '30 min transcription processing',
      '10 rendered 1080p exports / mo',
      '9:16 smart crop reframing',
      'Auto captions (English & Hindi)',
      'Direct YouTube export shortcut',
    ],
    buttonText: 'Start Free',
    buttonVariant: 'secondary' as const,
  },
  {
    name: 'Creator',
    price: '₹999',
    period: '/mo',
    desc: 'For active YouTube, Instagram and TikTok creators.',
    features: [
      '30 video uploads / month',
      '180 min transcription processing',
      '60 rendered 1080p exports / mo',
      'Priority rendering queue',
      'Full in-browser editor access',
      'Custom subtitle styling & fonts',
      'YouTube auto-publish & scheduler',
    ],
    buttonText: 'Get Creator Plan',
    buttonVariant: 'brand' as const,
    highlight: true,
  },
  {
    name: 'Pro',
    price: '₹2,499',
    period: '/mo',
    desc: 'For power creators and media agencies managing channels.',
    features: [
      '200 video uploads / month',
      '1,000 min transcription processing',
      'Unlimited 1080p exports',
      'Highest rendering priority',
      'Multiple brand presets & logos',
      'Multi-channel YouTube scheduling',
      'Dedicated email support',
    ],
    buttonText: 'Get Pro Plan',
    buttonVariant: 'secondary' as const,
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [quickUrl, setQuickUrl] = useState('')

  const handleQuickStart = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickUrl.trim()) return
    sessionStorage.setItem('cf_pending_url', quickUrl.trim())
    navigate(`/dashboard/clips?import=${encodeURIComponent(quickUrl.trim())}`)
  }

  // Schema.org SoftwareApplication JSON-LD (strictly NO fake ratings)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ClipForge AI',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    description: 'Transform long YouTube videos and recordings into viral short-form clips with AI reframing, auto captions, and in-browser editing.',
  }

  return (
    <PublicLayout>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* =====================================================================
          HERO SECTION
          ===================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-grid">
        <div className="hero-blob w-96 h-96 bg-brand-600 top-10 left-1/4" />
        <div className="hero-blob w-80 h-80 bg-accent-500 top-40 right-1/4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-surface-border text-xs font-medium text-brand-300 mb-6"
            >
              <Sparkles size={14} className="text-brand-400" />
              <span>AI Video Repurposing &amp; Subtitle Editor</span>
            </motion.div>

            {/* One-line promise headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6"
            >
              Turn Long Videos Into{' '}
              <span className="gradient-text block mt-1">Scroll-Stopping Shorts.</span>
            </motion.h1>

            {/* One-line promise subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
            >
              Transform long footage into vertical Shorts, Reels, and TikToks with smart 9:16 crop, kinetic captions, and direct YouTube publishing.
            </motion.p>

            {/* Primary Action Button: Start free */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 py-4 gap-2 font-semibold shadow-brand">
                  Start Free
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-6 py-4 gap-2">
                  View Pricing Plans
                </Button>
              </Link>
            </motion.div>

            {/* URL Input Form */}
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
                  placeholder="Paste YouTube or video link..."
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  className="bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-500 w-full text-sm"
                />
              </div>
              <Button type="submit" size="sm" className="shrink-0 font-medium">
                Generate Clips
              </Button>
            </motion.form>

            {/* Platforms */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mr-2">Optimized For</span>
              {PLATFORMS.map((p) => (
                <div
                  key={p.name}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-surface-border text-xs text-slate-300"
                >
                  <span>{p.icon}</span>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{p.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          HOW IT WORKS (3 STEPS)
          ===================================================================== */}
      <section className="py-24 bg-bg-2 border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="brand" className="mb-3">Simple Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              How It Works in 3 Steps
            </h2>
            <p className="text-slate-400">
              From long video to finished 9:16 Shorts with burned captions in under three minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => {
              const Icon = s.icon
              return (
                <Card key={s.step} className="p-8 relative overflow-hidden group hover:border-brand-500/50 transition-colors">
                  <div className="text-4xl font-black text-slate-800/80 mb-4 select-none group-hover:text-brand-500/20 transition-colors">
                    {s.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-5">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          FEATURES
          ===================================================================== */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="info" className="mb-3">Capabilities</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Built for Modern Video Creators
            </h2>
            <p className="text-slate-400">
              Everything needed to produce professional, high-retention short-form content.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <Card key={f.title} className="p-6 flex flex-col justify-between hover:border-brand-500/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-hover border border-surface-border text-brand-400 flex items-center justify-center">
                        <Icon size={20} />
                      </div>
                      <Badge variant="brand">{f.badge}</Badge>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          PRICING PLANS (TAKEN FROM DEFINED CODE)
          ===================================================================== */}
      <section className="py-24 bg-bg-2 border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="success" className="mb-3">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Start Free, Upgrade When You Grow
            </h2>
            <p className="text-slate-400">
              Honest, transparent pricing with no hidden fees or locked export watermarks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={`p-8 flex flex-col justify-between ${
                  plan.highlight ? 'border-brand-500/60 shadow-lg shadow-brand-500/10' : ''
                }`}
              >
                <div>
                  {plan.highlight && (
                    <Badge variant="brand" className="mb-3">Most Popular</Badge>
                  )}
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <div className="text-3xl font-extrabold text-white mb-2">
                    {plan.price}<span className="text-xs text-slate-400 font-normal">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6">{plan.desc}</p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <Link to="/signup" className="w-full block">
                    <Button
                      variant={plan.buttonVariant}
                      className="w-full font-semibold"
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          FAQ (EXACTLY 5 QUESTIONS)
          ===================================================================== */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="warning" className="mb-3">Answers</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400">Everything you need to know about ClipForge AI.</p>
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
          FINAL CALL TO ACTION
          ===================================================================== */}
      <section className="py-20 relative bg-bg-2 border-t border-surface-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-brand-900/40 via-surface-card to-accent-950/40 border border-brand-500/30 p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 relative z-10">
              Ready to Forge Your First Viral Clip?
            </h2>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto mb-8 relative z-10">
              Turn long video footage into automated 9:16 Shorts, Reels, and TikToks with kinetic captions today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link to="/signup">
                <Button size="lg" className="px-8 py-4 font-bold text-base shadow-brand">
                  Start Free Now →
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="secondary" size="lg" className="px-6 py-4 text-base">
                  View All Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
