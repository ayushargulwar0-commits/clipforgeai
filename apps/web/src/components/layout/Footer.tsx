import { Link } from 'react-router-dom'
import { Zap, Globe, Share2, MessageCircle, FileCode } from 'lucide-react'

const footerLinks = {
  Product: [
    { label: 'Features',    href: '/features' },
    { label: 'AI Tools',   href: '/ai-tools' },
    { label: 'Pricing',    href: '/pricing' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Changelog',  href: '#' },
  ],
  'Use Cases': [
    { label: 'Podcast Clips',    href: '/use-cases' },
    { label: 'YouTube Shorts',   href: '/use-cases' },
    { label: 'TikTok Reels',     href: '/use-cases' },
    { label: 'Gaming Highlights', href: '/use-cases' },
    { label: 'Webinar Clips',    href: '/use-cases' },
  ],
  Company: [
    { label: 'About',   href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQ',     href: '/faq' },
    { label: 'Blog',    href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy',  href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy',   href: '#' },
  ],
}

const socials = [
  { icon: <Share2 size={18} />, href: '#', label: 'Twitter' },
  { icon: <FileCode size={18} />, href: 'https://github.com', label: 'GitHub' },
  { icon: <Globe size={18} />, href: '#', label: 'Community' },
  { icon: <MessageCircle size={18} />, href: '#', label: 'Discord' },
]

export function Footer() {
  return (
    <footer className="bg-bg-2 border-t border-surface-border mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-brand">
                <Zap size={18} className="text-white" fill="white" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                Clip<span className="gradient-text">Forge</span>
                <span className="text-slate-400 font-light ml-0.5 text-xs">AI</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Forge viral short-form content from any long video. Powered by open-source AI.
            </p>
            <div className="flex items-center gap-3">
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-slate-500 hover:text-white hover:border-brand-500/50 transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-slate-500 hover:text-slate-200 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-surface-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} ClipForge AI. All rights reserved.
          </p>
          <p className="text-xs text-slate-700">
            Built with open-source AI tools. No paid APIs required.
          </p>
        </div>
      </div>
    </footer>
  )
}
