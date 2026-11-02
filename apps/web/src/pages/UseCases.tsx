import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Link } from 'react-router-dom'
import {
  Mic,
  Tv,
  Gamepad2,
  GraduationCap,
  Briefcase,
  Megaphone,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

const USE_CASES = [
  {
    icon: Mic,
    title: 'Podcasts & Vodcasts',
    tag: 'Audio & Video Shows',
    problem: '1-2 hour episodes get lost in podcast feeds unless promoted on TikTok and Reels.',
    solution:
      'ClipForge finds the most dramatic statements, debate moments, and guest insights, adding animated captions so clips play flawlessly on silent social feeds.',
    metric: '10x more episode discovery',
  },
  {
    icon: Tv,
    title: 'YouTube Creators',
    tag: 'Long to Short',
    problem: 'Editing YouTube Shorts from 20-minute vlogs takes as much time as making the main video.',
    solution:
      'Upload your horizontal YouTube video, click Generate Clips, and let ClipForge convert key moments into 60-second vertical Shorts formatted for mobile.',
    metric: '300% faster YouTube Shorts output',
  },
  {
    icon: Gamepad2,
    title: 'Gamers & Streamers',
    tag: 'Twitch & YouTube Gaming',
    problem: '4-hour Twitch streams contain exciting clutch plays that are buried in hours of gameplay.',
    solution:
      'Stack your webcam over gameplay with split-screen vertical presets, trim the hype moments, and push straight to TikTok.',
    metric: '10+ clips per stream session',
  },
  {
    icon: GraduationCap,
    title: 'Educators & Course Creators',
    tag: 'EdTech & Knowledge',
    problem: 'Students have shorter attention spans and prefer bite-sized conceptual explainers.',
    solution:
      'Transform 45-minute lectures into focused 30-second micro-learning clips with prominent keyword highlighting.',
    metric: '94% higher lecture retention',
  },
  {
    icon: Briefcase,
    title: 'Webinars & B2B SaaS',
    tag: 'Lead Generation',
    problem: 'Product webinars and client interviews sit unviewed in gated landing pages.',
    solution:
      'Turn customer testimonials, product reveals, and industry keynote quotes into LinkedIn & Twitter video snippets with brand logos.',
    metric: '5x higher B2B engagement',
  },
  {
    icon: Megaphone,
    title: 'Agencies & Social Media Managers',
    tag: 'Agency Workflow',
    problem: 'Managing short-form clips for multiple clients creates an editing bottleneck.',
    solution:
      'Use multi-workspace isolation, reusable client brand kits, and automated batch rendering to deliver 50+ monthly shorts per client.',
    metric: 'Save 20 hours per client/month',
  },
]

export default function UseCases() {
  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge variant="brand" className="mb-3">Versatile Applications</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
            Built for Every <span className="gradient-text">Content Creator</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            See how podcasters, gamers, educators, and enterprise marketing teams use ClipForge AI to scale their organic reach.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {USE_CASES.map((uc, i) => {
            const Icon = uc.icon
            return (
              <Card key={i} hover className="p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center">
                      <Icon size={24} />
                    </div>
                    <Badge variant="default">{uc.tag}</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{uc.title}</h3>
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div>
                      <span className="font-semibold text-red-400 uppercase tracking-wider text-[10px] block mb-0.5">The Bottleneck</span>
                      <p className="text-slate-400">{uc.problem}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] block mb-0.5">ClipForge Solution</span>
                      <p className="text-slate-300">{uc.solution}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-300">{uc.metric}</span>
                  <Link to="/signup" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    Try now <ArrowRight size={12} />
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mt-20 text-center">
          <Link to="/signup">
            <Button size="lg" className="px-8 py-4 font-bold shadow-brand">
              Repurpose Your Content Today →
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  )
}
