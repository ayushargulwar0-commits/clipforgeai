import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck, Mail } from 'lucide-react'

export default function Terms() {
  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" className="mb-3">Legal & Terms</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-sm">
            Last Updated: November 20, 2026 • Effective Date: November 20, 2026
          </p>
        </div>

        <Card className="p-8 sm:p-12 space-y-10 text-slate-300 text-sm leading-relaxed border-surface-border bg-surface-card">
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-200 text-xs sm:text-sm">
            <strong>Welcome to ClipForge AI.</strong> Please review these Terms of Service carefully before using our website and video processing software. By using the platform, you agree to these terms.
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText size={20} className="text-brand-400" />
              1. Acceptance of Terms
            </h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo; or &ldquo;you&rdquo;) and <strong>ClipForge AI</strong> (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) concerning your access to and use of the website located at{' '}
              <a href="https://clipforgeai.online" className="text-brand-400 underline">https://clipforgeai.online</a>, as well as any related media channels, web applications, and services (collectively, the &ldquo;Service&rdquo;).
            </p>
            <p>
              By accessing or using the Service, you signify your irrevocable agreement to be bound by these Terms. If you do not agree to all terms and conditions, you must discontinue using our platform immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">2. Description of the Service</h2>
            <p>
              ClipForge AI is an automated video repurposing and AI editing SaaS platform designed for content creators, agencies, podcasters, and educators. Our service features automated speech transcription (powered by faster-whisper), video highlight identification, aspect ratio reframing (9:16 portrait, 1:1 square, 4:5 vertical), kinetic animated subtitle generation, video trimming, and high-definition MP4 video rendering.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-400" />
              3. User Content & Intellectual Property Ownership
            </h2>
            <p>
              <strong>You Own Your Content:</strong> ClipForge AI claims <strong>no ownership rights</strong> over any source videos, audio tracks, imagery, or creative assets that you upload, process, or render on our platform. All rights, title, and intellectual property in your source material and generated exported clips remain exclusively yours.
            </p>
            <p>
              <strong>Your Warranties:</strong> You represent and warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs sm:text-sm">
              <li>You own or possess the necessary licenses, rights, and permissions to submit and process your uploaded videos and audio files.</li>
              <li>Your uploaded content does not infringe upon any third-party copyright, trademark, privacy right, or intellectual property right.</li>
              <li>You grant ClipForge AI a limited, temporary, non-exclusive license solely to host, cache, transcribe, and render your video files as strictly required to deliver the Service to you.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-400" />
              4. Prohibited Uses & Acceptable Behavior
            </h2>
            <p>When using ClipForge AI, you agree that you will not:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs sm:text-sm">
              <li>Upload or distribute content that is illegal, defamatory, harmful, hateful, harassing, violent, or sexually explicit.</li>
              <li>Circumvent, disable, or tamper with security-related features, authentication tokens, rate limits, or export quotas.</li>
              <li>Engage in automated scraping, mass data harvesting, or denial-of-service attacks against our infrastructure.</li>
              <li>Use the Service to produce deceptive deepfakes or impersonate individuals without consent.</li>
              <li>Violate applicable local, state, national, or international laws and regulations.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">5. Account Registration & Security</h2>
            <p>
              To access specific features such as clip saving, custom brand presets, and cloud rendering, you must register an account. You agree to provide accurate, complete information and maintain the confidentiality of your account credentials. You are responsible for all activities that occur under your account.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">6. Subscriptions, Payments & Fair Use</h2>
            <p>
              ClipForge AI provides a free starter plan and optional paid monthly subscriptions with elevated transcription limits and render concurrency. Subscriptions renew automatically unless cancelled prior to the end of the current billing cycle. All transactions are securely processed through authorized PCI-compliant payment gateways.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">7. Advertising & Google AdSense</h2>
            <p>
              To support free creator accounts, ClipForge AI displays non-intrusive advertisements served by Google AdSense and third-party advertising networks. By using the site, you acknowledge that Google and third-party partners may use cookies to serve ads based on prior visits, as described in our <a href="/privacy" className="text-brand-400 underline">Privacy Policy</a> and <a href="/cookie-policy" className="text-brand-400 underline">Cookie Policy</a>.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">8. Disclaimer of Warranties & Limitation of Liability</h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLIPFORGE AI AND ITS FOUNDERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES RESULTING FROM YOUR ACCESS TO OR INABILITY TO USE THE SERVICE, INCLUDING LOSS OF DATA OR INTERRUPTIONS.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account or restrict your access to the Service at our sole discretion, without prior notice, for conduct that violates these Terms or harms other users or the platform.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-4 pt-6 border-t border-surface-border">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail size={20} className="text-brand-400" />
              10. Contact Us
            </h2>
            <p>
              If you have any questions or feedback regarding these Terms of Service, please contact us:
            </p>
            <div className="p-4 rounded-xl bg-surface-hover border border-surface-border text-xs sm:text-sm space-y-1 text-slate-300">
              <p><strong>ClipForge AI</strong> (https://clipforgeai.online)</p>
              <p><strong>Publisher:</strong> Ayush Argulwar</p>
              <p><strong>Inquiries:</strong> <a href="mailto:ayushargulwar77@gmail.com" className="text-brand-400 underline">ayushargulwar77@gmail.com</a></p>
              <p><strong>Support:</strong> <a href="mailto:support@clipforgeai.online" className="text-brand-400 underline">support@clipforgeai.online</a></p>
            </div>
          </section>
        </Card>
      </div>
    </PublicLayout>
  )
}
