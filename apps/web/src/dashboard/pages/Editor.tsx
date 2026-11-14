import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import {
  Play,
  Pause,
  Undo2,
  Redo2,
  Save,
  Download,
  ArrowLeft,
  Crop,
  Layers,
  Sparkles,
  Type,
  Music,
  Repeat,
  AlertTriangle,
  Check,
  Loader2,
  Move,
  Maximize2,
  Palette,
  Image as ImageIcon,
} from 'lucide-react'
import api from '@/lib/api'

// ---------------------------------------------------------------------------
// Types & Schema (Phase 6A Version 1)
// ---------------------------------------------------------------------------

export type AspectRatio = '9:16' | '1:1' | '4:5'
export type FramingMode = 'crop' | 'split' | 'blur_fit'
export type BackgroundType = 'blur' | 'solid' | 'image'

export interface CropBox {
  x: number // 0-100 percentage
  y: number // 0-100 percentage
  w: number // 0-100 percentage
  h: number // 0-100 percentage
}

export interface SplitFraming {
  top: CropBox
  bottom: CropBox
}

export interface FramingConfig {
  mode: FramingMode
  crop: CropBox
  split: SplitFraming
}

export interface BackgroundConfig {
  type: BackgroundType
  value: string
}

export interface TrimConfig {
  in: number
  out: number
}

export interface EditJson {
  trim: TrimConfig
  aspect: AspectRatio
  framing: FramingConfig
  background: BackgroundConfig
  captions: {
    enabled: boolean
    style: string
    words: any[]
  }
  outro: any
  watermark: any
}

const DEFAULT_EDIT_JSON: EditJson = {
  trim: { in: 0, out: 30 },
  aspect: '9:16',
  framing: {
    mode: 'crop',
    crop: { x: 34.18, y: 0, w: 31.64, h: 100 },
    split: {
      top: { x: 0, y: 0, w: 100, h: 50 },
      bottom: { x: 0, y: 50, w: 100, h: 50 },
    },
  },
  background: {
    type: 'blur',
    value: '#000000',
  },
  captions: {
    enabled: true,
    style: 'default',
    words: [],
  },
  outro: null,
  watermark: null,
}

// Sample fallback video for demonstration when no video is uploaded yet
const SAMPLE_HORIZONTAL_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'

export default function Editor() {
  const { clipId: routeClipId } = useParams<{ clipId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const clipId = routeClipId || searchParams.get('clip') || 'clip-sample'

  // Edit State & History
  const [editJson, setEditJson] = useState<EditJson>(DEFAULT_EDIT_JSON)
  const [history, setHistory] = useState<EditJson[]>([DEFAULT_EDIT_JSON])
  const [historyIdx, setHistoryIdx] = useState(0)

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(60)
  const [loopTrim, setLoopTrim] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string>(SAMPLE_HORIZONTAL_VIDEO)
  const [clipTitle, setClipTitle] = useState<string>('My Short Clip')

  // UI State
  const [activeTab, setActiveTab] = useState<'framing' | 'text' | 'audio'>('framing')
  const [isSaving, setIsSaving] = useState(false)
  const [isAutoFraming, setIsAutoFraming] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)

  // Interactive Dragging on Source Preview
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; boxX: number; boxY: number } | null>(
    null
  )

  const videoRef = useRef<HTMLVideoElement>(null)
  const bgVideoRef = useRef<HTMLVideoElement>(null)
  const sourceBoxRef = useRef<HTMLDivElement>(null)

  // -------------------------------------------------------------------------
  // Helper to Push History
  // -------------------------------------------------------------------------
  const updateEdit = useCallback((updater: (prev: EditJson) => EditJson, pushHistory = true) => {
    setEditJson((prev) => {
      const next = updater(prev)
      if (pushHistory) {
        setHistory((h) => {
          const newHist = h.slice(0, historyIdx + 1)
          return [...newHist, next]
        })
        setHistoryIdx((idx) => idx + 1)
      }
      return next
    })
    setHasUnsaved(true)
  }, [historyIdx])

  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1
      setHistoryIdx(newIdx)
      setEditJson(history[newIdx])
      setHasUnsaved(true)
    }
  }, [history, historyIdx])

  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1
      setHistoryIdx(newIdx)
      setEditJson(history[newIdx])
      setHasUnsaved(true)
    }
  }, [history, historyIdx])

  // -------------------------------------------------------------------------
  // 1. Data Loading: GET /clips/{id}/edit & Clip Details
  // -------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true

    async function loadClipData() {
      try {
        // Load clip metadata
        const clipRes = await api.get(`/clips/${clipId}`).catch(() => null)
        if (clipRes?.data && isMounted) {
          if (clipRes.data.title) setClipTitle(clipRes.data.title)
          if (clipRes.data.source_url) {
            setVideoUrl(clipRes.data.source_url)
          } else if (clipRes.data.rendered_path) {
            setVideoUrl(`/storage/clips/${clipRes.data.rendered_path.split(/[\/\\]/).pop()}`)
          }
        }

        // Load edit state
        const editRes = await api.get(`/clips/${clipId}/edit`)
        if (editRes?.data?.edit_json && isMounted) {
          const loaded = editRes.data.edit_json
          setEditJson(loaded)
          setHistory([loaded])
          setHistoryIdx(0)
          setHasUnsaved(false)
          if (loaded.trim?.in !== undefined && videoRef.current) {
            videoRef.current.currentTime = loaded.trim.in
            setCurrentTime(loaded.trim.in)
          }
        }
      } catch {
        // Fallback to localStorage if offline
        const localKey = `clipforge_edit_${clipId}`
        const cached = localStorage.getItem(localKey)
        if (cached && isMounted) {
          try {
            const parsed = JSON.parse(cached)
            setEditJson(parsed)
            setHistory([parsed])
            setHistoryIdx(0)
          } catch (_) {}
        }
      }
    }

    loadClipData()
    return () => {
      isMounted = false
    }
  }, [clipId])

  // -------------------------------------------------------------------------
  // 2. Save API: PUT /clips/{id}/edit
  // -------------------------------------------------------------------------
  const saveChanges = useCallback(
    async (showNotification = false) => {
      setIsSaving(true)
      try {
        await api.put(`/clips/${clipId}/edit`, {
          edit_json: editJson,
        })
        localStorage.setItem(`clipforge_edit_${clipId}`, JSON.stringify(editJson))
        setHasUnsaved(false)
        if (showNotification) {
          success('Changes Saved', 'Clip edit settings saved successfully.')
        }
      } catch (err: any) {
        // Save locally anyway
        localStorage.setItem(`clipforge_edit_${clipId}`, JSON.stringify(editJson))
        if (showNotification) {
          toastError('Saved to Local Cache', err?.message || 'Backed up locally.')
        }
      } finally {
        setIsSaving(false)
      }
    },
    [clipId, editJson, success, toastError]
  )

  // -------------------------------------------------------------------------
  // 3. Autosave (Debounced 2 seconds)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!hasUnsaved) return
    const timer = setTimeout(() => {
      saveChanges(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [editJson, hasUnsaved, saveChanges])

  // -------------------------------------------------------------------------
  // 4. Video Time Update & Looping
  // -------------------------------------------------------------------------
  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const t = videoRef.current.currentTime
    setCurrentTime(t)

    // Sync background video if present
    if (bgVideoRef.current && Math.abs(bgVideoRef.current.currentTime - t) > 0.2) {
      bgVideoRef.current.currentTime = t
    }

    // Loop check
    if (loopTrim && t >= editJson.trim.out) {
      videoRef.current.currentTime = editJson.trim.in
      if (bgVideoRef.current) bgVideoRef.current.currentTime = editJson.trim.in
      videoRef.current.play().catch(() => {})
    }
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      if (videoRef.current.currentTime >= editJson.trim.out) {
        videoRef.current.currentTime = editJson.trim.in
      }
      videoRef.current.play().catch(() => {})
      bgVideoRef.current?.play().catch(() => {})
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      bgVideoRef.current?.pause()
      setIsPlaying(false)
    }
  }

  // -------------------------------------------------------------------------
  // 5. Keyboard Shortcuts
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      // Save: Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveChanges(true)
        return
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        handleUndo()
        return
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z / Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault()
        handleRedo()
        return
      }

      // Space: Play / Pause
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
        return
      }

      // 'I': Set In point
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault()
        const newIn = Math.max(0, Math.min(currentTime, editJson.trim.out - 0.5))
        updateEdit((prev) => ({
          ...prev,
          trim: { ...prev.trim, in: round2(newIn) },
        }))
        return
      }

      // 'O': Set Out point
      if (e.key.toLowerCase() === 'o') {
        e.preventDefault()
        const newOut = Math.min(duration, Math.max(editJson.trim.in + 0.5, currentTime))
        if (newOut - editJson.trim.in <= 180) {
          updateEdit((prev) => ({
            ...prev,
            trim: { ...prev.trim, out: round2(newOut) },
          }))
        }
        return
      }

      // Left / Right step
      const stepFrames = e.shiftKey ? 5 : 1
      const stepSeconds = stepFrames / 30.0

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (videoRef.current) {
          const t = Math.max(0, videoRef.current.currentTime - stepSeconds)
          videoRef.current.currentTime = t
          setCurrentTime(t)
        }
        return
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (videoRef.current) {
          const t = Math.min(duration, videoRef.current.currentTime + stepSeconds)
          videoRef.current.currentTime = t
          setCurrentTime(t)
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTime, duration, editJson, handleRedo, handleUndo, saveChanges, updateEdit])

  // -------------------------------------------------------------------------
  // 6. Aspect Ratio & Target Width Calculations
  // -------------------------------------------------------------------------
  // On a standard 16:9 source frame:
  // 9:16 target width = 31.64% of 16:9 width
  // 1:1 target width  = 56.25% of 16:9 width
  // 4:5 target width  = 45.00% of 16:9 width
  const getAspectCropWidth = (aspect: AspectRatio): number => {
    if (aspect === '1:1') return 56.25
    if (aspect === '4:5') return 45.0
    return 31.64
  }

  const handleAspectChange = (newAspect: AspectRatio) => {
    const newW = getAspectCropWidth(newAspect)
    updateEdit((prev) => {
      const curX = prev.framing.crop.x
      const clampedX = Math.max(0, Math.min(100 - newW, curX))
      return {
        ...prev,
        aspect: newAspect,
        framing: {
          ...prev.framing,
          crop: {
            x: round2(clampedX),
            y: 0,
            w: round2(newW),
            h: 100,
          },
        },
      }
    })
  }

  // -------------------------------------------------------------------------
  // 7. Auto-Frame with Face/Subject Detection API
  // -------------------------------------------------------------------------
  const handleAutoFrame = async () => {
    setIsAutoFraming(true)
    try {
      const res = await api.post(`/clips/${clipId}/auto-frame?aspect=${editJson.aspect}`)
      if (res.data?.crop) {
        updateEdit((prev) => ({
          ...prev,
          framing: {
            ...prev.framing,
            mode: res.data.mode || prev.framing.mode,
            crop: res.data.crop,
          },
        }))
        success('Auto-Frame Complete', 'Crop box aligned to main subject.')
      }
    } catch (err: any) {
      toastError('Auto-Frame Failed', err?.message || 'Using center crop fallback.')
      const w = getAspectCropWidth(editJson.aspect)
      updateEdit((prev) => ({
        ...prev,
        framing: {
          ...prev.framing,
          crop: { x: round2((100 - w) / 2), y: 0, w: round2(w), h: 100 },
        },
      }))
    } finally {
      setIsAutoFraming(false)
    }
  }

  // -------------------------------------------------------------------------
  // 8. Draggable Crop Box Mouse Handlers
  // -------------------------------------------------------------------------
  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingCrop(true)
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxX: editJson.framing.crop.x,
      boxY: editJson.framing.crop.y,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingCrop || !dragStart || !sourceBoxRef.current) return
      const rect = sourceBoxRef.current.getBoundingClientRect()
      const deltaX = ((e.clientX - dragStart.mouseX) / rect.width) * 100
      const newX = Math.max(0, Math.min(100 - editJson.framing.crop.w, dragStart.boxX + deltaX))

      updateEdit(
        (prev) => ({
          ...prev,
          framing: {
            ...prev.framing,
            crop: { ...prev.framing.crop, x: round2(newX) },
          },
        }),
        false // don't flood history while dragging
      )
    }

    const handleMouseUp = () => {
      if (isDraggingCrop) {
        setIsDraggingCrop(false)
        setDragStart(null)
        // Record final history entry
        updateEdit((prev) => ({ ...prev }))
      }
    }

    if (isDraggingCrop) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragStart, editJson.framing.crop.w, isDraggingCrop, updateEdit])

  // -------------------------------------------------------------------------
  // Trim Length & Warnings
  // -------------------------------------------------------------------------
  const trimmedDuration = Math.max(0, editJson.trim.out - editJson.trim.in)
  const isOver60s = trimmedDuration > 60

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* ===================================================================== */}
      {/* TOP BAR: Undo, Redo, Save, Export, Aspect switcher                    */}
      {/* ===================================================================== */}
      <header className="h-14 border-b border-surface-border px-6 flex items-center justify-between bg-surface/90 backdrop-blur z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/clips')}
            className="text-slate-400 hover:text-white gap-1.5"
          >
            <ArrowLeft size={16} /> My Clips
          </Button>
          <div className="h-4 w-px bg-slate-800" />
          <div>
            <h1 className="text-sm font-bold text-white truncate max-w-xs">{clipTitle}</h1>
            <p className="text-[11px] text-slate-400">ID: {clipId}</p>
          </div>
        </div>

        {/* Undo / Redo / Aspect Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-surface-border rounded-lg p-0.5">
            <button
              onClick={handleUndo}
              disabled={historyIdx <= 0}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIdx >= history.length - 1}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
            >
              <Redo2 size={16} />
            </button>
          </div>

          {/* Aspect Ratio Pills */}
          <div className="flex items-center bg-slate-900 border border-surface-border rounded-lg p-0.5 text-xs">
            {(['9:16', '1:1', '4:5'] as AspectRatio[]).map((aspect) => (
              <button
                key={aspect}
                onClick={() => handleAspectChange(aspect)}
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  editJson.aspect === aspect
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {aspect}
              </button>
            ))}
          </div>
        </div>

        {/* Save & Export */}
        <div className="flex items-center gap-2">
          {hasUnsaved && (
            <span className="text-[11px] text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Unsaved
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => saveChanges(true)}
            disabled={isSaving}
            className="gap-1.5 text-xs"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </Button>

          <Button
            size="sm"
            onClick={() => success('Export Queued', 'Full HD 1080x1920 render started with your trim & framing.')}
            className="gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs"
          >
            <Download size={14} /> Export
          </Button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MAIN BODY: Center Preview + Right Tabs Panel                          */}
      {/* ===================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* CENTER: Live Aspect Preview */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
          {/* Aspect Frame */}
          <div
            className={`relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black transition-all duration-200 flex items-center justify-center ${
              editJson.aspect === '9:16'
                ? 'w-[300px] h-[533px]'
                : editJson.aspect === '1:1'
                ? 'w-[420px] h-[420px]'
                : 'w-[360px] h-[450px]'
            }`}
          >
            {/* Background Layer: Blur / Solid / Image */}
            {editJson.framing.mode === 'blur_fit' && (
              <div className="absolute inset-0 z-0 overflow-hidden">
                {editJson.background.type === 'blur' && (
                  <video
                    ref={bgVideoRef}
                    src={videoUrl}
                    muted
                    playsInline
                    className="w-full h-full object-cover filter blur-xl scale-125 opacity-70"
                  />
                )}
                {editJson.background.type === 'solid' && (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: editJson.background.value || '#000000' }}
                  />
                )}
                {editJson.background.type === 'image' && (
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${editJson.background.value})` }}
                  />
                )}
              </div>
            )}

            {/* Video Foreground Container */}
            <div className="absolute inset-0 z-10 overflow-hidden flex items-center justify-center">
              {/* MODE 1: CROP (Transform CSS object positioning) */}
              {editJson.framing.mode === 'crop' && (
                <div className="relative w-full h-full overflow-hidden">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => {
                      if (videoRef.current) setDuration(videoRef.current.duration)
                    }}
                    playsInline
                    className="absolute max-w-none pointer-events-none"
                    style={{
                      width: `${(100 / editJson.framing.crop.w) * 100}%`,
                      height: '100%',
                      left: `-${(editJson.framing.crop.x / editJson.framing.crop.w) * 100}%`,
                      top: '0%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              )}

              {/* MODE 2: BLUR-FIT (Pitted in center) */}
              {editJson.framing.mode === 'blur_fit' && (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration)
                  }}
                  playsInline
                  className="w-full object-contain pointer-events-none z-10"
                />
              )}

              {/* MODE 3: SPLIT SCREEN */}
              {editJson.framing.mode === 'split' && (
                <div className="w-full h-full flex flex-col">
                  {/* Top Half */}
                  <div className="relative w-full h-1/2 overflow-hidden border-b border-brand-500/30">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      onTimeUpdate={handleTimeUpdate}
                      playsInline
                      className="absolute max-w-none pointer-events-none"
                      style={{
                        width: '100%',
                        height: '200%',
                        top: '0%',
                        objectFit: 'cover',
                      }}
                    />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-slate-300">
                      Top Box
                    </div>
                  </div>
                  {/* Bottom Half */}
                  <div className="relative w-full h-1/2 overflow-hidden">
                    <video
                      src={videoUrl}
                      playsInline
                      muted
                      className="absolute max-w-none pointer-events-none"
                      style={{
                        width: '100%',
                        height: '200%',
                        top: '-100%',
                        objectFit: 'cover',
                      }}
                    />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-slate-300">
                      Bottom Box
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Play Overlay Button */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute z-30 w-14 h-14 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-xl hover:scale-105 transition"
              >
                <Play size={24} fill="currentColor" className="ml-1" />
              </button>
            )}

            {/* Captions Preview Overlay (Shell) */}
            {editJson.captions.enabled && (
              <div className="absolute bottom-12 inset-x-4 z-20 pointer-events-none text-center">
                <span className="inline-block px-3 py-1.5 rounded-lg bg-black/75 text-white font-extrabold text-sm uppercase tracking-wide border border-white/20 shadow-lg">
                  Captions Preview
                </span>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL: 3 Tabs (Framing & Layout | Text & Subtitles | Audio & Outro) */}
        <aside className="w-84 border-l border-surface-border bg-surface/50 backdrop-blur flex flex-col shrink-0">
          {/* Tab Navigation */}
          <div className="flex border-b border-surface-border">
            <button
              onClick={() => setActiveTab('framing')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === 'framing'
                  ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crop size={14} /> Framing
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === 'text'
                  ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type size={14} /> Text
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === 'audio'
                  ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music size={14} /> Audio
            </button>
          </div>

          {/* TAB 1: Framing & Layout */}
          {activeTab === 'framing' && (
            <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Framing Mode Selection */}
              <div>
                <label className="font-bold text-slate-300 block mb-2 uppercase tracking-wider text-[10px]">
                  Framing Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'crop', label: 'Smart Crop', icon: Crop },
                    { id: 'split', label: 'Split Screen', icon: Layers },
                    { id: 'blur_fit', label: 'Blur-Fit', icon: Maximize2 },
                  ].map((m) => {
                    const Icon = m.icon
                    const isSelected = editJson.framing.mode === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() =>
                          updateEdit((prev) => ({
                            ...prev,
                            framing: { ...prev.framing, mode: m.id as FramingMode },
                          }))
                        }
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/10 text-white font-bold'
                            : 'border-surface-border bg-slate-900/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Draggable Source Preview Box */}
              {editJson.framing.mode === 'crop' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                      Crop Positioning
                    </label>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={handleAutoFrame}
                      disabled={isAutoFraming}
                      className="gap-1 text-[10px] text-brand-400 border-brand-500/40 hover:bg-brand-500/10"
                    >
                      {isAutoFraming ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Sparkles size={10} />
                      )}
                      Auto-Frame
                    </Button>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2">
                    Drag the crop box left/right over the 16:9 source to choose your frame:
                  </p>

                  {/* 16:9 Horizontal Source Miniature */}
                  <div
                    ref={sourceBoxRef}
                    className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-700 bg-slate-900 select-none cursor-ew-resize"
                  >
                    <video
                      src={videoUrl}
                      className="w-full h-full object-cover opacity-60 pointer-events-none"
                    />

                    {/* Draggable Aspect Locked Box */}
                    <div
                      onMouseDown={handleCropMouseDown}
                      style={{
                        left: `${editJson.framing.crop.x}%`,
                        width: `${editJson.framing.crop.w}%`,
                      }}
                      className="absolute inset-y-0 border-2 border-brand-500 bg-brand-500/20 shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center"
                    >
                      <div className="p-1 rounded bg-black/70 text-brand-300">
                        <Move size={12} />
                      </div>
                      {/* Left & Right handles */}
                      <div className="absolute left-0 inset-y-0 w-1 bg-brand-400" />
                      <div className="absolute right-0 inset-y-0 w-1 bg-brand-400" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                    <span>X: {editJson.framing.crop.x}%</span>
                    <span>Width: {editJson.framing.crop.w}%</span>
                    <span>Ratio: {editJson.aspect}</span>
                  </div>
                </div>
              )}

              {/* Background Options (for Blur-Fit & Spills) */}
              <div>
                <label className="font-bold text-slate-300 block mb-2 uppercase tracking-wider text-[10px]">
                  Background Fill
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(['blur', 'solid', 'image'] as BackgroundType[]).map((bgType) => (
                    <button
                      key={bgType}
                      onClick={() =>
                        updateEdit((prev) => ({
                          ...prev,
                          background: { ...prev.background, type: bgType },
                        }))
                      }
                      className={`py-2 px-2 rounded-lg border text-center capitalize transition ${
                        editJson.background.type === bgType
                          ? 'border-brand-500 bg-brand-500/10 text-white font-bold'
                          : 'border-surface-border text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {bgType}
                    </button>
                  ))}
                </div>

                {editJson.background.type === 'solid' && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900 border border-surface-border">
                    <input
                      type="color"
                      value={editJson.background.value || '#000000'}
                      onChange={(e) =>
                        updateEdit((prev) => ({
                          ...prev,
                          background: { ...prev.background, value: e.target.value },
                        }))
                      }
                      className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
                    />
                    <span className="font-mono text-slate-300">
                      {editJson.background.value || '#000000'}
                    </span>
                  </div>
                )}

                {editJson.background.type === 'image' && (
                  <input
                    type="text"
                    placeholder="Image URL..."
                    value={editJson.background.value || ''}
                    onChange={(e) =>
                      updateEdit((prev) => ({
                        ...prev,
                        background: { ...prev.background, value: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-surface-border text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Text & Subtitles (Shell Placeholder for Phase 6B) */}
          {activeTab === 'text' && (
            <div className="p-5 space-y-4 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Subtitles & Captions</span>
                <Badge variant="muted" className="text-[10px]">
                  Phase 6B Shell
                </Badge>
              </div>

              <div className="p-4 rounded-xl border border-surface-border bg-slate-900/50 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Burn Animated Captions</span>
                  <input
                    type="checkbox"
                    checked={editJson.captions.enabled}
                    onChange={(e) =>
                      updateEdit((prev) => ({
                        ...prev,
                        captions: { ...prev.captions, enabled: e.target.checked },
                      }))
                    }
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                </label>
                <p className="text-[11px] text-slate-500">
                  Devanagari (Hindi) and English font styles with word-level highlight animation. Full caption editor coming in Phase 6B.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Audio & Outro (Shell Placeholder for Phase 6B) */}
          {activeTab === 'audio' && (
            <div className="p-5 space-y-4 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Audio & Outro Bumper</span>
                <Badge variant="muted" className="text-[10px]">
                  Phase 6B Shell
                </Badge>
              </div>

              <div className="p-4 rounded-xl border border-surface-border bg-slate-900/50 space-y-3">
                <span className="text-slate-300 font-semibold block">Volume & Enhancements</span>
                <input
                  type="range"
                  min="0"
                  max="200"
                  defaultValue="100"
                  className="w-full accent-brand-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Background music ducking and custom channel outro bumper options will be unlocked in Phase 6B.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ===================================================================== */}
      {/* BOTTOM: Timeline + Scrubber + Trim Handles                            */}
      {/* ===================================================================== */}
      <footer className="h-32 border-t border-surface-border bg-surface px-6 py-3 flex flex-col justify-between shrink-0 z-20">
        <div className="flex items-center justify-between text-xs">
          {/* Controls: Play/Pause, Time, Step */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
            </button>

            <span className="font-mono text-xs text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Loop Toggle */}
            <button
              onClick={() => setLoopTrim((l) => !l)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border transition ${
                loopTrim
                  ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                  : 'border-surface-border text-slate-400 hover:text-slate-200'
              }`}
            >
              <Repeat size={12} /> Loop Trim
            </button>
          </div>

          {/* Duration info & 60s warning badge */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs">
              Trimmed: <strong className="text-white font-mono">{trimmedDuration.toFixed(1)}s</strong>
            </span>

            {isOver60s && (
              <Badge variant="warning" className="gap-1 text-[10px] animate-pulse">
                <AlertTriangle size={12} /> Exceeds 60s (Recommended for Shorts &le; 60s)
              </Badge>
            )}

            <div className="text-[11px] text-slate-500 hidden sm:block">
              Shortcuts: <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">Space</kbd> play,{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">I</kbd>/
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">O</kbd> in/out,{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">&larr;</kbd>/
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">&rarr;</kbd> frame
            </div>
          </div>
        </div>

        {/* Timeline Bar with Scrubber and In/Out Handles */}
        <div className="relative h-12 bg-slate-900 rounded-xl border border-surface-border p-1 flex items-center overflow-hidden">
          {/* Active Trim Region Highlight */}
          <div
            className="absolute top-1 bottom-1 bg-brand-500/20 border-x-2 border-brand-500 rounded z-10 pointer-events-none"
            style={{
              left: `${(editJson.trim.in / Math.max(1, duration)) * 100}%`,
              width: `${((editJson.trim.out - editJson.trim.in) / Math.max(1, duration)) * 100}%`,
            }}
          />

          {/* Current Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none shadow"
            style={{ left: `${(currentTime / Math.max(1, duration)) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white -ml-1 -mt-1 shadow" />
          </div>

          {/* Interactive Range Input (Scrubber) */}
          <input
            type="range"
            min="0"
            max={duration || 60}
            step="0.05"
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              if (videoRef.current) videoRef.current.currentTime = val
              setCurrentTime(val)
            }}
            className="w-full h-full opacity-0 cursor-pointer z-30 absolute inset-0"
          />

          {/* In Handle Marker */}
          <div
            style={{ left: `${(editJson.trim.in / Math.max(1, duration)) * 100}%` }}
            className="absolute top-1 bottom-1 w-2 bg-brand-500 rounded-l cursor-ew-resize z-25 flex items-center justify-center"
            title={`In Point: ${editJson.trim.in.toFixed(1)}s (Press 'I' to set)`}
          />

          {/* Out Handle Marker */}
          <div
            style={{ left: `${(editJson.trim.out / Math.max(1, duration)) * 100}%` }}
            className="absolute top-1 bottom-1 w-2 bg-brand-500 rounded-r cursor-ew-resize z-25 flex items-center justify-center -ml-2"
            title={`Out Point: ${editJson.trim.out.toFixed(1)}s (Press 'O' to set)`}
          />
        </div>
      </footer>
    </div>
  )
}

function round2(num: number): number {
  return Math.round(num * 100) / 100
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return `${m}:${s.toString().padStart(2, '0')}.${ms}`
}
