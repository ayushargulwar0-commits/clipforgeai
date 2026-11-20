import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Shield, Lock, Eye, Cookie, Server, CheckCircle2, Mail } from 'lucide-react'

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
            Last Updated: November 20, 2026 • Effective Date: November 20, 2026
          </p>
        </div>

        {/* Content Box */}
        <Card className="p-8 sm:p-12 space-y-10 text-slate-300 text-sm leading-relaxed border-surface-border bg-surface-card">
          {/* Summary Alert */}
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-200 text-xs sm:text-sm">
            <strong>Important Summary:</strong> ClipForge AI respects your privacy and is committed to protecting your personal data. We do not sell your personal data or uploaded media. This Privacy Policy details how we collect, handle, protect, and use your information, including our advertising practices powered by Google AdSense.
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield size={20} className="text-brand-400" />
              1. Introduction & Overview
            </h2>
            <p>
              Welcome to <strong>ClipForge AI</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;), operating the website located at{' '}
              <a href="https://clipforgeai.online" className="text-brand-400 underline">https://clipforgeai.online</a> (the &ldquo;Service&rdquo; or &ldquo;Site&rdquo;). This Privacy Policy explains our practices regarding the collection, storage, processing, and protection of information obtained through your access to or use of our Service.
            </p>
            <p>
              By accessing, browsing, or utilizing ClipForge AI, you acknowledge that you have read, understood, and agree to the data collection and usage practices described in this Privacy Policy. If you do not agree with this policy, please do not use our services.
            </p>
          </section>

          {/* Section 2: AdSense & Third-Party Cookies (MANDATORY FOR GOOGLE ADSENSE) */}
          <section className="space-y-4 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <h2 className="text-xl font-bold text-amber-200 flex items-center gap-2">
              <Cookie size={20} className="text-amber-400" />
              2. Google AdSense & Third-Party Advertising (Mandatory Disclosures)
            </h2>
            <p className="text-slate-200">
              We display advertisements on our website through <strong>Google AdSense</strong> and affiliated third-party advertising networks to maintain free access to our AI video processing tools. In accordance with Google&rsquo;s publisher policies, we provide the following required disclosures:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>
                <strong>Third-Party Vendors:</strong> Third-party vendors, including <strong>Google LLC</strong>, use cookies (including the DoubleClick cookie) to serve ads based on a user&rsquo;s prior visits to this website (<code>clipforgeai.online</code>) or other websites across the Internet.
              </li>
              <li>
                <strong>Personalized Advertising:</strong> Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to our users based on their visits to our site and/or other sites on the Internet.
              </li>
              <li>
                <strong>Opt-Out of Personalized Ads:</strong> Users may opt out of personalized advertising at any time by visiting Google&rsquo;s official Ad Settings page at:{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-medium"
                >
                  https://www.google.com/settings/ads
                </a>.
              </li>
              <li>
                <strong>Network Advertising Opt-Out:</strong> Alternatively, users can opt out of a third-party vendor&rsquo;s use of cookies for interest-based advertising by visiting the Digital Advertising Alliance Consumer Choice page at:{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-medium"
                >
                  https://www.aboutads.info/choices/
                </a>{' '}
                or the Network Advertising Initiative (NAI) opt-out tool at{' '}
                <a
                  href="https://optout.networkadvertising.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-medium"
                >
                  https://optout.networkadvertising.org/
                </a>.
              </li>
              <li>
                <strong>Web Beacons & Ad Technology:</strong> Third-party ad servers or ad networks use technology in the advertisements and links that appear on ClipForge AI, which are sent directly to your browser. They automatically receive your IP address when this occurs. Other technologies (such as cookies, JavaScript, or Web Beacons) may also be used by the third-party ad networks to measure the effectiveness of their advertisements and/or to personalize the advertising content that you see.
              </li>
              <li>
                ClipForge AI has no access to or control over these cookies that are used by third-party advertisers. For more details on Google&rsquo;s advertising practices, please consult the{' '}
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline font-medium"
                >
                  Google Privacy & Terms for Advertising
                </a>.
              </li>
            </ul>
          </section>

          {/* Section 3: Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye size={20} className="text-brand-400" />
              3. Information We Collect
            </h2>
            <p>
              We collect information in several ways when you interact with our platform:
            </p>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-slate-200">A. Personal Information You Provide</h3>
                <p className="text-slate-400 text-xs mt-1">
                  When you register an account, sign in, or contact us, we collect: your name, email address (e.g., via OAuth providers like Google or email sign-up), billing details (processed through secure PCI-compliant third-party gateways), and correspondence history.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">B. User Media & Video Content</h3>
                <p className="text-slate-400 text-xs mt-1">
                  When you upload or import video files (MP4, MOV, YouTube URLs), our processing engine ingests the media file solely for generating audio transcripts, identifying highlights, applying aspect-ratio reframing, and rendering your requested short clips.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">C. Automatically Collected Device & Usage Data</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Log information: IP addresses, browser types, operating systems, referring URLs, access times, pages viewed, and device identifiers to protect against fraud and optimize server performance.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: How We Use Information */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server size={20} className="text-brand-400" />
              4. How We Use Your Information
            </h2>
            <p>We use the data we collect solely for legitimate business purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs sm:text-sm">
              <li>To provide, operate, maintain, and enhance the ClipForge AI video clipping and subtitle editor.</li>
              <li>To authenticate user sessions, process account upgrades, and calculate export quotas.</li>
              <li>To detect and prevent fraudulent activities, system abuse, and unauthorized access.</li>
              <li>To communicate system maintenance announcements, security alerts, and feature updates.</li>
              <li>To display non-intrusive, relevant advertisements via Google AdSense in accordance with user preferences.</li>
              <li><strong>Zero Model Training:</strong> We DO NOT sell, rent, or trade your uploaded video footage or transcripts to third parties for external AI training.</li>
            </ul>
          </section>

          {/* Section 5: Data Security & Retention */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock size={20} className="text-brand-400" />
              5. Data Security & Retention
            </h2>
            <p>
              We implement industry-standard technical and organizational security measures, including HTTPS/TLS 1.3 encryption in transit, strict access control policies, and isolated filesystem boundaries for media processing.
            </p>
            <p>
              <strong>Media Retention:</strong> Temporary video processing caches and downloaded source files are purged after processing. Rendered clips and user account data remain stored securely until deleted by the user through the dashboard or upon account deletion requests.
            </p>
          </section>

          {/* Section 6: GDPR & International Privacy Rights */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={20} className="text-brand-400" />
              6. Your Rights Under GDPR (European Economic Area) & UK Laws
            </h2>
            <p>
              If you are a resident of the European Economic Area (EEA) or the United Kingdom, you possess specific data protection rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs sm:text-sm">
              <li><strong>Right of Access:</strong> You may request copies of your personal information held by us.</li>
              <li><strong>Right to Rectification:</strong> You may request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> You may request the deletion of your personal data.</li>
              <li><strong>Right to Restrict or Object to Processing:</strong> You may object to the processing of your data or request restriction.</li>
              <li><strong>Right to Data Portability:</strong> You may request transfer of your data to another organization.</li>
            </ul>
            <p>
              To exercise any of these rights, contact our Data Privacy Officer at{' '}
              <a href="mailto:ayushargulwar77@gmail.com" className="text-brand-400 underline font-medium">
                ayushargulwar77@gmail.com
              </a>.
            </p>
          </section>

          {/* Section 7: CCPA & California Privacy Rights */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              7. California Consumer Privacy Act (CCPA / CPRA)
            </h2>
            <p>
              California residents are entitled to specific rights regarding their personal information:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs sm:text-sm">
              <li>The right to know what personal information is collected, disclosed, or sold.</li>
              <li>The right to delete personal information collected from you.</li>
              <li>The right to opt-out of the sale or sharing of personal information. <strong>ClipForge AI does not sell personal information.</strong></li>
              <li>The right to non-discrimination for exercising your CCPA privacy rights.</li>
            </ul>
          </section>

          {/* Section 8: Children's Privacy */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              8. Children&rsquo;s Online Privacy Protection Act (COPPA)
            </h2>
            <p>
              ClipForge AI does not direct its services to children under 13 years of age, nor do we knowingly collect personal identification information from children. If you believe your child has provided us with personal information, please contact us immediately, and we will promptly remove such information from our records.
            </p>
          </section>

          {/* Section 9: Contact Information */}
          <section className="space-y-4 pt-6 border-t border-surface-border">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail size={20} className="text-brand-400" />
              9. Contact Information & Data Controller
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact our publisher and data controller:
            </p>
            <div className="p-4 rounded-xl bg-surface-hover border border-surface-border text-xs sm:text-sm space-y-1 text-slate-300">
              <p><strong>Site:</strong> ClipForge AI (https://clipforgeai.online)</p>
              <p><strong>Publisher / Owner:</strong> Ayush Argulwar</p>
              <p><strong>Publisher ID:</strong> pub-5485620248959858</p>
              <p><strong>Direct Privacy Contact:</strong> <a href="mailto:ayushargulwar77@gmail.com" className="text-brand-400 underline">ayushargulwar77@gmail.com</a></p>
              <p><strong>General Inquiries:</strong> <a href="mailto:support@clipforgeai.online" className="text-brand-400 underline">support@clipforgeai.online</a></p>
            </div>
          </section>
        </Card>
      </div>
    </PublicLayout>
  )
}
