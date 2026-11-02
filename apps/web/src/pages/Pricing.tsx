import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Check, X, HelpCircle, Sparkles } from 'lucide-react'

const TIERS = [
  {
    id: 'free',
    name: 'Free Starter',
    description: 'Perfect for trying the AI pipeline on personal content.',
    monthlyPrice: 0,
    annualPrice: 0,
    popular: false,
    cta: 'Start Free',
    href: '/signup',
    features: [
      { name: 'Video Uploads / month', val: '5 videos' },
      { name: 'Transcription Minutes', val: '30 mins' },
      { name: 'Rendered MP4 Exports', val: '10 exports' },
      { name: 'Max Upload Size', val: '250 MB' },
      { name: 'Max Video Length', val: '30 mins' },
      { name: 'Aspect Ratios', val: '9:16, 16:9, 1:1' },
      { name: 'Caption Styles', val: '3 basic presets' },
      { name: 'Watermark', val: 'None' },
      { name: 'Brand Kits', val: '0' },
      { name: 'Silence Remover', val: false },
      { name: 'Video Translator', val: false },
      { name: 'Priority Support', val: false },
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'For active YouTubers, solo podcasters and streamers.',
    monthlyPrice: 999,
    annualPrice: 799,
    popular: true,
    cta: 'Start Creator',
    href: '/signup?plan=creator',
    features: [
      { name: 'Video Uploads / month', val: '50 videos' },
      { name: 'Transcription Minutes', val: '300 mins' },
      { name: 'Rendered MP4 Exports', val: '100 exports' },
      { name: 'Max Upload Size', val: '500 MB' },
      { name: 'Max Video Length', val: '2 hours' },
      { name: 'Aspect Ratios', val: 'All ratios' },
      { name: 'Caption Styles', val: 'All 15+ presets' },
      { name: 'Watermark', val: 'None' },
      { name: 'Brand Kits', val: '1 custom kit' },
      { name: 'Silence Remover', val: true },
      { name: 'Video Translator', val: '5 languages' },
      { name: 'Priority Support', val: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For media brands and high-volume daily creators.',
    monthlyPrice: 2499,
    annualPrice: 1999,
    popular: false,
    cta: 'Start Pro',
    href: '/signup?plan=pro',
    features: [
      { name: 'Video Uploads / month', val: '200 videos' },
      { name: 'Transcription Minutes', val: '1,000 mins' },
      { name: 'Rendered MP4 Exports', val: '500 exports' },
      { name: 'Max Upload Size', val: '1 GB' },
      { name: 'Max Video Length', val: '4 hours' },
      { name: 'Aspect Ratios', val: 'All ratios' },
      { name: 'Caption Styles', val: 'Custom CSS/Fonts' },
      { name: 'Watermark', val: 'None' },
      { name: 'Brand Kits', val: '5 custom kits' },
      { name: 'Silence Remover', val: true },
      { name: 'Video Translator', val: '50+ languages' },
      { name: 'Priority Support', val: true },
    ],
  },
  {
    id: 'team',
    name: 'Team / Agency',
    description: 'For creative agencies managing multiple clients.',
    monthlyPrice: 4999,
    annualPrice: 3999,
    popular: false,
    cta: 'Contact Sales',
    href: '/contact',
    features: [
      { name: 'Video Uploads / month', val: '1,000 videos' },
      { name: 'Transcription Minutes', val: '5,000 mins' },
      { name: 'Rendered MP4 Exports', val: 'Unlimited' },
      { name: 'Max Upload Size', val: '2 GB' },
      { name: 'Max Video Length', val: '8 hours' },
      { name: 'Aspect Ratios', val: 'All + custom' },
      { name: 'Caption Styles', val: 'Full custom studio' },
      { name: 'Watermark', val: 'None' },
      { name: 'Brand Kits', val: 'Unlimited' },
      { name: 'Silence Remover', val: true },
      { name: 'Video Translator', val: '50+ languages' },
      { name: 'Priority Support', val: 'Dedicated Slack' },
    ],
  },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="brand" className="mb-3">Transparent & Predictable</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
            Simple Plans for <span className="gradient-text">Serious Creators</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Start for ₹0. Upgrade when your channel or client workload scales up.
          </p>

          {/* Toggle Billing Frequency */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-full bg-surface-card border border-surface-border">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !annual ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                annual ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual Billing <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {TIERS.map((tier) => {
            const price = annual ? tier.annualPrice : tier.monthlyPrice
            return (
              <Card
                key={tier.id}
                glow={tier.popular}
                className={`p-6 flex flex-col justify-between relative ${
                  tier.popular ? 'border-brand-500 bg-surface-card/90 shadow-brand' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                      Most Popular
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                  <p className="text-xs text-slate-400 min-h-[32px] mb-4">{tier.description}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-extrabold text-white">
                      {price === 0 ? '₹0' : `₹${price.toLocaleString('en-IN')}`}
                    </span>
                    <span className="text-xs text-slate-500 font-medium"> / month</span>
                    {annual && price > 0 && (
                      <div className="text-[11px] text-emerald-400 mt-0.5">Billed annually</div>
                    )}
                  </div>
                  <div className="space-y-2.5 pt-4 border-t border-surface-border mb-6">
                    {tier.features.slice(0, 7).map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{f.name}</span>
                        <span className="font-semibold text-slate-200">
                          {typeof f.val === 'boolean' ? (
                            f.val ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-slate-600" />
                          ) : (
                            f.val
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Link to={tier.href} className="w-full block">
                    <Button variant={tier.popular ? 'brand' : 'outline'} className="w-full font-semibold text-xs">
                      {tier.cta}
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-16 bg-surface-card border border-surface-border rounded-2xl p-6 md:p-10">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Full Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-surface-border text-slate-400">
                  <th className="py-3 px-4 font-semibold">Capability</th>
                  <th className="py-3 px-4 font-semibold text-center">Free</th>
                  <th className="py-3 px-4 font-semibold text-center text-brand-300">Creator</th>
                  <th className="py-3 px-4 font-semibold text-center">Pro</th>
                  <th className="py-3 px-4 font-semibold text-center">Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {TIERS[0].features.map((feature, fIdx) => (
                  <tr key={fIdx} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-medium">{feature.name}</td>
                    {TIERS.map((t) => {
                      const val = t.features[fIdx].val
                      return (
                        <td key={t.id} className="py-3 px-4 text-center text-slate-200">
                          {typeof val === 'boolean' ? (
                            val ? (
                              <Check size={16} className="text-emerald-400 mx-auto" />
                            ) : (
                              <X size={16} className="text-slate-600 mx-auto" />
                            )
                          ) : (
                            <span>{val}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
