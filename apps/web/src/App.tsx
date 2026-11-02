import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui/Toast'

// Public pages
import Home           from '@/pages/Home'
import Features       from '@/pages/Features'
import AITools        from '@/pages/AITools'
import HowItWorks     from '@/pages/HowItWorks'
import UseCases       from '@/pages/UseCases'
import Pricing        from '@/pages/Pricing'
import FAQ            from '@/pages/FAQ'
import About          from '@/pages/About'
import Contact        from '@/pages/Contact'
import Login          from '@/pages/auth/Login'
import Signup         from '@/pages/auth/Signup'
import ForgotPassword from '@/pages/auth/ForgotPassword'

// Dashboard
import { DashboardLayout } from '@/dashboard/layout/DashboardLayout'
import Overview       from '@/dashboard/pages/Overview'
import Projects       from '@/dashboard/pages/Projects'
import Videos         from '@/dashboard/pages/Videos'
import Clips          from '@/dashboard/pages/Clips'
import Usage          from '@/dashboard/pages/Usage'
import Settings       from '@/dashboard/pages/Settings'
import Editor         from '@/dashboard/pages/Editor'
import BrandKit       from '@/dashboard/pages/BrandKit'
import Scheduler      from '@/dashboard/pages/Scheduler'
import AdminDashboard from '@/dashboard/pages/Admin'

// Auth guard
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Marketing */}
            <Route path="/"                element={<Home />} />
            <Route path="/features"        element={<Features />} />
            <Route path="/ai-tools"        element={<AITools />} />
            <Route path="/how-it-works"    element={<HowItWorks />} />
            <Route path="/use-cases"       element={<UseCases />} />
            <Route path="/pricing"         element={<Pricing />} />
            <Route path="/faq"             element={<FAQ />} />
            <Route path="/about"           element={<About />} />
            <Route path="/contact"         element={<Contact />} />

            {/* Auth */}
            <Route path="/login"           element={<Login />} />
            <Route path="/signup"          element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index            element={<Overview />} />
              <Route path="projects"  element={<Projects />} />
              <Route path="videos"    element={<Videos />} />
              <Route path="clips"     element={<Clips />} />
              <Route path="tools"     element={<AITools />} />
              <Route path="editor"    element={<Editor />} />
              <Route path="brand-kit" element={<BrandKit />} />
              <Route path="scheduler" element={<Scheduler />} />
              <Route path="usage"     element={<Usage />} />
              <Route path="settings"  element={<Settings />} />
              <Route path="admin"     element={<AdminDashboard />} />
              <Route path="help"      element={<FAQ />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
