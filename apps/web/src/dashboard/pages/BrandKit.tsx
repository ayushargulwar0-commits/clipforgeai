import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { Palette, Upload, Check, Type, Sparkles, Image, Shield } from 'lucide-react'

export default function BrandKit() {
  const { success } = useToast()
  const [brandName, setBrandName] = useState('Tech Founders Show')
  const [primaryColor, setPrimaryColor] = useState('#7C3AED')
  const [accentColor, setAccentColor] = useState('#3B82F6')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [watermarkEnabled, setWatermarkEnabled] = useState(true)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    success('Brand Kit Saved', 'Brand styling will be applied automatically to all rendered clips.')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Brand Kit</h1>
          <p className="text-xs text-slate-400 mt-1">
            Standardize your logos, color palettes, fonts, and watermarks across all social clips.
          </p>
        </div>
        <Button onClick={handleSave} className="gap-2 text-xs font-semibold">
          <Check size={14} /> Save Brand Kit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-white mb-2">Brand Identity</h2>
            <Input
              label="Brand / Channel Name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs text-slate-300">{primaryColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-lg bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs text-slate-300">{accentColor}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-surface border border-surface-border rounded-lg px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="Inter">Inter (Clean Modern Sans)</option>
                <option value="Montserrat">Montserrat (Bold Punchy)</option>
                <option value="Oswald">Oswald (Vertical Condensed)</option>
                <option value="Geist Mono">Geist Mono (Code / Tech)</option>
              </select>
            </div>
          </Card>

          {/* Logo & Watermark */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-white mb-2">Watermark & Logo Overlay</h2>
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface border border-surface-border cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">Enable Corner Watermark</p>
                <p className="text-[11px] text-slate-400">Burn subtle logo in top-right of all exported videos</p>
              </div>
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
            </label>

            <div className="p-6 border-2 border-dashed border-surface-border rounded-xl text-center">
              <Upload size={24} className="text-brand-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-200">Upload Transparent PNG Logo</p>
              <p className="text-[10px] text-slate-500 mt-1">Recommended: 512x512 with transparent background</p>
            </div>
          </Card>
        </div>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Video Mockup</h2>
          <div className="aspect-[9/16] rounded-2xl bg-black border border-surface-border p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            {/* Top Bar with brand logo */}
            <div className="flex justify-between items-center z-10">
              <span className="text-[11px] font-bold text-white drop-shadow">{brandName}</span>
              {watermarkEnabled && (
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow"
                  style={{ backgroundColor: primaryColor }}
                >
                  CF
                </div>
              )}
            </div>

            {/* Subtitle preview */}
            <div className="text-center z-10 mb-6">
              <span
                className="px-3 py-1 rounded-md text-xs font-bold shadow-lg"
                style={{
                  fontFamily,
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                }}
              >
                Sample <span style={{ color: accentColor }}>Captions</span> Preview
              </span>
            </div>

            {/* Background simulated frame */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `radial-gradient(circle at center, ${primaryColor} 0%, transparent 70%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
