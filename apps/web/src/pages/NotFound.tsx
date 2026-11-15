import { useNavigate } from 'react-router-dom'
import { Scissors, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full flex flex-col items-center space-y-6">
        {/* Logo Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center shadow-lg shadow-brand-500/20 border border-brand-400/30">
          <Scissors className="w-8 h-8 text-black" />
        </div>

        {/* 404 Header */}
        <div className="space-y-2">
          <h1 className="text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-xl font-semibold text-slate-200">
            Page Not Found
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The page you are looking for doesn&apos;t exist, has been moved, or the link is broken.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-1/2 bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-black font-semibold shadow-lg shadow-brand-500/20"
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full sm:w-1/2 border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home Page
          </Button>
        </div>
      </div>
    </div>
  )
}
