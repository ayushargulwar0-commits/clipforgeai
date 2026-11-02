import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Crop,
  Volume2,
  Type,
  Palette,
  Layers,
  Download,
  Save,
  Sliders,
  Scissors,
  Sparkles,
  Maximize2,
  ZoomIn,
  Move,
} from 'lucide-react'
import { formatDuration } from '@/lib/utils'

interface EditingConfig {
  startTime: number
  endTime: number
  aspectRatio: '9:16' | '16:9' | '1:1'
  zoom: number
  positionX: number
  positionY: number
  captionText: string
  captionStyle: {
    fontFamily: string
    fontSize: number
    textColor: string
    highlightColor: string
    outlineColor: string
    position: 'top' | 'middle' | 'bottom'
  }
  backgroundColor: string
  splitLayout: 'none' | 'top-bottom' | 'pip'
}

export default function VideoEditor() {
  const [searchParams] = useSearchParams()
  const clipId = searchParams.get('clip') || 'sample-clip'
  const { success, info } = useToast()

  // Video state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(142.5)
  const [activeTab, setActiveTab] = useState<'trim' | 'captions' | 'layout' | 'style'>('captions')

  // History state for Undo / Redo
  const [history, setHistory] = useState<EditingConfig[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Structured editing configuration
  const [config, setConfig] = useState<EditingConfig>({
    startTime: 142.5,
    endTime: 178.0,
    aspectRatio: '9:16',
    zoom: 1.0,
    positionX: 0,
    positionY: 0,
    captionText:
      'The hardest truth about scaling past ten million is that everything breaks down.',
    captionStyle: {
      fontFamily: 'Inter',
      fontSize: 22,
      textColor: '#FFFFFF',
      highlightColor: '#F59E0B',
      outlineColor: '#000000',
      position: 'bottom',
    },
    backgroundColor: '#000000',
    splitLayout: 'none',
  })

  // Register history state
  const updateConfig = (newConfig: EditingConfig) => {
    const updatedHistory = history.slice(0, historyIndex + 1)
    updatedHistory.push(newConfig)
    setHistory(updatedHistory)
    setHistoryIndex(updatedHistory.length - 1)
    setConfig(newConfig)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setConfig(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setConfig(history[historyIndex + 1])
    }
  }

  // Playback timer simulation
  useEffect(() => {
    let interval: any
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= config.endTime) {
            return config.startTime
          }
          return prev + 0.1
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, config.startTime, config.endTime])

  const handleSave = () => {
    localStorage.setItem(`cf_clip_config_${clipId}`, JSON.stringify(config))
    success('Configuration Saved', 'Editing settings stored as structured JSON.')
  }

  const handleExport = () => {
    info('Exporting Video', 'Dispatching render request with active settings to FFmpeg...')
    setTimeout(() => {
      success('Export Ready', 'Render complete. 1080p MP4 ready for download.')
    }, 2000)
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-bg text-slate-100 overflow-hidden">
      {/* Editor Top Bar */}
      <div className="h-14 border-b border-surface-border bg-surface-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Badge variant="brand">{config.aspectRatio}</Badge>
          <span className="text-sm font-semibold text-white truncate max-w-xs">
            {clipId}: The Hardest Truth About Scaling
          </span>
          <span className="text-xs text-slate-400">
            Duration: {(config.endTime - config.startTime).toFixed(1)}s
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo"
          >
            <RotateCcw size={14} />
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
          >
            <RotateCw size={14} />
          </Button>
          <Button variant="outline" size="xs" onClick={handleSave} className="gap-1.5">
            <Save size={14} /> Save Config
          </Button>
          <Button size="xs" onClick={handleExport} className="gap-1.5 shadow-brand">
            <Download size={14} /> Export Video
          </Button>
        </div>
      </div>

      {/* Main 3-Column Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Tool Selector Sidebar */}
        <div className="w-16 bg-surface-card border-r border-surface-border flex flex-col items-center py-4 gap-4 shrink-0">
          {[
            { id: 'captions', label: 'Captions', icon: Type },
            { id: 'trim', label: 'Trim', icon: Scissors },
            { id: 'layout', label: 'Layout', icon: Layers },
            { id: 'style', label: 'Styles', icon: Palette },
          ].map((tool) => {
            const Icon = tool.icon
            const active = activeTab === tool.id
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTab(tool.id as any)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors ${
                  active
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-surface-hover'
                }`}
              >
                <Icon size={18} />
                <span>{tool.label}</span>
              </button>
            )
          })}
        </div>

        {/* CENTER: Live Video Canvas Preview */}
        <div className="flex-1 bg-bg-2 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* Canvas Wrapper according to aspect ratio */}
          <div
            className={`relative bg-black rounded-2xl overflow-hidden border border-surface-border shadow-2xl flex items-center justify-center transition-all ${
              config.aspectRatio === '9:16'
                ? 'w-[270px] h-[480px]'
                : config.aspectRatio === '1:1'
                ? 'w-[400px] h-[400px]'
                : 'w-[560px] h-[315px]'
            }`}
          >
            {/* Simulated Video Frame with Zoom & Pan */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-brand-950/40 via-surface to-accent-950/40 flex items-center justify-center"
              style={{
                transform: `scale(${config.zoom}) translate(${config.positionX}px, ${config.positionY}px)`,
              }}
            >
              <div className="text-center p-4">
                <div className="w-16 h-16 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center mx-auto mb-2 text-brand-400">
                  <Play size={24} fill="currentColor" />
                </div>
                <div className="text-xs font-mono text-slate-300">Speaker Centered Video</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {formatDuration(currentTime)} / {formatDuration(config.endTime)}
                </div>
              </div>
            </div>

            {/* Split Screen Overlay if enabled */}
            {config.splitLayout === 'top-bottom' && (
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-blue-900/30 border-b-2 border-white/20 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-mono text-white/60">Facecam Track (Upper)</span>
              </div>
            )}

            {/* Burned-in Live Subtitle Overlay */}
            <div
              className={`absolute left-4 right-4 text-center pointer-events-none z-10 transition-all ${
                config.captionStyle.position === 'top'
                  ? 'top-8'
                  : config.captionStyle.position === 'middle'
                  ? 'top-1/2 -translate-y-1/2'
                  : 'bottom-8'
              }`}
            >
              <div
                className="inline-block px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-lg font-black tracking-tight"
                style={{
                  fontFamily: config.captionStyle.fontFamily,
                  fontSize: `${config.captionStyle.fontSize}px`,
                  color: config.captionStyle.textColor,
                  textShadow: `0 0 4px ${config.captionStyle.outlineColor}, -2px -2px 0 ${config.captionStyle.outlineColor}, 2px -2px 0 ${config.captionStyle.outlineColor}, -2px 2px 0 ${config.captionStyle.outlineColor}, 2px 2px 0 ${config.captionStyle.outlineColor}`,
                }}
              >
                <span>The hardest truth about </span>
                <span style={{ color: config.captionStyle.highlightColor }}>
                  SCALING
                </span>
                <span> past $10M...</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Properties Inspector Panel */}
        <div className="w-80 bg-surface-card border-l border-surface-border p-5 overflow-y-auto shrink-0 space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-xs">
            Tool Properties
          </h2>

          {/* Aspect Ratio Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '9:16', label: '9:16 (TikTok)' },
                { id: '16:9', label: '16:9 (YouTube)' },
                { id: '1:1', label: '1:1 (Square)' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() =>
                    updateConfig({ ...config, aspectRatio: r.id as any })
                  }
                  className={`p-2 rounded-lg text-xs font-semibold border transition-all ${
                    config.aspectRatio === r.id
                      ? 'border-brand-500 bg-brand-600/20 text-white'
                      : 'border-surface-border text-slate-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content 1: Captions */}
          {activeTab === 'captions' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Caption Text</label>
                <textarea
                  rows={3}
                  value={config.captionText}
                  onChange={(e) =>
                    updateConfig({ ...config, captionText: e.target.value })
                  }
                  className="w-full bg-surface border border-surface-border rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Font Size ({config.captionStyle.fontSize}px)
                </label>
                <input
                  type="range"
                  min={14}
                  max={36}
                  value={config.captionStyle.fontSize}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      captionStyle: {
                        ...config.captionStyle,
                        fontSize: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Highlight Color</label>
                <div className="flex gap-2">
                  {['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'].map(
                    (color) => (
                      <button
                        key={color}
                        onClick={() =>
                          updateConfig({
                            ...config,
                            captionStyle: {
                              ...config.captionStyle,
                              highlightColor: color,
                            },
                          })
                        }
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          config.captionStyle.highlightColor === color
                            ? 'scale-110 border-white'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['top', 'middle', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() =>
                        updateConfig({
                          ...config,
                          captionStyle: { ...config.captionStyle, position: pos },
                        })
                      }
                      className={`py-1.5 px-2 rounded text-xs capitalize border ${
                        config.captionStyle.position === pos
                          ? 'border-brand-500 bg-brand-600/20 text-white font-semibold'
                          : 'border-surface-border text-slate-400'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: Trim */}
          {activeTab === 'trim' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Start Time (seconds)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.startTime}
                  onChange={(e) =>
                    updateConfig({ ...config, startTime: Number(e.target.value) })
                  }
                  className="w-full bg-surface border border-surface-border rounded-lg p-2 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  End Time (seconds)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.endTime}
                  onChange={(e) =>
                    updateConfig({ ...config, endTime: Number(e.target.value) })
                  }
                  className="w-full bg-surface border border-surface-border rounded-lg p-2 text-xs"
                />
              </div>
            </div>
          )}

          {/* Tab Content 3: Layout */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Zoom ({config.zoom.toFixed(1)}x)</label>
                <input
                  type="range"
                  min={1}
                  max={2.5}
                  step={0.1}
                  value={config.zoom}
                  onChange={(e) =>
                    updateConfig({ ...config, zoom: Number(e.target.value) })
                  }
                  className="w-full accent-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Split Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'Single Video' },
                    { id: 'top-bottom', label: 'Top / Bottom' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() =>
                        updateConfig({ ...config, splitLayout: l.id as any })
                      }
                      className={`p-2 rounded text-xs border ${
                        config.splitLayout === l.id
                          ? 'border-brand-500 bg-brand-600/20 text-white font-semibold'
                          : 'border-surface-border text-slate-400'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 4: Style */}
          {activeTab === 'style' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Background Color</label>
                <input
                  type="color"
                  value={config.backgroundColor}
                  onChange={(e) =>
                    updateConfig({ ...config, backgroundColor: e.target.value })
                  }
                  className="w-full h-8 rounded bg-transparent cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM: Timeline Scrubber */}
      <div className="h-20 border-t border-surface-border bg-surface-card px-6 flex items-center gap-6 shrink-0">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 hover:bg-brand-700 transition-colors shadow-brand"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(config.endTime)}</span>
          </div>
          <input
            type="range"
            min={config.startTime}
            max={config.endTime}
            step="0.1"
            value={currentTime}
            onChange={(e) => setCurrentTime(Number(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
