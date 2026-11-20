import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Shield, Lock, Eye, Cookie, Server, CheckCircle2, Mail } from 'lucide-react'
import { Youtube } from '@/components/ui/Icons'

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'ayushargulwar77@gmail.com'

export default function Privacy() {
  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" className="mb-3">Legal & Compliance</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm">
            Last Updated: November 21, 2026 • Effective Date: November 21, 2026
          </p>
        </div>

        {/* Content Box */}
        <Card className="p-8 sm:p-12 space-y-10 text-slate-300 text-sm leading-relaxed border-surface-border bg-surface-card">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-200 text-xs sm:text-sm">
            <strong>Important Summary:</strong> ClipForge AI respects your privacy. We do not sell your personal data or uploaded media. This Privacy Policy explains our collection, usage, and protection practices, including our integration with YouTube API Services and Google AdSense.
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield size={20} className="text-brand-400" />
              1. Introduction
            </h2>
            <p>
              Welcome to <strong>ClipForge AI</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), operating the website located at{' '}
              <a href="https://clipforgeai.online" className="text-brand-400 underline">https://clipforgeai.online</a>. We provide an automated video repurposing and subtitle editor platform designed for creators and media teams.
            </p>
            <p>
              This Privacy Policy explains what personal data and media assets we collect, how we store and process that information, and how you can exercise your privacy and data deletion rights.
            </p>
          </section>

          {/* Section 2: YouTube API Services Disclosures */}
          <section className="space-y-4 p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
            <h2 className="text-xl font-bold text-red-200 flex items-center gap-2">
              <Youtube size={20} className="text-red-400" />
              2. YouTube API Services &amp; Google User Data
            </h2>
            <p className="text-slate-200">
              <strong>ClipForge AI uses YouTube API Services</strong> to allow creators to import permitted video footage, authorize their YouTube channel, and publish or schedule rendered vertical video Shorts directly to their channel.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-xs sm:text-sm">
              <li>
                <strong>Google Privacy Policy:</strong> By using our YouTube integration features, you acknowledge and agree that your use is subject to Google&rsquo;s policies. Please review the{' '}
                <a
                  href="http://www.google.com/policies/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-medium"
                >
                  Google Privacy Policy (http://www.google.com/policies/privacy)
                </a>.
              </li>
              <li>
                <strong>YouTube API Data Collected:</strong> When you connect your YouTube account, we collect and store: your account email, YouTube channel title, channel handle, channel ID, and OAuth access and refresh tokens. We use these tokens strictly to upload approved videos, read upload quota status, and retrieve the resulting video ID.
              </li>
              <li>
                <strong>Revoking Access:</strong> You can revoke ClipForge AI&rsquo;s access to your YouTube data at any time via the Google Security Settings permissions page at:{' '}
                <a
                  href="https://security.google.com/settings/security/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-medium"
                >
                  https://security.google.com/settings/security/permissions
                </a>.
              </li>
              <li>
                <strong>No Third-Party Sharing:</strong> We do not transfer, sell, or share your Google user data or YouTube tokens with external advertising networks or data brokers.
              </li>
            </ul>
          </section>

          {/* Section 3: What Data We Collect */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye size={20} className="text-brand-400" />
              3. What Data Is Collected
            </h2>
            <p>We collect and process the following categories of data:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>
                <strong>Account Email:</strong> Your email address provided during registration or OAuth sign-in, used for authentication, account notices, and customer support.
              </li>
              <li>
                <strong>YouTube Channel Info &amp; Tokens:</strong> Channel name, channel ID, handle, and OAuth tokens obtained when you explicitly connect your YouTube channel for auto-publishing.
              </li>
              <li>
                <strong>Uploaded or Imported Videos:</strong> Video and audio files (MP4, MOV, WebM) that you upload or URLs you import, ingested solely to generate speech transcripts, identify highlights, crop frames to 9:16, burn captions, and export rendered clips.
              </li>
              <li>
                <strong>Usage Logs:</strong> System logs, IP addresses, browser types, timestamps, export job statuses, and error diagnostics to maintain system security and service availability.
              </li>
            </ul>
          </section>

          {/* Section 4: Data Deletion within 30 Days */}
          <section className="space-y-4 p-6 rounded-2xl bg-surface-hover border border-surface-border">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock size={20} className="text-emerald-400" />
              4. Data Retention &amp; Deletion of User Data on Request
            </h2>
            <p className="text-slate-300">
              We retain user media and processing data only as long as necessary to deliver the requested service:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-xs sm:text-sm">
              <li>
                <strong>Temporary Media:</strong> Intermediate audio files, temporary frame extracts, and processing caches are purged automatically once rendering completes.
              </li>
              <li>
                <strong>Deletion on Request Within 30 Days:</strong> You may request the permanent deletion of your account, email address, uploaded footage, rendered clips, and stored YouTube API tokens at any time. We will completely erase all associated personal data from our servers and storage systems within <strong>30 days</strong> of receiving your request.
              </li>
              <li>
                <strong>How to Request Deletion:</strong> Send an email with your account email address to{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-400 underline font-medium">
                  {SUPPORT_EMAIL}
                </a>{' '}
                with the subject line &ldquo;Data Deletion Request&rdquo;.
              </li>
            </ul>
          </section>

          {/* Section 5: Google AdSense Disclosures */}
          <section className="space-y-4 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <h2 className="text-xl font-bold text-amber-200 flex items-center gap-2">
              <Cookie size={20} className="text-amber-400" />
              5. Advertising &amp; Google AdSense Cookies
            </h2>
            <p className="text-slate-300">
              We display advertisements through <strong>Google AdSense</strong> to support free access to our AI tools. In accordance with Google publisher requirements:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-xs sm:text-sm">
              <li>
                Third-party vendors, including Google LLC, use cookies (including the DoubleClick cookie) to serve ads based on prior visits to this website (<code>clipforgeai.online</code>) or other websites on the Internet.
              </li>
              <li>
                Google&rsquo;s use of advertising cookies enables it and its partners to serve personalized ads to users based on browsing activity.
              </li>
              <li>
                You may opt out of personalized advertising by visiting the{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-medium"
                >
                  Google Ads Settings page (https://www.google.com/settings/ads)
                </a>{' '}
                or the{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-medium"
                >
                  aboutads.info choices page
                </a>.
              </li>
            </ul>
          </section>

          {/* Section 6: Contact Information */}
          <section className="space-y-4 pt-6 border-t border-surface-border">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail size={20} className="text-brand-400" />
              6. Contact Us
            </h2>
            <p>
              If you have questions regarding this Privacy Policy or wish to request data access or deletion, please reach out to us:
            </p>
            <div className="p-4 rounded-xl bg-surface-hover border border-surface-border text-xs sm:text-sm space-y-1.5 text-slate-300">
              <p><strong>Platform:</strong> ClipForge AI (https://clipforgeai.online)</p>
              <p><strong>Contact Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-400 underline">{SUPPORT_EMAIL}</a></p>
              <p><strong>Response Time:</strong> Inquiries and data deletion requests are acknowledged within 48 hours and processed within 30 days.</p>
            </div>
          </section>
        </Card>
      </div>
    </PublicLayout>
  )
}
