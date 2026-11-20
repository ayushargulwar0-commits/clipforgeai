import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { FileText, ShieldCheck, AlertTriangle, Mail } from 'lucide-react'
import { Youtube } from '@/components/ui/Icons'

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'ayushargulwar77@gmail.com'

export default function Terms() {
  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" className="mb-3">Legal &amp; Terms</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-sm">
            Last Updated: November 21, 2026 • Effective Date: November 21, 2026
          </p>
        </div>

        <Card className="p-8 sm:p-12 space-y-10 text-slate-300 text-sm leading-relaxed border-surface-border bg-surface-card">
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-200 text-xs sm:text-sm">
            <strong>Welcome to ClipForge AI.</strong> Please review these Terms of Service carefully before accessing or using our website and video processing software. By using the platform, you agree to these Terms.
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText size={20} className="text-brand-400" />
              1. Acceptance of Terms
            </h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) form a binding legal agreement between you (&ldquo;User&rdquo; or &ldquo;you&rdquo;) and <strong>ClipForge AI</strong> (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) concerning your access to and use of{' '}
              <a href="https://clipforgeai.online" className="text-brand-400 underline">https://clipforgeai.online</a> and all related services, tools, and applications.
            </p>
            <p>
              By accessing, browsing, or using ClipForge AI, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to all terms, you must discontinue using our services immediately.
            </p>
          </section>

          {/* Section 2: YouTube Terms of Service Agreement */}
          <section className="space-y-4 p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
            <h2 className="text-xl font-bold text-red-200 flex items-center gap-2">
              <Youtube size={20} className="text-red-400" />
              2. YouTube Terms of Service Agreement
            </h2>
            <p className="text-slate-200">
              ClipForge AI integrates with YouTube API Services to allow you to connect your channel, check upload quotas, and publish or schedule short-form video content directly to YouTube.
            </p>
            <div className="p-4 rounded-xl bg-surface border border-surface-border text-xs sm:text-sm text-slate-300 space-y-2">
              <p>
                <strong>Agreement to YouTube Terms:</strong> By using any YouTube integration feature within ClipForge AI, <strong>you expressly agree to be bound by the YouTube Terms of Service</strong>, available at:{' '}
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-semibold"
                >
                  https://www.youtube.com/t/terms
                </a>.
              </p>
              <p>
                You also acknowledge that your use is subject to Google&rsquo;s Privacy Policy located at{' '}
                <a
                  href="http://www.google.com/policies/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-semibold"
                >
                  http://www.google.com/policies/privacy
                </a>.
              </p>
            </div>
          </section>

          {/* Section 3: Permitted Content & User Rights */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-400" />
              3. Permitted Content &amp; Media Ownership
            </h2>
            <p>
              <strong>You May Only Process Videos You Own or Have Permission to Use:</strong> You explicitly represent and warrant that you own or hold all required intellectual property rights, licenses, releases, and permissions for any video footage, audio track, or visual asset that you upload, paste, or import into ClipForge AI.
            </p>
            <p>
              You must not upload, import, edit, or publish copyrighted videos, third-party intellectual property, or protected broadcasts without express written consent from the rights holder.
            </p>
            <p>
              <strong>You Retain Ownership:</strong> ClipForge AI claims no ownership or intellectual property rights over your uploaded footage or your rendered export files. All rights remain exclusively yours.
            </p>
          </section>

          {/* Section 4: Acceptable Use Policy */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-400" />
              4. Acceptable Use Policy
            </h2>
            <p>When using ClipForge AI, you agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300 text-xs sm:text-sm">
              <li>Upload or process illegal, defamatory, hateful, abusive, sexually explicit, or violent content.</li>
              <li>Use the Service to generate non-consensual deepfakes, false impersonations, or misleading deceptive media.</li>
              <li>Attempt to disrupt, exploit, overload, reverse engineer, or probe the vulnerabilities of our infrastructure or APIs.</li>
              <li>Bypass or circumvent rate limits, export counters, user authentication systems, or resource allocations.</li>
              <li>Violate the Community Guidelines or terms of any third-party social media platform, including YouTube, Instagram, or TikTok.</li>
            </ul>
          </section>

          {/* Section 5: No Guarantee of Results */}
          <section className="space-y-4 p-6 rounded-2xl bg-surface-hover border border-surface-border">
            <h2 className="text-xl font-bold text-white">5. No Guarantee of Results</h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              ClipForge AI provides automated video reframing, speech transcription, highlight detection, and caption burning tools. <strong>We make no guarantee of specific results, view counts, engagement levels, subscriber growth, algorithm placement, or revenue</strong> arising from videos created or published through our platform. Algorithmic distribution and reach on third-party platforms remain solely dependent on those respective platforms and their independent ranking algorithms.
            </p>
            <p className="text-slate-400 text-xs mt-2">
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
            </p>
          </section>

          {/* Section 6: How to Contact Us */}
          <section className="space-y-4 pt-6 border-t border-surface-border">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail size={20} className="text-brand-400" />
              6. How to Contact Us
            </h2>
            <p>
              If you have any questions, feedback, or legal inquiries regarding these Terms of Service, please contact us:
            </p>
            <div className="p-4 rounded-xl bg-surface-hover border border-surface-border text-xs sm:text-sm space-y-1.5 text-slate-300">
              <p><strong>Platform:</strong> ClipForge AI (https://clipforgeai.online)</p>
              <p><strong>Support Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-400 underline">{SUPPORT_EMAIL}</a></p>
              <p><strong>Website:</strong> <a href="https://clipforgeai.online" className="text-brand-400 underline">https://clipforgeai.online</a></p>
            </div>
          </section>
        </Card>
      </div>
    </PublicLayout>
  )
}
