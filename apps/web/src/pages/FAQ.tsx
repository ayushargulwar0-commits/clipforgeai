import { useState } from 'react'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { ChevronDown, MessageSquare } from 'lucide-react'

const CATEGORIES = [
  {
    category: 'Product & Capabilities',
    faqs: [
      {
        q: 'How does ClipForge AI differ from manual video editors like Premiere Pro?',
        a: 'Traditional NLE software requires you to manually scrub through hours of audio, cut clips, keyframe vertical reframing, and hand-type captions. ClipForge automates this entire pipeline using AI transcription, speech hook detection, and automatic 9:16 cropping in minutes.',
      },
      {
        q: 'Can I manually tweak the clips after the AI generates them?',
        a: 'Yes! The AI produces candidates as suggestions. In our Browser Video Editor, you can adjust start and end timestamps, edit transcript text, customize caption styles and position, and select different aspect ratios before final export.',
      },
      {
        q: 'What languages are supported for automatic captions?',
        a: 'Over 90 languages are supported through faster-whisper, including English, Hindi, Spanish, French, German, Japanese, Chinese, Arabic, Portuguese, and Russian.',
      },
    ],
  },
  {
    category: 'Billing & Pricing',
    faqs: [
      {
        q: 'Is the Free Starter plan really free forever?',
        a: 'Yes. You receive 5 video uploads, 30 minutes of transcription, and 10 MP4 exports every single month without entering a credit card.',
      },
      {
        q: 'What happens if I exceed my monthly processing limit?',
        a: 'You can easily upgrade to Creator or Pro tiers at any time, or wait for your monthly allocation to renew on the 1st of each calendar month.',
      },
      {
        q: 'Do you offer custom plans for media agencies or universities?',
        a: 'Yes! Our Team plan supports custom user seats, dedicated queue concurrency, and volume storage. Reach out through our Contact page for enterprise terms.',
      },
    ],
  },
  {
    category: 'Technical & Infrastructure',
    faqs: [
      {
        q: 'Where are my uploaded videos stored?',
        a: 'In local development, files are stored securely in the local filesystem storage adapter. In cloud production, videos are stored in private Supabase Storage buckets secured by Row Level Security (RLS).',
      },
      {
        q: 'Can I run ClipForge completely on my own server?',
        a: 'Yes. The backend is 100% open-source Python (FastAPI, faster-whisper, PySceneDetect, FFmpeg). You can self-host the backend worker on any Linux or Windows workstation.',
      },
    ],
  },
]

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ '0-0': true })

  const toggle = (catIdx: number, faqIdx: number) => {
    const key = `${catIdx}-${faqIdx}`
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="brand" className="mb-3">Knowledge Base</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Find answers to common questions about features, pricing, and our open-source AI architecture.
          </p>
        </div>

        <div className="space-y-12">
          {CATEGORIES.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-4">
              <h2 className="text-lg font-bold text-brand-300 uppercase tracking-wider text-xs">
                {cat.category}
              </h2>
              <div className="space-y-3">
                {cat.faqs.map((faq, faqIdx) => {
                  const key = `${catIdx}-${faqIdx}`
                  const isOpen = !!openItems[key]
                  return (
                    <div
                      key={faqIdx}
                      className="rounded-xl border border-surface-border bg-surface-card overflow-hidden"
                    >
                      <button
                        onClick={() => toggle(catIdx, faqIdx)}
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
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-16 p-8 rounded-2xl bg-surface-card border border-surface-border text-center flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <h3 className="text-lg font-bold text-white mb-1">Still have questions?</h3>
            <p className="text-xs text-slate-400">Our engineering and creator support team is here to help.</p>
          </div>
          <Link to="/contact">
            <Button variant="outline" className="gap-2 text-xs">
              <MessageSquare size={14} /> Get in Touch
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  )
}
