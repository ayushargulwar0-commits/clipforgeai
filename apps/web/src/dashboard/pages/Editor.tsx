import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
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
  Loader2,
  Move,
  Maximize2,
  Search,
  X,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Scissors,
  Plus,
  ShieldAlert,
} from 'lucide-react'
import api from '@/lib/api'

// ---------------------------------------------------------------------------
// Types & Schema (Phase 6B Version 1)
// ---------------------------------------------------------------------------

export type AspectRatio = '9:16' | '1:1' | '4:5'
export type FramingMode = 'crop' | 'split' | 'blur_fit'
export type BackgroundType = 'blur' | 'solid' | 'image'
export type CaptionPosition = 'top' | 'middle' | 'lower_third'

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

export interface CaptionWord {
  text: string
  start: number
  end: number
}

export interface CaptionStyle {
  font: string
  size: number
  color: string
  highlight_color: string
  outline_color: string
  outline_width: number
  box: boolean
  box_color: string
  words_per_line: number // 1 to 4
  position: CaptionPosition
  y_offset: number
}

export interface CaptionsConfig {
  enabled: boolean
  preset: string
  words: CaptionWord[]
  style: CaptionStyle
  safe_zones: boolean
}

export interface EditJson {
  trim: TrimConfig
  aspect: AspectRatio
  framing: FramingConfig
  background: BackgroundConfig
  captions: CaptionsConfig
  outro: any
  watermark: any
}

// ---------------------------------------------------------------------------
// 6 Original Style Presets
// ---------------------------------------------------------------------------

export const STYLE_PRESETS: Record<string, CaptionStyle> = {
  'Firestorm Gold': {
    font: 'Noto Sans',
    size: 42,
    color: '#FFFFFF',
    highlight_color: '#FFD700',
    outline_color: '#000000',
    outline_width: 3,
    box: false,
    box_color: '#00000088',
    words_per_line: 3,
    position: 'lower_third',
    y_offset: 0,
  },
  'Cyber Neon': {
    font: 'Noto Sans',
    size: 44,
    color: '#E0F7FA',
    highlight_color: '#00FFCC',
    outline_color: '#0D0221',
    outline_width: 4,
    box: true,
    box_color: '#120024CC',
    words_per_line: 2,
    position: 'lower_third',
    y_offset: 0,
  },
  'Velvet Cinema': {
    font: 'Noto Sans',
    size: 38,
    color: '#FFF8E7',
    highlight_color: '#FFA726',
    outline_color: '#1A0E05',
    outline_width: 2,
    box: true,
    box_color: '#21130CCC',
    words_per_line: 3,
    position: 'lower_third',
    y_offset: 0,
  },
  'Nordic Minimal': {
    font: 'Noto Sans',
    size: 40,
    color: '#F8FAFC',
    highlight_color: '#60A5FA',
    outline_color: '#0F172A',
    outline_width: 3,
    box: false,
    box_color: '#0F172ACC',
    words_per_line: 3,
    position: 'lower_third',
    y_offset: 0,
  },
  'Devanagari Express': {
    font: 'Noto Sans Devanagari',
    size: 44,
    color: '#FFFFFF',
    highlight_color: '#FF9933',
    outline_color: '#138808',
    outline_width: 3,
    box: true,
    box_color: '#000000B3',
    words_per_line: 2,
    position: 'lower_third',
    y_offset: 0,
  },
  'Glitch Pulse': {
    font: 'Noto Sans',
    size: 46,
    color: '#F1F5F9',
    highlight_color: '#EC4899',
    outline_color: '#3B0764',
    outline_width: 4,
    box: false,
    box_color: '#00000099',
    words_per_line: 2,
    position: 'lower_third',
    y_offset: 0,
  },
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
    preset: 'Firestorm Gold',
    words: [
      { text: 'Stop', start: 0.5, end: 1.0 },
      { text: 'scrolling', start: 1.0, end: 1.6 },
      { text: 'right', start: 1.6, end: 2.1 },
      { text: 'now.', start: 2.1, end: 2.7 },
      { text: 'This', start: 3.0, end: 3.4 },
      { text: 'secret', start: 3.4, end: 4.0 },
      { text: 'changes', start: 4.0, end: 4.6 },
      { text: 'everything.', start: 4.6, end: 5.3 },
    ],
    style: STYLE_PRESETS['Firestorm Gold'],
    safe_zones: true,
  },
  outro: null,
  watermark: null,
}

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
  const [showSafeZoneOverlay, setShowSafeZoneOverlay] = useState(true)

  // Transcript Search & Editing State
  const [searchFilter, setSearchFilter] = useState('')
  const [editingWordIdx, setEditingWordIdx] = useState<number | null>(null)
  const [editingWordText, setEditingWordText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        const clipRes = await api.get(`/clips/${clipId}`).catch(() => null)
        if (clipRes?.data && isMounted) {
          if (clipRes.data.title) setClipTitle(clipRes.data.title)
          if (clipRes.data.source_url) {
            setVideoUrl(clipRes.data.source_url)
          } else if (clipRes.data.rendered_path) {
            setVideoUrl(`/storage/clips/${clipRes.data.rendered_path.split(/[\/\\]/).pop()}`)
          }
        }

        const editRes = await api.get(`/clips/${clipId}/edit`)
        if (editRes?.data?.edit_json && isMounted) {
          const loaded: EditJson = editRes.data.edit_json
          // Ensure captions object has style and preset defaults if legacy
          if (!loaded.captions.style || typeof loaded.captions.style === 'string') {
            loaded.captions.style = STYLE_PRESETS['Firestorm Gold']
          }
          if (!loaded.captions.preset) {
            loaded.captions.preset = 'Firestorm Gold'
          }
          if (loaded.captions.safe_zones === undefined) {
            loaded.captions.safe_zones = true
          }

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

    if (bgVideoRef.current && Math.abs(bgVideoRef.current.currentTime - t) > 0.2) {
      bgVideoRef.current.currentTime = t
    }

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

  const seekTo = (sec: number) => {
    if (!videoRef.current) return
    const clamped = Math.max(0, Math.min(duration, sec))
    videoRef.current.currentTime = clamped
    setCurrentTime(clamped)
  }

  // -------------------------------------------------------------------------
  // 5. Keyboard Shortcuts
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveChanges(true)
        return
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        handleUndo()
        return
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault()
        handleRedo()
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
        return
      }

      if (e.key.toLowerCase() === 'i') {
        e.preventDefault()
        const newIn = Math.max(0, Math.min(currentTime, editJson.trim.out - 0.5))
        updateEdit((prev) => ({
          ...prev,
          trim: { ...prev.trim, in: round2(newIn) },
        }))
        return
      }

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

      const stepFrames = e.shiftKey ? 5 : 1
      const stepSeconds = stepFrames / 30.0

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        seekTo(currentTime - stepSeconds)
        return
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        seekTo(currentTime + stepSeconds)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTime, duration, editJson, handleRedo, handleUndo, saveChanges, updateEdit])

  // -------------------------------------------------------------------------
  // 6. Framing & Aspect Logic
  // -------------------------------------------------------------------------
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

  // Draggable Crop Box Mouse Handlers
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
        false
      )
    }

    const handleMouseUp = () => {
      if (isDraggingCrop) {
        setIsDraggingCrop(false)
        setDragStart(null)
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
  // 7. Phase 6B: Live Caption Karaoke & Safe Zones
  // -------------------------------------------------------------------------
  const wordsPerLine = Math.max(1, Math.min(4, editJson.captions?.style?.words_per_line || 3))
  const wordsList = editJson.captions?.words || []

  // Group words into lines of wordsPerLine
  const captionLines = useMemo(() => {
    const lines: Array<{ index: number; words: CaptionWord[]; start: number; end: number }> = []
    for (let i = 0; i < wordsList.length; i += wordsPerLine) {
      const chunk = wordsList.slice(i, i + wordsPerLine)
      if (chunk.length > 0) {
        lines.push({
          index: Math.floor(i / wordsPerLine),
          words: chunk,
          start: chunk[0].start,
          end: chunk[chunk.length - 1].end,
        })
      }
    }
    return lines
  }, [wordsList, wordsPerLine])

  // Active line for current time
  const activeLine = useMemo(() => {
    return captionLines.find((l) => currentTime >= l.start && currentTime <= l.end + 0.3)
  }, [captionLines, currentTime])

  // Apply style preset
  const handleApplyPreset = (presetName: string) => {
    const preset = STYLE_PRESETS[presetName]
    if (!preset) return
    updateEdit((prev) => ({
      ...prev,
      captions: {
        ...prev.captions,
        preset: presetName,
        style: {
          ...preset,
          words_per_line: prev.captions.style.words_per_line,
        },
      },
    }))
    success('Preset Applied', `Style updated to "${presetName}".`)
  }

  // Update specific style field
  const updateStyle = (key: keyof CaptionStyle, value: any) => {
    updateEdit((prev) => ({
      ...prev,
      captions: {
        ...prev.captions,
        style: {
          ...prev.captions.style,
          [key]: value,
        },
      },
    }))
  }

  // -------------------------------------------------------------------------
  // 8. Transcript Editor Actions (Edit, Split, Merge, Delete, Import)
  // -------------------------------------------------------------------------
  const filteredLines = useMemo(() => {
    if (!searchFilter.trim()) return captionLines
    const q = searchFilter.toLowerCase()
    return captionLines.filter((line) => line.words.some((w) => w.text.toLowerCase().includes(q)))
  }, [captionLines, searchFilter])

  const handleSaveWordEdit = (wordGlobalIdx: number) => {
    if (!editingWordText.trim()) return
    updateEdit((prev) => {
      const newWords = [...prev.captions.words]
      if (newWords[wordGlobalIdx]) {
        newWords[wordGlobalIdx] = {
          ...newWords[wordGlobalIdx],
          text: editingWordText.trim(),
        }
      }
      return {
        ...prev,
        captions: { ...prev.captions, words: newWords },
      }
    })
    setEditingWordIdx(null)
    setEditingWordText('')
  }

  const handleDeleteWord = (wordGlobalIdx: number) => {
    updateEdit((prev) => {
      const newWords = prev.captions.words.filter((_, idx) => idx !== wordGlobalIdx)
      return {
        ...prev,
        captions: { ...prev.captions, words: newWords },
      }
    })
  }

  const handleSplitLine = (lineIdx: number) => {
    // Splits line by decreasing words_per_line or re-chunking
    const targetWord = wordsList[lineIdx * wordsPerLine + 1]
    if (!targetWord) return
    updateStyle('words_per_line', Math.max(1, wordsPerLine - 1))
    success('Adjusted Flow', 'Words per line reduced to split phrasing.')
  }

  const handleMergeLine = (lineIdx: number) => {
    updateStyle('words_per_line', Math.min(4, wordsPerLine + 1))
    success('Adjusted Flow', 'Words per line increased to merge lines.')
  }

  // Subtitle File Import (.srt / .vtt / .ass)
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const text = String(evt.target?.result || '')
        const parsedWords = parseSubtitleTextToWords(text)
        if (parsedWords.length === 0) {
          toastError('Import Failed', 'No valid subtitle cues or timestamps found.')
          return
        }

        if (window.confirm(`Replace existing captions with ${parsedWords.length} words from "${file.name}"?`)) {
          updateEdit((prev) => ({
            ...prev,
            captions: {
              ...prev.captions,
              words: parsedWords,
            },
          }))
          success('Captions Imported', `Loaded ${parsedWords.length} words from ${file.name}.`)
        }
      } catch (err: any) {
        toastError('Import Error', err?.message || 'Could not parse subtitle file.')
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  // -------------------------------------------------------------------------
  // Safe Zone Calculation for Captions
  // -------------------------------------------------------------------------
  const captionStyle = editJson.captions?.style || STYLE_PRESETS['Firestorm Gold']
  const safeZonesActive = editJson.captions?.safe_zones

  // Calculate top/bottom position clamped away from UI safe zones
  // On 9:16 Shorts: bottom 20% is deadzone (title/sound), right 15% is deadzone (like/comment buttons), top 8% is header
  const getCaptionContainerStyle = (): React.CSSProperties => {
    let basePosStyle: React.CSSProperties = {}
    const yOff = captionStyle.y_offset || 0

    if (captionStyle.position === 'top') {
      const topOffset = safeZonesActive ? Math.max(50, 60 + yOff) : Math.max(20, 20 + yOff)
      basePosStyle = { top: `${topOffset}px` }
    } else if (captionStyle.position === 'middle') {
      basePosStyle = {
        top: '50%',
        transform: `translateY(calc(-50% + ${yOff}px))`,
      }
    } else {
      // lower_third
      // If safe zones active: clamp away from bottom 20% (~100px on 533px preview height)
      const bottomOffset = safeZonesActive ? Math.max(105, 105 - yOff) : Math.max(30, 30 - yOff)
      basePosStyle = { bottom: `${bottomOffset}px` }
    }

    return {
      position: 'absolute',
      left: safeZonesActive ? '20px' : '10px',
      right: safeZonesActive ? '65px' : '10px', // Right margin keeps clear of button column
      ...basePosStyle,
      zIndex: 25,
      pointerEvents: 'none',
      display: 'flex',
      justifyContent: 'center',
    }
  }

  const trimmedDuration = Math.max(0, editJson.trim.out - editJson.trim.in)
  const isOver60s = trimmedDuration > 60

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Hidden File Input for .srt / .vtt / .ass */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".srt,.vtt,.ass"
        onChange={handleImportFile}
        className="hidden"
      />

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
            onClick={() => success('Export Queued', 'Full HD 1080x1920 render started with captions & framing.')}
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
          {/* Safe Zone Toggle Button in Corner */}
          <div className="absolute top-4 left-6 z-30">
            <button
              onClick={() => setShowSafeZoneOverlay((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition backdrop-blur shadow ${
                showSafeZoneOverlay
                  ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                  : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {showSafeZoneOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
              Safe Zones Guide
            </button>
          </div>

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

              {editJson.framing.mode === 'split' && (
                <div className="w-full h-full flex flex-col">
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
                  </div>
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

            {/* SAFE ZONE OVERLAY GUIDE (YouTube Shorts UI Outlines) */}
            {showSafeZoneOverlay && editJson.aspect === '9:16' && (
              <div className="absolute inset-0 z-20 pointer-events-none border border-dashed border-amber-500/30">
                {/* Right button column deadzone */}
                <div className="absolute right-0 top-1/3 bottom-24 w-12 border-l border-dashed border-amber-500/40 bg-amber-500/5 flex items-center justify-center">
                  <span className="text-[9px] text-amber-400 font-mono -rotate-90">UI Buttons</span>
                </div>
                {/* Bottom title & channel deadzone */}
                <div className="absolute inset-x-0 bottom-0 h-24 border-t border-dashed border-amber-500/40 bg-amber-500/5 flex items-center justify-center">
                  <span className="text-[10px] text-amber-400 font-mono">Title & Audio UI Deadzone (20%)</span>
                </div>
              </div>
            )}

            {/* LIVE CAPTION KARAOKE PREVIEW */}
            {editJson.captions?.enabled && activeLine && (
              <div style={getCaptionContainerStyle()}>
                <div
                  style={{
                    fontFamily: `'${captionStyle.font || 'Noto Sans'}', 'Noto Sans Devanagari', sans-serif`,
                    fontSize: `${Math.round(captionStyle.size * 0.42)}px`,
                    lineHeight: '1.25',
                    textAlign: 'center',
                    backgroundColor: captionStyle.box ? captionStyle.box_color : 'transparent',
                    padding: captionStyle.box ? '4px 10px' : '0px',
                    borderRadius: captionStyle.box ? '8px' : '0px',
                    textShadow: `${captionStyle.outline_width}px ${captionStyle.outline_width}px 0 ${captionStyle.outline_color}, -${captionStyle.outline_width}px -${captionStyle.outline_width}px 0 ${captionStyle.outline_color}, -${captionStyle.outline_width}px ${captionStyle.outline_width}px 0 ${captionStyle.outline_color}, ${captionStyle.outline_width}px -${captionStyle.outline_width}px 0 ${captionStyle.outline_color}`,
                    display: 'inline-flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '4px',
                    maxWidth: '90%',
                  }}
                  className="font-black tracking-tight"
                >
                  {activeLine.words.map((w, wIdx) => {
                    const isWordActive = currentTime >= w.start && currentTime <= w.end
                    return (
                      <span
                        key={wIdx}
                        style={{
                          color: isWordActive ? captionStyle.highlight_color : captionStyle.color,
                          transform: isWordActive ? 'scale(1.08)' : 'scale(1)',
                          transition: 'transform 0.08s ease, color 0.08s ease',
                          display: 'inline-block',
                        }}
                      >
                        {w.text}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL: 3 Tabs */}
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
              <Type size={14} /> Subtitles
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

                  <div
                    ref={sourceBoxRef}
                    className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-700 bg-slate-900 select-none cursor-ew-resize"
                  >
                    <video
                      src={videoUrl}
                      className="w-full h-full object-cover opacity-60 pointer-events-none"
                    />

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

          {/* TAB 2: Text & Subtitles (Phase 6B Complete) */}
          {activeTab === 'text' && (
            <div className="p-4 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Enable / Disable Captions */}
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div>
                  <span className="font-bold text-slate-200 block text-xs">Burn In Captions</span>
                  <span className="text-[11px] text-slate-400">Karaoke-style word highlight</span>
                </div>
                <input
                  type="checkbox"
                  checked={editJson.captions.enabled}
                  onChange={(e) =>
                    updateEdit((prev) => ({
                      ...prev,
                      captions: { ...prev.captions, enabled: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              {/* 6 Original Style Presets */}
              <div>
                <label className="font-bold text-slate-300 block mb-2 uppercase tracking-wider text-[10px]">
                  Style Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(STYLE_PRESETS).map((pName) => {
                    const isSelected = editJson.captions.preset === pName
                    return (
                      <button
                        key={pName}
                        onClick={() => handleApplyPreset(pName)}
                        className={`p-2 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/15 text-white shadow'
                            : 'border-surface-border bg-slate-900/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs truncate">{pName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {pName === 'Devanagari Express' ? 'Hindi / English' : `${STYLE_PRESETS[pName].words_per_line} words/line`}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Fine-Tuning Controls */}
              <div className="space-y-3 pt-2 border-t border-surface-border">
                <label className="font-bold text-slate-300 block uppercase tracking-wider text-[10px]">
                  Custom Formatting
                </label>

                {/* Words Per Line */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Words per line:</span>
                  <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-surface-border">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => updateStyle('words_per_line', n)}
                        className={`px-2 py-0.5 rounded text-xs transition ${
                          wordsPerLine === n
                            ? 'bg-brand-600 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Font Size ({captionStyle.size}px):</span>
                  <input
                    type="range"
                    min="24"
                    max="64"
                    value={captionStyle.size}
                    onChange={(e) => updateStyle('size', parseInt(e.target.value))}
                    className="w-28 accent-brand-500 cursor-pointer"
                  />
                </div>

                {/* Colors (Primary, Highlight, Outline) */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="p-2 rounded-lg bg-slate-900 border border-surface-border">
                    <span className="text-slate-400 block mb-1">Text Color</span>
                    <input
                      type="color"
                      value={captionStyle.color}
                      onChange={(e) => updateStyle('color', e.target.value)}
                      className="w-6 h-6 mx-auto cursor-pointer block bg-transparent"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-surface-border">
                    <span className="text-slate-400 block mb-1">Highlight</span>
                    <input
                      type="color"
                      value={captionStyle.highlight_color}
                      onChange={(e) => updateStyle('highlight_color', e.target.value)}
                      className="w-6 h-6 mx-auto cursor-pointer block bg-transparent"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-surface-border">
                    <span className="text-slate-400 block mb-1">Outline</span>
                    <input
                      type="color"
                      value={captionStyle.outline_color}
                      onChange={(e) => updateStyle('outline_color', e.target.value)}
                      className="w-6 h-6 mx-auto cursor-pointer block bg-transparent"
                    />
                  </div>
                </div>

                {/* Position & Safe Zones Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Position:</span>
                  <select
                    value={captionStyle.position}
                    onChange={(e) => updateStyle('position', e.target.value as CaptionPosition)}
                    className="bg-slate-900 border border-surface-border text-white text-xs rounded px-2 py-1"
                  >
                    <option value="lower_third">Lower Third (Recommended)</option>
                    <option value="middle">Middle</option>
                    <option value="top">Top</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Safe Zones Clamping:</span>
                  <input
                    type="checkbox"
                    checked={editJson.captions.safe_zones}
                    onChange={(e) =>
                      updateEdit((prev) => ({
                        ...prev,
                        captions: { ...prev.captions, safe_zones: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* TRANSCRIPT EDITOR PANEL */}
              <div className="pt-3 border-t border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                    Transcript Editor ({wordsList.length} words)
                  </label>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1 text-[10px]"
                    title="Import .srt, .vtt, or .ass file"
                  >
                    <Upload size={11} /> Import Subtitles
                  </Button>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search caption phrases..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-900 border border-surface-border text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Lines List */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {filteredLines.length === 0 ? (
                    <p className="text-[11px] text-slate-500 text-center py-4">No matching captions found.</p>
                  ) : (
                    filteredLines.map((line) => {
                      const isCurrentLine = currentTime >= line.start && currentTime <= line.end
                      return (
                        <div
                          key={line.index}
                          className={`p-2 rounded-lg border transition ${
                            isCurrentLine
                              ? 'border-brand-500/60 bg-brand-500/10'
                              : 'border-surface-border bg-slate-900/50 hover:border-slate-700'
                          }`}
                        >
                          {/* Timestamp & Line Seek */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                            <button
                              onClick={() => seekTo(line.start)}
                              className="font-mono text-brand-400 hover:underline flex items-center gap-1"
                            >
                              <Play size={10} fill="currentColor" /> {formatTime(line.start)} - {formatTime(line.end)}
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSplitLine(line.index)}
                                title="Split line"
                                className="p-0.5 hover:text-white text-slate-500"
                              >
                                <Scissors size={11} />
                              </button>
                              <button
                                onClick={() => handleMergeLine(line.index)}
                                title="Merge with next"
                                className="p-0.5 hover:text-white text-slate-500"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Words in line */}
                          <div className="flex flex-wrap gap-1">
                            {line.words.map((w) => {
                              const globalIdx = wordsList.indexOf(w)
                              const isEditing = editingWordIdx === globalIdx
                              return (
                                <div
                                  key={globalIdx}
                                  className="group relative inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 border border-slate-700/80"
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      autoFocus
                                      value={editingWordText}
                                      onChange={(e) => setEditingWordText(e.target.value)}
                                      onBlur={() => handleSaveWordEdit(globalIdx)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveWordEdit(globalIdx)
                                        if (e.key === 'Escape') setEditingWordIdx(null)
                                      }}
                                      className="bg-brand-900/60 text-white outline-none text-xs rounded px-1 max-w-[80px]"
                                    />
                                  ) : (
                                    <span
                                      onClick={() => {
                                        setEditingWordIdx(globalIdx)
                                        setEditingWordText(w.text)
                                      }}
                                      title="Click to edit word"
                                      className="cursor-pointer text-slate-200 hover:text-brand-300"
                                    >
                                      {w.text}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleDeleteWord(globalIdx)}
                                    title="Delete word"
                                    className="opacity-0 group-hover:opacity-100 ml-1 text-red-400 hover:text-red-300 transition"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Audio & Outro */}
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
                  Background music ducking and custom channel outro bumper options will be unlocked in Phase 6C.
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

        <div className="relative h-12 bg-slate-900 rounded-xl border border-surface-border p-1 flex items-center overflow-hidden">
          <div
            className="absolute top-1 bottom-1 bg-brand-500/20 border-x-2 border-brand-500 rounded z-10 pointer-events-none"
            style={{
              left: `${(editJson.trim.in / Math.max(1, duration)) * 100}%`,
              width: `${((editJson.trim.out - editJson.trim.in) / Math.max(1, duration)) * 100}%`,
            }}
          />

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none shadow"
            style={{ left: `${(currentTime / Math.max(1, duration)) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white -ml-1 -mt-1 shadow" />
          </div>

          <input
            type="range"
            min="0"
            max={duration || 60}
            step="0.05"
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              seekTo(val)
            }}
            className="w-full h-full opacity-0 cursor-pointer z-30 absolute inset-0"
          />

          <div
            style={{ left: `${(editJson.trim.in / Math.max(1, duration)) * 100}%` }}
            className="absolute top-1 bottom-1 w-2 bg-brand-500 rounded-l cursor-ew-resize z-25 flex items-center justify-center"
            title={`In Point: ${editJson.trim.in.toFixed(1)}s (Press 'I' to set)`}
          />

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

function stripHtml(input: string): string {
  return input.replace(/<\/?[^>]+(>|$)/g, '')
}

function parseSubtitleTextToWords(rawContent: string): CaptionWord[] {
  const clean = stripHtml(rawContent)
  const words: CaptionWord[] = []

  // Simple, robust SRT/VTT parser
  // Matches timestamps like 00:00:01,234 --> 00:00:04,567 or 00:00:01.234 --> 00:00:04.567
  const cueRegex = /(\d{1,2}:(?:\d{2}:)?\d{2}[,.]\d{2,3})\s*-->\s*(\d{1,2}:(?:\d{2}:)?\d{2}[,.]\d{2,3})/g
  const blocks = clean.split(/\n\s*\n/)

  for (const block of blocks) {
    const match = cueRegex.exec(block)
    if (!match) continue

    const startSec = parseTimestamp(match[1])
    const endSec = parseTimestamp(match[2])
    const textLines = block
      .replace(cueRegex, '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !/^\d+$/.test(l))
    const cueText = textLines.join(' ')

    const cueWords = cueText.split(/\s+/).filter((w) => w.trim().length > 0)
    if (cueWords.length === 0) continue

    const wordDuration = Math.max(0.15, (endSec - startSec) / cueWords.length)
    for (let i = 0; i < cueWords.length; i++) {
      const wStart = round2(startSec + i * wordDuration)
      const wEnd = round2(Math.min(endSec, wStart + wordDuration))
      words.push({
        text: cueWords[i],
        start: wStart,
        end: wEnd,
      })
    }
  }

  return words
}

function parseTimestamp(ts: string): number {
  const parts = ts.replace(',', '.').split(':')
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2])
  } else if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
  }
  return parseFloat(ts) || 0
}
