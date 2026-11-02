import { useState, useCallback } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard,
  FolderOpen,
  Video,
  Scissors,
  Wand2,
  Edit3,
  Palette,
  Calendar,
  BarChart2,
  Settings,
  HelpCircle,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldAlert,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',          icon: LayoutDashboard, href: '/dashboard' },
  { label: 'My Projects',       icon: FolderOpen,      href: '/dashboard/projects' },
  { label: 'My Videos',         icon: Video,           href: '/dashboard/videos' },
  { label: 'My Clips',          icon: Scissors,        href: '/dashboard/clips' },
  { label: 'AI Tools',          icon: Wand2,           href: '/dashboard/tools' },
  { label: 'Video Editor',      icon: Edit3,           href: '/dashboard/editor' },
  { label: 'Brand Kit',         icon: Palette,         href: '/dashboard/brand-kit' },
  { label: 'Content Scheduler', icon: Calendar,        href: '/dashboard/scheduler' },
  { label: 'Usage & Credits',   icon: BarChart2,       href: '/dashboard/usage' },
  { label: 'Settings',          icon: Settings,        href: '/dashboard/settings' },
  { label: 'Help & Support',    icon: HelpCircle,      href: '/dashboard/help' },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':           'Overview',
  '/dashboard/projects':  'My Projects',
  '/dashboard/videos':    'My Videos',
  '/dashboard/clips':     'My Clips',
  '/dashboard/tools':     'AI Tools',
  '/dashboard/editor':    'Video Editor',
  '/dashboard/brand-kit': 'Brand Kit',
  '/dashboard/scheduler': 'Content Scheduler',
  '/dashboard/usage':     'Usage & Credits',
  '/dashboard/settings':  'Settings',
  '/dashboard/admin':     'Admin Operations Console',
  '/dashboard/help':      'Help & Support',
}

interface DashboardLayoutProps {
  children?: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, isOwner, isAdmin, signOut, elevateToOwner } = useAuth()

  const allNavItems: NavItem[] = [
    NAV_ITEMS[0], // Overview
    ...(isAdmin || isOwner
      ? [{ label: 'Admin Console', icon: ShieldAlert, href: '/dashboard/admin' }]
      : []),
    ...NAV_ITEMS.slice(1),
  ]

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Dashboard'

  const planVariant =
    isOwner ? 'brand' :
    profile?.plan === 'pro'  ? 'brand'   :
    profile?.plan === 'team' ? 'success' :
    profile?.plan === 'creator' ? 'info' :
    'muted'


  const handleSignOut = async () => {
    await signOut()
    navigate('/auth/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-surface-border shrink-0',
        sidebarCollapsed && 'justify-center px-2',
      )}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shrink-0">
          <Scissors size={16} className="text-white" />
        </div>
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="font-bold text-white text-lg whitespace-nowrap overflow-hidden"
            >
              ClipForge
              <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent"> AI</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {allNavItems.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={closeSidebar}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-brand-600/20 text-brand-300 border-l-2 border-brand-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent',
                sidebarCollapsed && 'justify-center px-2',
              )}
            >
              <Icon
                size={18}
                className={cn(
                  'shrink-0 transition-colors',
                  isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300',
                  item.href === '/dashboard/admin' && 'text-amber-400',
                )}
              />
              <AnimatePresence initial={false}>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap overflow-hidden flex items-center gap-1.5"
                  >
                    {item.label}
                    {item.href === '/dashboard/admin' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                        OWNER
                      </span>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Tooltip when collapsed */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-surface-card border border-surface-border text-xs text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className={cn(
        'border-t border-surface-border p-3 shrink-0',
        sidebarCollapsed && 'flex flex-col items-center',
      )}>
        <div className={cn(
          'flex items-center gap-3 mb-2',
          sidebarCollapsed && 'justify-center',
        )}>
          {/* Avatar */}
          <div className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-base font-bold shadow-brand transition-all',
            isOwner
              ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-purple-600 ring-2 ring-amber-400/60 shadow-amber-500/20'
              : 'bg-gradient-to-br from-brand-600 to-accent-500'
          )}>
            {isOwner ? '👑' : (profile?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U')}
          </div>
          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden min-w-0"
              >
                <p className="text-sm font-bold text-white truncate flex items-center gap-1">
                  {profile?.full_name ?? user?.email?.split('@')[0] ?? 'Ayush Argulwar'}
                  {isOwner && <span title="Platform Owner" className="text-amber-400">⚡</span>}
                </p>
                {isOwner ? (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-amber-500/30 to-purple-500/30 text-amber-300 border border-amber-500/40">
                      👑 Owner • Full Access
                    </span>
                    <span className="text-[10px] text-brand-300 font-mono font-semibold">
                      ∞ Unlimited Credits
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 mt-0.5">
                    <Badge variant={planVariant} className="capitalize text-[10px]">
                      {profile?.plan ?? 'free'}
                    </Badge>
                    <button
                      onClick={elevateToOwner}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline text-left flex items-center gap-1"
                    >
                      👑 Activate Owner Access
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {sidebarCollapsed && (
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="mt-1 p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-surface-border z-40 lg:hidden"
          >
            <button
              onClick={closeSidebar}
              className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X size={16} />
            </button>
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col bg-surface border-r border-surface-border relative shrink-0 overflow-hidden"
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-surface-card border border-surface-border text-slate-400 hover:text-white hover:border-brand-500 flex items-center justify-center transition-all z-10 shadow-md"
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-surface-border bg-surface shrink-0">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <h1 className="font-semibold text-white text-base hidden sm:block">{pageTitle}</h1>

          {/* Search */}
          <div className="flex-1 max-w-sm mx-auto sm:mx-0 sm:ml-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-surface-card border border-surface-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/60 transition-colors"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Owner status pill */}
            {isOwner ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-brand-600/20 to-purple-600/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Crown size={14} className="text-amber-400 shrink-0" />
                <span>Owner: <strong className="text-white">Ayush Argulwar</strong></span>
                <span className="text-[10px] bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full font-mono font-bold">
                  ∞ Unlimited Credits
                </span>
              </div>
            ) : (
              <button
                onClick={elevateToOwner}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-all"
                title="Switch to Owner Full Access mode"
              >
                <Crown size={14} />
                <span>Activate Owner Access</span>
              </button>
            )}

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
            </button>

            {/* New Project */}
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => navigate('/dashboard/projects')}
              className="hidden sm:inline-flex"
            >
              New Project
            </Button>
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => navigate('/dashboard/projects')}
              className="sm:hidden"
            />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-bg">
          <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}
