import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { ShieldCheck, HeartHandshake, Zap, Sparkles, Terminal } from 'lucide-react'

export default function About() {
  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge variant="brand" className="mb-3">Our Mission</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
            Democratizing <span className="gradient-text">Video Repurposing</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            We believe creators, educators, and indie founders shouldn&rsquo;t need a massive post-production team or expensive closed AI subscriptions to turn long recordings into engaging short clips.
          </p>
        </div>

        {/* Story */}
        <div className="p-8 md:p-12 rounded-3xl bg-surface-card border border-surface-border mb-16 space-y-6 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-2xl font-bold text-white">Why We Built ClipForge AI</h2>
          <p>
            Short-form video has become the single most effective channel for creator discovery and business growth. Yet, the process of finding the right 30 seconds inside an hour-long recording, cutting dead air, reframing horizontal shots for vertical screens, and syncing subtitles is tedious and repetitive.
          </p>
          <p>
            Many commercial platforms charge steep monthly fees and rely on closed-source APIs that sell your footage to third parties. We set out to build an original, production-grade alternative based on the finest open-source machine learning and media processing tools: faster-whisper, OpenCV, and FFmpeg.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center">
              <Zap size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Open Source First</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We stand on the shoulders of giants. Every AI model and rendering algorithm can run locally on standard hardware without vendor lock-in.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Zero Compromise on Privacy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your source videos and transcripts remain completely private. We never sell your media or use user videos for public model training.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-accent-600/20 text-accent-400 flex items-center justify-center">
              <HeartHandshake size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Fair Pricing for All</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our free starter tier remains forever free with real exports. As you scale, our paid tiers are priced transparently for solo creators.
            </p>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/signup">
            <Button size="lg" className="px-8 py-4 font-bold shadow-brand">
              Join the Movement — Start Free →
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  )
}
