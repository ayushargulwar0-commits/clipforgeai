import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Cookie, CheckCircle2, Shield, Settings, ExternalLink, Mail } from 'lucide-react'

export default function CookiePolicy() {
  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="brand" className="mb-3">Cookie Transparency</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Cookie Policy
          </h1>
          <p className="text-slate-400 text-sm">
            Last Updated: November 20, 2026 • Effective Date: November 20, 2026
          </p>
        </div>

        <Card className="p-8 sm:p-12 space-y-10 text-slate-300 text-sm leading-relaxed border-surface-border bg-surface-card">
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-200 text-xs sm:text-sm">
            <strong>About Cookies:</strong> This Cookie Policy explains what cookies are, how ClipForge AI (&ldquo;we&rdquo;, &ldquo;us&rdquo;) uses cookies and similar technologies on <strong>clipforgeai.online</strong>, and how you can manage your preferences, specifically regarding advertising cookies served by Google AdSense.
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cookie size={20} className="text-brand-400" />
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work efficiently, remember your preferences, provide secure log-in experiences, and provide reporting information to site operators and third-party advertising partners like Google.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield size={20} className="text-emerald-400" />
              2. How We Use Cookies
            </h2>
            <p>We use both first-party and third-party cookies for the following key purposes:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-hover border border-surface-border space-y-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" /> Strictly Necessary Cookies
                </h3>
                <p className="text-xs text-slate-400">
                  Essential for navigating the platform, authenticating your login session, preserving your active clip timeline edits, and keeping your account secure. These cannot be disabled.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-hover border border-surface-border space-y-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Settings size={16} className="text-brand-400" /> Preferences & Functionality
                </h3>
                <p className="text-xs text-slate-400">
                  Remember your interface choices such as subtitle font presets, aspect ratio defaults (9:16), dark mode settings, and notification states across browsing sessions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-hover border border-surface-border space-y-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-400" /> Performance & Analytics
                </h3>
                <p className="text-xs text-slate-400">
                  Help us understand how visitors interact with ClipForge AI by reporting error rates, page loading speeds, and rendering durations without identifying individual users.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-hover border border-surface-border space-y-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Cookie size={16} className="text-amber-400" /> Advertising & Targeting (Google AdSense)
                </h3>
                <p className="text-xs text-slate-400">
                  Used by Google and certified third-party ad vendors to deliver relevant ads based on prior browsing history, prevent the same ad from showing continuously, and measure ad performance.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: AdSense Specific Disclosures */}
          <section className="space-y-4 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <h2 className="text-xl font-bold text-amber-200">
              3. Google AdSense & DoubleClick Cookies
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm">
              Our site uses <strong>Google AdSense</strong> (Publisher ID: <code>pub-5485620248959858</code>) to deliver advertisements. Google uses cookies, such as the DoubleClick cookie, to serve ads based on your visit to <strong>clipforgeai.online</strong> and other sites on the web.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-xs sm:text-sm">
              <li>
                <strong>Interest-Based Ads:</strong> Cookies enable Google and its advertising partners to display ads tailored to your general interests and online activity.
              </li>
              <li>
                <strong>Opting Out:</strong> You can turn off personalized advertising at any time by visiting{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-medium inline-flex items-center gap-1"
                >
                  Google Ads Settings <ExternalLink size={12} />
                </a>.
              </li>
              <li>
                You can also opt out of participating third-party ad networks via the{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-medium inline-flex items-center gap-1"
                >
                  DAA WebChoices Tool <ExternalLink size={12} />
                </a>{' '}
                or the{' '}
                <a
                  href="https://www.youronlinechoices.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-medium inline-flex items-center gap-1"
                >
                  European Interactive Digital Advertising Alliance (EDAA) <ExternalLink size={12} />
                </a>.
              </li>
            </ul>
          </section>

          {/* Section 4: Managing Cookies in Browsers */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">4. How to Manage Cookies in Your Browser</h2>
            <p>
              Most web browsers permit you to control cookies through their configuration settings. You can set your browser to reject all cookies or notify you when a cookie is placed. Note that disabling essential cookies may impact certain functionality of our video editor.
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <p>• <strong>Google Chrome:</strong> Settings &gt; Privacy and Security &gt; Third-party cookies</p>
              <p>• <strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Enhanced Tracking Protection</p>
              <p>• <strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</p>
              <p>• <strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions</p>
            </div>
          </section>

          {/* Section 5: Contact */}
          <section className="space-y-4 pt-6 border-t border-surface-border">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail size={20} className="text-brand-400" />
              5. Questions Regarding Our Cookie Policy
            </h2>
            <p>If you have any questions regarding our use of cookies or tracking technologies, please contact:</p>
            <div className="p-4 rounded-xl bg-surface-hover border border-surface-border text-xs sm:text-sm space-y-1 text-slate-300">
              <p><strong>ClipForge AI</strong></p>
              <p><strong>Publisher:</strong> Ayush Argulwar (Publisher ID: pub-5485620248959858)</p>
              <p><strong>Email:</strong> <a href="mailto:ayushargulwar77@gmail.com" className="text-brand-400 underline">ayushargulwar77@gmail.com</a></p>
              <p><strong>Support:</strong> <a href="mailto:support@clipforgeai.online" className="text-brand-400 underline">support@clipforgeai.online</a></p>
            </div>
          </section>
        </Card>
      </div>
    </PublicLayout>
  )
}
