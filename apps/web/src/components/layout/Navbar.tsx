import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X, Zap, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navLinks = [
  { label: 'Features',    href: '/features' },
  { label: 'AI Tools',   href: '/ai-tools' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Use Cases',  href: '/use-cases' },
  { label: 'Pricing',    href: '/pricing' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
      scrolled
        ? 'bg-bg/90 backdrop-blur-xl border-b border-surface-border shadow-lg'
        : 'bg-transparent',
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-brand">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              Clip<span className="gradient-text">Forge</span>
              <span className="text-slate-400 font-light ml-0.5 text-xs">AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === link.href
                    ? 'text-white bg-surface-hover'
                    : 'text-slate-400 hover:text-white hover:bg-surface-hover',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && (
              user ? (
                <Button size="sm" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Log in</Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm">Start for free</Button>
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover transition-colors"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-bg/95 backdrop-blur-xl border-b border-surface-border overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === link.href
                      ? 'text-white bg-surface-hover'
                      : 'text-slate-400 hover:text-white',
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-surface-border mt-2 pt-3 flex flex-col gap-2">
                {user ? (
                  <Button onClick={() => navigate('/dashboard')} className="w-full">Dashboard</Button>
                ) : (
                  <>
                    <Link to="/login" className="w-full">
                      <Button variant="outline" className="w-full">Log in</Button>
                    </Link>
                    <Link to="/signup" className="w-full">
                      <Button className="w-full">Start for free</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
