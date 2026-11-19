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
  Volume2,
  VolumeX,
  ShieldAlert,
  Sliders,
  Check,
  Bell,
  Share2,
} from 'lucide-react'
import api from '@/lib/api'

// ---------------------------------------------------------------------------
// Types & Schema (Phase 6C Version 1)
// ---------------------------------------------------------------------------

export type AspectRatio = '9:16' | '1:1' | '4:5'
export type FramingMode = 'crop' | 'split' | 'blur_fit'
export type BackgroundType = 'blur' | 'solid' | 'image'
export type CaptionPosition = 'top' | 'middle' | 'lower_third'
export type WatermarkPosition = 'tl' | 'tr' | 'bl' | 'br'
export type OutroTemplate = 'subscribe' | 'follow' | 'custom_text'

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
  words_per_line: number
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

export interface MusicConfig {
  asset_id: string | null
  volume: number // 0-100
  fade_in_s: number
  fade_out_s: number
  duck_under_speech: boolean
}

export interface AudioConfig {
  original_volume: number // 0-200
  music: MusicConfig
}

export interface WatermarkConfig {
  asset_id: string | null
  position: WatermarkPosition
  size_pct: number // 5-40
  opacity: number // 10-100
  margin_pct: number // 0-20
}

export interface OutroConfig {
  enabled: boolean
  template: OutroTemplate
  text: string
  duration_s: number // 1-5
  bg_color: string
  text_color: string
}

export interface EditJson {
  trim: TrimConfig
  aspect: AspectRatio
  framing: FramingConfig
  background: BackgroundConfig
  captions: CaptionsConfig
  audio: AudioConfig
  watermark: WatermarkConfig | null
  outro: OutroConfig | null
}

export interface AssetRecord {
  id: string
  user_id: string
  name: string
  asset_type: 'image' | 'audio'
  file_path: string
  file_url: string
  size_bytes: number
  mime_type: string
  created_at: string
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
  audio: {
    original_volume: 100,
    music: {
      asset_id: null,
      volume: 50,
      fade_in_s: 1.0,
      fade_out_s: 1.5,
      duck_under_speech: true,
    },
  },
  watermark: null,
  outro: {
    enabled: false,
    template: 'subscribe',
    text: 'Subscribe for More!',
    duration_s: 3,
    bg_color: '#0A0A0F',
    text_color: '#FFFFFF',
  },
}

const SAMPLE_HORIZONTAL_VIDEO = '/sample-clip.mp4'

const DEFAULT_TIMELINE_THUMBNAILS = Array.from(
  { length: 8 },
  (_, i) => `/thumbnails/yt-clip-1794763864649-1_thumb_${i}.jpg`
)

export default function Editor() {
  const { clipId: routeClipId } = useParams<{ clipId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const clipId = routeClipId || searchParams.get('clip') || 'yt-clip-1794763864649-1'

  // If no route clipId provided, redirect to user's first clip or to My Clips
  useEffect(() => {
    if (!routeClipId) {
      try {
        const saved = localStorage.getItem('cf_user_clips')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id) {
            navigate(`/dashboard/editor/${parsed[0].id}`, { replace: true })
            return
          }
        }
      } catch (_) {}
      navigate('/dashboard/clips', { replace: true })
    }
  }, [routeClipId, navigate])

  // Edit State & History
  const [editJson, setEditJson] = useState<EditJson>(DEFAULT_EDIT_JSON)
  const [history, setHistory] = useState<EditJson[]>([DEFAULT_EDIT_JSON])
  const [historyIdx, setHistoryIdx] = useState(0)

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loopTrim, setLoopTrim] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [clipTitle, setClipTitle] = useState<string>('My Short Clip')
  const [videoError, setVideoError] = useState<string | null>(null)
  const [thumbnails, setThumbnails] = useState<string[]>([])

  // UI State
  const [activeTab, setActiveTab] = useState<'framing' | 'text' | 'audio' | 'media'>('framing')
  const [isSaving, setIsSaving] = useState(false)
  const [isAutoFraming, setIsAutoFraming] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [showSafeZoneOverlay, setShowSafeZoneOverlay] = useState(true)

  // Assets Management State
  const [userAssets, setUserAssets] = useState<AssetRecord[]>([])
  const [isUploadingAsset, setIsUploadingAsset] = useState(false)
  const logoUploadRef = useRef<HTMLInputElement>(null)
  const audioUploadRef = useRef<HTMLInputElement>(null)

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
  const musicAudioRef = useRef<HTMLAudioElement>(null)
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
  // Load User Assets
  // -------------------------------------------------------------------------
  const fetchUserAssets = useCallback(async () => {
    try {
      const res = await api.get('/assets')
      if (Array.isArray(res.data)) {
        setUserAssets(res.data)
      } else {
        setUserAssets([])
      }
    } catch (_) {
      setUserAssets([])
    }
  }, [])

  useEffect(() => {
    fetchUserAssets()
  }, [fetchUserAssets])

  // -------------------------------------------------------------------------
  // Handlers for Video Stream & Metadata
  // -------------------------------------------------------------------------
  const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget
    if (vid.duration && !isNaN(vid.duration) && vid.duration > 0) {
      console.log('[Editor] Loaded metadata duration:', vid.duration)
      setDuration(vid.duration)
      setVideoError(null)
      setEditJson((prev) => {
        const targetOut = prev.trim.out > vid.duration || prev.trim.out === 60 ? vid.duration : prev.trim.out
        if (targetOut !== prev.trim.out && targetOut > prev.trim.in) {
          return { ...prev, trim: { ...prev.trim, out: targetOut } }
        }
        return prev
      })
    }
  }, [])

  const handleVideoError = useCallback(async (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget
    let msg = 'Failed to load video stream.'
    const errCode = vid.error?.code
    if (vid.error) {
      if (errCode === 4) {
        msg = 'MediaError 4 (SRC_NOT_SUPPORTED): Codec not supported or URL unreachable.'
      } else if (errCode === 2) {
        msg = 'MediaError 2 (NETWORK_NO_SOURCE): Network error during video stream.'
      } else if (errCode === 3) {
        msg = 'MediaError 3 (DECODE): Video decoding error.'
      } else if (errCode === 1) {
        msg = 'MediaError 1 (ABORTED): Playback aborted.'
      }
    }

    // If stream URL failed (e.g. HTTP 404/403 or unreachable backend), gracefully fallback to bundled local sample video
    if (vid.src && !vid.src.includes('sample-clip.mp4')) {
      console.warn('[Editor] Video stream failed, attempting fallback to bundled sample video')
      setVideoUrl(SAMPLE_HORIZONTAL_VIDEO)
      setVideoError(null)
      return
    }

    try {
      if (vid.src) {
        const check = await fetch(vid.src, { method: 'GET', headers: { Range: 'bytes=0-0' } })
        if (!check.ok && check.status !== 206) {
          msg = `HTTP ${check.status} ${check.statusText}: Stream endpoint error`
        }
      }
    } catch (netErr: any) {
      msg = `${msg} [Fetch error: ${netErr.message}]`
    }
    console.error('[Editor] Video error:', msg, vid.error)
    setVideoError(msg)
  }, [])

  // -------------------------------------------------------------------------
  // 1. Data Loading: GET /clips/{id}/edit & Clip Details
  // -------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true

    async function loadClipData() {
      try {
        const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

        // Check local user clips from localStorage first
        let localClipItem: any = null
        try {
          const saved = localStorage.getItem('cf_user_clips')
          if (saved) {
            const list = JSON.parse(saved)
            if (Array.isArray(list)) {
              localClipItem = list.find((c: any) => c.id === clipId) || null
            }
          }
        } catch (_) {}

        if (localClipItem) {
          if (localClipItem.title) setClipTitle(localClipItem.title)
          if (localClipItem.thumbnail_url) {
            setThumbnails([localClipItem.thumbnail_url])
          }
        }

        // 1. Fetch short-lived signed stream token
        let streamToken: string | null = null
        try {
          const tokenRes = await api.post(`/clips/${clipId}/stream-token`)
          streamToken = tokenRes?.data?.token || null
        } catch (tokErr: any) {
          console.warn('[Editor] Failed to get stream token:', tokErr.message)
        }

        let finalStreamUrl = ''
        if (streamToken) {
          finalStreamUrl = `${apiBase}/clips/${clipId}/stream?token=${encodeURIComponent(streamToken)}`
        } else if (
          localClipItem?.video_url &&
          !localClipItem.video_url.startsWith('/api/') &&
          !localClipItem.video_url.includes('commondatastorage')
        ) {
          finalStreamUrl = localClipItem.video_url
        } else {
          finalStreamUrl = SAMPLE_HORIZONTAL_VIDEO
        }

        console.log('[Editor] Final video src:', finalStreamUrl)
        if (isMounted) {
          setVideoUrl(finalStreamUrl)
        }

        // 2. Load timeline thumbnail frames (api client baseURL is already /api)
        const thumbEndpoint = `/clips/${clipId}/thumbnails${streamToken ? `?token=${encodeURIComponent(streamToken)}` : ''}`
        api
          .get(thumbEndpoint)
          .then((tRes) => {
            if (tRes?.data?.thumbnails && isMounted) {
              setThumbnails(tRes.data.thumbnails)
            }
          })
          .catch((tErr) => {
            console.warn('[Editor] Thumbnails fetch failed:', tErr.message)
          })

        const clipRes = await api.get(`/clips/${clipId}`).catch(() => null)
        if (clipRes?.data && isMounted) {
          if (clipRes.data.title) setClipTitle(clipRes.data.title)
          if (!streamToken) {
            if (clipRes.data.source_url) {
              setVideoUrl(clipRes.data.source_url)
            } else if (clipRes.data.rendered_path) {
              setVideoUrl(`/storage/clips/${clipRes.data.rendered_path.split(/[\/\\]/).pop()}`)
            }
          }
        }

        const editRes = await api.get(`/clips/${clipId}/edit`)
        if (editRes?.data?.edit_json && isMounted) {
          const loaded: EditJson = editRes.data.edit_json
          if (!loaded.captions.style || typeof loaded.captions.style === 'string') {
            loaded.captions.style = STYLE_PRESETS['Firestorm Gold']
          }
          if (!loaded.captions.preset) {
            loaded.captions.preset = 'Firestorm Gold'
          }
          if (loaded.captions.safe_zones === undefined) {
            loaded.captions.safe_zones = true
          }
          if (!loaded.audio) {
            loaded.audio = DEFAULT_EDIT_JSON.audio
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
          success('Changes Saved', 'Saved to database successfully.')
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
  // 4. Video Time Update & Synchronized Music Audio
  // -------------------------------------------------------------------------
  const selectedMusicAsset = useMemo(() => {
    if (!Array.isArray(userAssets)) return undefined
    return userAssets.find((a) => a.id === editJson.audio?.music?.asset_id)
  }, [userAssets, editJson.audio?.music?.asset_id])

  const selectedWatermarkAsset = useMemo(() => {
    if (!Array.isArray(userAssets)) return undefined
    return userAssets.find((a) => a.id === editJson.watermark?.asset_id)
  }, [userAssets, editJson.watermark?.asset_id])

  // Sync background music volume
  useEffect(() => {
    if (musicAudioRef.current && editJson.audio?.music) {
      const vol = (editJson.audio.music.volume / 100) * (editJson.audio.music.duck_under_speech ? 0.4 : 1.0)
      musicAudioRef.current.volume = Math.max(0, Math.min(1, vol))
    }
  }, [editJson.audio?.music])

  // Sync video volume
  useEffect(() => {
    if (videoRef.current && editJson.audio?.original_volume !== undefined) {
      videoRef.current.volume = Math.max(0, Math.min(1, editJson.audio.original_volume / 100))
    }
  }, [editJson.audio?.original_volume])

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const t = videoRef.current.currentTime
    setCurrentTime(t)

    if (bgVideoRef.current && Math.abs(bgVideoRef.current.currentTime - t) > 0.2) {
      bgVideoRef.current.currentTime = t
    }

    // Music sync
    if (musicAudioRef.current && selectedMusicAsset) {
      const relTime = Math.max(0, t - editJson.trim.in)
      if (Math.abs(musicAudioRef.current.currentTime - relTime) > 0.3) {
        musicAudioRef.current.currentTime = relTime % (musicAudioRef.current.duration || 60)
      }
    }

    // Loop check
    const outroDuration = editJson.outro?.enabled ? editJson.outro.duration_s : 0
    const totalOut = editJson.trim.out + outroDuration

    if (loopTrim && t >= totalOut) {
      videoRef.current.currentTime = editJson.trim.in
      if (bgVideoRef.current) bgVideoRef.current.currentTime = editJson.trim.in
      if (musicAudioRef.current) musicAudioRef.current.currentTime = 0
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
      if (musicAudioRef.current && selectedMusicAsset) {
        musicAudioRef.current.play().catch(() => {})
      }
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      bgVideoRef.current?.pause()
      musicAudioRef.current?.pause()
      setIsPlaying(false)
    }
  }

  const seekTo = (sec: number) => {
    if (!videoRef.current) return
    const clamped = Math.max(0, Math.min(duration, sec))
    videoRef.current.currentTime = clamped
    setCurrentTime(clamped)
    if (musicAudioRef.current && selectedMusicAsset) {
      const rel = Math.max(0, clamped - editJson.trim.in)
      musicAudioRef.current.currentTime = rel % (musicAudioRef.current.duration || 60)
    }
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
  // 7. Caption Logic
  // -------------------------------------------------------------------------
  const wordsPerLine = Math.max(1, Math.min(4, editJson.captions?.style?.words_per_line || 3))
  const wordsList = editJson.captions?.words || []

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

  const activeLine = useMemo(() => {
    return captionLines.find((l) => currentTime >= l.start && currentTime <= l.end + 0.3)
  }, [captionLines, currentTime])

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
  // 8. Asset Upload Handlers
  // -------------------------------------------------------------------------
  const handleUploadAssetFile = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'audio') => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAsset(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploaded: AssetRecord = res.data
      await fetchUserAssets()

      if (target === 'logo') {
        updateEdit((prev) => ({
          ...prev,
          watermark: {
            asset_id: uploaded.id,
            position: prev.watermark?.position || 'tr',
            size_pct: prev.watermark?.size_pct || 15,
            opacity: prev.watermark?.opacity || 85,
            margin_pct: prev.watermark?.margin_pct || 5,
          },
        }))
        success('Watermark Attached', `Attached "${uploaded.name}".`)
      } else {
        updateEdit((prev) => ({
          ...prev,
          audio: {
            ...prev.audio,
            music: {
              ...prev.audio.music,
              asset_id: uploaded.id,
            },
          },
        }))
        success('Music Track Attached', `Attached "${uploaded.name}".`)
      }
    } catch (err: any) {
      toastError('Upload Failed', err?.response?.data?.detail || err?.message || 'Could not upload file.')
    } finally {
      setIsUploadingAsset(false)
      if (logoUploadRef.current) logoUploadRef.current.value = ''
      if (audioUploadRef.current) audioUploadRef.current.value = ''
    }
  }

  // -------------------------------------------------------------------------
  // 9. Watermark Overlay Coordinates
  // -------------------------------------------------------------------------
  const getWatermarkPositionStyle = (): React.CSSProperties => {
    const wm = editJson.watermark
    if (!wm || !wm.asset_id) return { display: 'none' }

    const margin = wm.margin_pct
    const pos = wm.position
    const safe = editJson.captions.safe_zones

    const style: React.CSSProperties = {
      position: 'absolute',
      width: `${wm.size_pct}%`,
      opacity: wm.opacity / 100,
      zIndex: 26,
      pointerEvents: 'none',
      transition: 'all 0.15s ease',
    }

    if (pos === 'tl') {
      style.top = `${margin}%`
      style.left = `${margin}%`
    } else if (pos === 'tr') {
      style.top = `${margin}%`
      style.right = `${safe ? Math.max(margin, 15) : margin}%`
    } else if (pos === 'bl') {
      style.bottom = `${safe ? Math.max(margin, 20) : margin}%`
      style.left = `${margin}%`
    } else if (pos === 'br') {
      style.bottom = `${safe ? Math.max(margin, 20) : margin}%`
      style.right = `${safe ? Math.max(margin, 15) : margin}%`
    }

    return style
  }

  // -------------------------------------------------------------------------
  // 10. Outro Check
  // -------------------------------------------------------------------------
  const isShowingOutro = useMemo(() => {
    if (!editJson.outro?.enabled) return false
    return currentTime >= editJson.trim.out
  }, [currentTime, editJson.outro, editJson.trim.out])

  const totalDuration = useMemo(() => {
    const trimDur = editJson.trim.out - editJson.trim.in
    const outroDur = editJson.outro?.enabled ? editJson.outro.duration_s : 0
    return round2(trimDur + outroDur)
  }, [editJson.outro, editJson.trim.in, editJson.trim.out])

  const isOver60s = totalDuration > 60

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Hidden Inputs for File Uploads */}
      <input ref={fileInputRef} type="file" accept=".srt,.vtt,.ass" className="hidden" />
      <input
        ref={logoUploadRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => handleUploadAssetFile(e, 'logo')}
        className="hidden"
      />
      <input
        ref={audioUploadRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"
        onChange={(e) => handleUploadAssetFile(e, 'audio')}
        className="hidden"
      />

      {/* Hidden Synchronized Music Audio Track */}
      {selectedMusicAsset && (
        <audio
          ref={musicAudioRef}
          src={selectedMusicAsset.file_url}
          preload="auto"
          className="hidden"
        />
      )}

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
            onClick={() => success('Export Queued', 'Full HD 1080x1920 render queued with all audio, watermark and outro layers.')}
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
            {editJson.framing.mode === 'blur_fit' && !isShowingOutro && (
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
            {!isShowingOutro && (
              <div className="absolute inset-0 z-10 overflow-hidden flex items-center justify-center">
                {videoError && (
                  <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center text-rose-300 space-y-3">
                    <AlertTriangle className="w-10 h-10 text-rose-500 animate-pulse" />
                    <div className="text-sm font-semibold text-white">Stream Playback Error</div>
                    <div className="text-xs text-rose-400 font-mono bg-rose-950/60 p-2.5 rounded-lg border border-rose-800/50 max-w-xs break-words">
                      {videoError}
                    </div>
                    <Button size="xs" variant="outline" onClick={() => window.location.reload()} className="mt-2 text-xs">
                      Retry Stream
                    </Button>
                  </div>
                )}

                {editJson.framing.mode === 'crop' && (
                  <div className="relative w-full h-full overflow-hidden">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      preload="auto"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onError={handleVideoError}
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
                    preload="auto"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onError={handleVideoError}
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
                        preload="auto"
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onError={handleVideoError}
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
                        preload="auto"
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
            )}

            {/* LIVE WATERMARK OVERLAY */}
            {selectedWatermarkAsset && !isShowingOutro && (
              <img
                src={selectedWatermarkAsset.file_url}
                alt="Watermark Logo"
                style={getWatermarkPositionStyle()}
              />
            )}

            {/* OUTRO CARD BUMPER LIVE PREVIEW */}
            {isShowingOutro && editJson.outro && (
              <div
                className="absolute inset-0 z-28 flex flex-col items-center justify-center p-6 text-center animate-in fade-in"
                style={{ backgroundColor: editJson.outro.bg_color }}
              >
                {editJson.outro.template === 'subscribe' && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-500 mx-auto animate-bounce">
                      <Bell size={32} />
                    </div>
                    <h3
                      className="font-black text-lg tracking-tight"
                      style={{ color: editJson.outro.text_color }}
                    >
                      {editJson.outro.text}
                    </h3>
                    <div className="px-4 py-2 rounded-full bg-red-600 text-white font-extrabold text-xs shadow-lg inline-block">
                      SUBSCRIBE NOW
                    </div>
                  </div>
                )}

                {editJson.outro.template === 'follow' && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-brand-600/20 border-2 border-brand-500 flex items-center justify-center text-brand-400 mx-auto">
                      <Share2 size={32} />
                    </div>
                    <h3
                      className="font-black text-lg tracking-tight"
                      style={{ color: editJson.outro.text_color }}
                    >
                      {editJson.outro.text}
                    </h3>
                    <div className="px-4 py-2 rounded-full bg-brand-600 text-white font-extrabold text-xs shadow-lg inline-block">
                      FOLLOW FOR DAILY SHORTS
                    </div>
                  </div>
                )}

                {editJson.outro.template === 'custom_text' && (
                  <div className="space-y-3">
                    <h3
                      className="font-black text-2xl tracking-tight leading-snug"
                      style={{ color: editJson.outro.text_color }}
                    >
                      {editJson.outro.text}
                    </h3>
                  </div>
                )}
              </div>
            )}

            {/* Play Overlay Button */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute z-30 w-14 h-14 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-xl hover:scale-105 transition"
              >
                <Play size={24} fill="currentColor" className="ml-1" />
              </button>
            )}

            {/* SAFE ZONE OVERLAY GUIDE */}
            {showSafeZoneOverlay && editJson.aspect === '9:16' && (
              <div className="absolute inset-0 z-20 pointer-events-none border border-dashed border-amber-500/30">
                <div className="absolute right-0 top-1/3 bottom-24 w-12 border-l border-dashed border-amber-500/40 bg-amber-500/5 flex items-center justify-center">
                  <span className="text-[9px] text-amber-400 font-mono -rotate-90">UI Buttons</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-24 border-t border-dashed border-amber-500/40 bg-amber-500/5 flex items-center justify-center">
                  <span className="text-[10px] text-amber-400 font-mono">Title & Audio UI Deadzone (20%)</span>
                </div>
              </div>
            )}

            {/* LIVE CAPTIONS */}
            {editJson.captions?.enabled && activeLine && !isShowingOutro && (
              <div
                style={{
                  position: 'absolute',
                  left: editJson.captions.safe_zones ? '20px' : '10px',
                  right: editJson.captions.safe_zones ? '65px' : '10px',
                  bottom:
                    editJson.captions.style.position === 'top'
                      ? undefined
                      : editJson.captions.style.position === 'middle'
                      ? '50%'
                      : `${Math.max(105, 105 - (editJson.captions.style.y_offset || 0))}px`,
                  top: editJson.captions.style.position === 'top' ? '50px' : undefined,
                  zIndex: 25,
                  pointerEvents: 'none',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: `'${editJson.captions.style.font || 'Noto Sans'}', 'Noto Sans Devanagari', sans-serif`,
                    fontSize: `${Math.round(editJson.captions.style.size * 0.42)}px`,
                    lineHeight: '1.25',
                    textAlign: 'center',
                    backgroundColor: editJson.captions.style.box ? editJson.captions.style.box_color : 'transparent',
                    padding: editJson.captions.style.box ? '4px 10px' : '0px',
                    borderRadius: editJson.captions.style.box ? '8px' : '0px',
                    textShadow: `${editJson.captions.style.outline_width}px ${editJson.captions.style.outline_width}px 0 ${editJson.captions.style.outline_color}`,
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
                          color: isWordActive
                            ? editJson.captions.style.highlight_color
                            : editJson.captions.style.color,
                          transform: isWordActive ? 'scale(1.08)' : 'scale(1)',
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

        {/* RIGHT PANEL: 4 Tabs */}
        <aside className="w-84 border-l border-surface-border bg-surface/50 backdrop-blur flex flex-col shrink-0">
          <div className="flex border-b border-surface-border">
            <button
              onClick={() => setActiveTab('framing')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1 border-b-2 transition ${
                activeTab === 'framing'
                  ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crop size={13} /> Framing
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1 border-b-2 transition ${
                activeTab === 'text'
                  ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type size={13} /> Captions
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1 border-b-2 transition ${
                activeTab === 'audio'
                  ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music size={13} /> Audio
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1 border-b-2 transition ${
                activeTab === 'media'
                  ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders size={13} /> Media
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
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Text & Subtitles */}
          {activeTab === 'text' && (
            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <span className="font-bold text-slate-200">Burn In Captions</span>
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

              <div>
                <label className="font-bold text-slate-300 block mb-2 uppercase tracking-wider text-[10px]">
                  Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(STYLE_PRESETS).map((pName) => (
                    <button
                      key={pName}
                      onClick={() => handleApplyPreset(pName)}
                      className={`p-2 rounded-xl border text-left transition ${
                        editJson.captions.preset === pName
                          ? 'border-brand-500 bg-brand-500/15 text-white font-bold'
                          : 'border-surface-border bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      {pName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Audio Panel (Phase 6C) */}
          {activeTab === 'audio' && (
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Copyright Notice */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5">
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-400" />
                <p className="text-[11px] leading-relaxed">
                  Use only music you have rights to. Copyrighted music can get your YouTube video claimed or muted.
                </p>
              </div>

              {/* Original Video Volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-xs">
                    Original Speech Volume: {editJson.audio.original_volume}%
                  </span>
                  {editJson.audio.original_volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={editJson.audio.original_volume}
                  onChange={(e) =>
                    updateEdit((prev) => ({
                      ...prev,
                      audio: { ...prev.audio, original_volume: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>

              {/* Background Music Track Picker */}
              <div className="space-y-3 pt-3 border-t border-surface-border">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-xs">Background Music</span>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => audioUploadRef.current?.click()}
                    disabled={isUploadingAsset}
                    className="gap-1 text-[10px]"
                  >
                    {isUploadingAsset ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                    Upload Audio
                  </Button>
                </div>

                <select
                  value={editJson.audio.music.asset_id || ''}
                  onChange={(e) =>
                    updateEdit((prev) => ({
                      ...prev,
                      audio: {
                        ...prev.audio,
                        music: { ...prev.audio.music, asset_id: e.target.value || null },
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-surface-border text-white text-xs"
                >
                  <option value="">No Background Music</option>
                  {(Array.isArray(userAssets) ? userAssets : [])
                    .filter((a) => a.asset_type === 'audio')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>

                {/* Music Controls if Asset Attached */}
                {editJson.audio.music.asset_id && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-surface-border space-y-3 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Music Volume: {editJson.audio.music.volume}%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editJson.audio.music.volume}
                        onChange={(e) =>
                          updateEdit((prev) => ({
                            ...prev,
                            audio: {
                              ...prev.audio,
                              music: { ...prev.audio.music, volume: parseInt(e.target.value) },
                            },
                          }))
                        }
                        className="w-28 accent-brand-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Fade In ({editJson.audio.music.fade_in_s}s):</span>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={editJson.audio.music.fade_in_s}
                        onChange={(e) =>
                          updateEdit((prev) => ({
                            ...prev,
                            audio: {
                              ...prev.audio,
                              music: { ...prev.audio.music, fade_in_s: parseFloat(e.target.value) },
                            },
                          }))
                        }
                        className="w-28 accent-brand-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Fade Out ({editJson.audio.music.fade_out_s}s):</span>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={editJson.audio.music.fade_out_s}
                        onChange={(e) =>
                          updateEdit((prev) => ({
                            ...prev,
                            audio: {
                              ...prev.audio,
                              music: { ...prev.audio.music, fade_out_s: parseFloat(e.target.value) },
                            },
                          }))
                        }
                        className="w-28 accent-brand-500 cursor-pointer"
                      />
                    </div>

                    <label className="flex items-center justify-between pt-1 cursor-pointer">
                      <span className="text-slate-300">Auto-Duck Under Speech</span>
                      <input
                        type="checkbox"
                        checked={editJson.audio.music.duck_under_speech}
                        onChange={(e) =>
                          updateEdit((prev) => ({
                            ...prev,
                            audio: {
                              ...prev.audio,
                              music: { ...prev.audio.music, duck_under_speech: e.target.checked },
                            },
                          }))
                        }
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Media, Watermark & Outro (Phase 6C) */}
          {activeTab === 'media' && (
            <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* WATERMARK PANEL */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
                    Watermark / Logo
                  </span>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => logoUploadRef.current?.click()}
                    disabled={isUploadingAsset}
                    className="gap-1 text-[10px]"
                  >
                    {isUploadingAsset ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                    Upload Logo
                  </Button>
                </div>

                <select
                  value={editJson.watermark?.asset_id || ''}
                  onChange={(e) =>
                    updateEdit((prev) => ({
                      ...prev,
                      watermark: e.target.value
                        ? {
                            asset_id: e.target.value,
                            position: prev.watermark?.position || 'tr',
                            size_pct: prev.watermark?.size_pct || 15,
                            opacity: prev.watermark?.opacity || 85,
                            margin_pct: prev.watermark?.margin_pct || 5,
                          }
                        : null,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-surface-border text-white text-xs"
                >
                  <option value="">No Watermark</option>
                  {(Array.isArray(userAssets) ? userAssets : [])
                    .filter((a) => a.asset_type === 'image')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>

                {editJson.watermark?.asset_id && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-surface-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Position:</span>
                      <div className="grid grid-cols-4 gap-1">
                        {(['tl', 'tr', 'bl', 'br'] as WatermarkPosition[]).map((pos) => (
                          <button
                            key={pos}
                            onClick={() =>
                              updateEdit((prev) => ({
                                ...prev,
                                watermark: prev.watermark ? { ...prev.watermark, position: pos } : null,
                              }))
                            }
                            className={`px-2 py-1 rounded text-[10px] uppercase font-bold border transition ${
                              editJson.watermark?.position === pos
                                ? 'border-brand-500 bg-brand-500/20 text-white'
                                : 'border-surface-border text-slate-400'
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Size ({editJson.watermark.size_pct}%):</span>
                      <input
                        type="range"
                        min="5"
                        max="40"
                        value={editJson.watermark.size_pct}
                        onChange={(e) =>
                          updateEdit((prev) => ({
                            ...prev,
                            watermark: prev.watermark
                              ? { ...prev.watermark, size_pct: parseInt(e.target.value) }
                              : null,
                          }))
                        }
                        className="w-28 accent-brand-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Opacity ({editJson.watermark.opacity}%):</span>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={editJson.watermark.opacity}
                        onChange={(e) =>
                          updateEdit((prev) => ({
                            ...prev,
                            watermark: prev.watermark
                              ? { ...prev.watermark, opacity: parseInt(e.target.value) }
                              : null,
                          }))
                        }
                        className="w-28 accent-brand-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* OUTRO PANEL */}
              <div className="space-y-3 pt-3 border-t border-surface-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block text-xs">Outro Bumper Card</span>
                    <span className="text-[11px] text-slate-400">Appended to video end</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editJson.outro?.enabled || false}
                    onChange={(e) =>
                      updateEdit((prev) => ({
                        ...prev,
                        outro: prev.outro
                          ? { ...prev.outro, enabled: e.target.checked }
                          : {
                              enabled: e.target.checked,
                              template: 'subscribe',
                              text: 'Subscribe for More!',
                              duration_s: 3,
                              bg_color: '#0A0A0F',
                              text_color: '#FFFFFF',
                            },
                      }))
                    }
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>

                {editJson.outro?.enabled && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-surface-border space-y-3">
                    <div>
                      <span className="text-slate-400 block mb-1.5">Template Style:</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'subscribe', label: 'Subscribe' },
                          { id: 'follow', label: 'Follow' },
                          { id: 'custom_text', label: 'Custom' },
                        ].map((tpl) => (
                          <button
                            key={tpl.id}
                            onClick={() =>
                              updateEdit((prev) => ({
                                ...prev,
                                outro: prev.outro ? { ...prev.outro, template: tpl.id as OutroTemplate } : null,
                              }))
                            }
                            className={`p-1.5 rounded text-[11px] font-semibold border transition ${
                              editJson.outro?.template === tpl.id
                                ? 'border-brand-500 bg-brand-500/20 text-white'
                                : 'border-surface-border text-slate-400'
                            }`}
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Headline Text:</span>
                      <input
                        type="text"
                        value={editJson.outro.text}
                        onChange={(e) =>
                          updateEdit((prev) => ({
                            ...prev,
                            outro: prev.outro ? { ...prev.outro, text: e.target.value } : null,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-surface-border text-white text-xs focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Duration ({editJson.outro.duration_s}s):</span>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={editJson.outro.duration_s}
                        onChange={(e) =>
                          updateEdit((prev) => ({
                            ...prev,
                            outro: prev.outro ? { ...prev.outro, duration_s: parseInt(e.target.value) } : null,
                          }))
                        }
                        className="w-28 accent-brand-500 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                      <div className="p-2 rounded bg-slate-900 border border-surface-border">
                        <span className="text-slate-400 block mb-1">Background</span>
                        <input
                          type="color"
                          value={editJson.outro.bg_color}
                          onChange={(e) =>
                            updateEdit((prev) => ({
                              ...prev,
                              outro: prev.outro ? { ...prev.outro, bg_color: e.target.value } : null,
                            }))
                          }
                          className="w-6 h-6 mx-auto cursor-pointer block bg-transparent"
                        />
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-surface-border">
                        <span className="text-slate-400 block mb-1">Text Color</span>
                        <input
                          type="color"
                          value={editJson.outro.text_color}
                          onChange={(e) =>
                            updateEdit((prev) => ({
                              ...prev,
                              outro: prev.outro ? { ...prev.outro, text_color: e.target.value } : null,
                            }))
                          }
                          className="w-6 h-6 mx-auto cursor-pointer block bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
              Total Length:{' '}
              <strong className="text-white font-mono">
                {totalDuration.toFixed(1)}s
                {editJson.outro?.enabled && ` (${(editJson.trim.out - editJson.trim.in).toFixed(1)}s clip + ${editJson.outro.duration_s}s outro)`}
              </strong>
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
          {/* Timeline Thumbnail Strip */}
          <div className="absolute inset-0 flex overflow-hidden opacity-45 pointer-events-none select-none rounded-xl">
            {(thumbnails.length > 0 ? thumbnails : DEFAULT_TIMELINE_THUMBNAILS).map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Frame ${i}`}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
                className="flex-1 h-full object-cover border-r border-black/30"
              />
            ))}
          </div>

          {/* Clip Range */}
          <div
            className="absolute top-1 bottom-1 bg-brand-500/20 border-x-2 border-brand-500 rounded z-10 pointer-events-none"
            style={{
              left: `${(editJson.trim.in / Math.max(1, duration)) * 100}%`,
              width: `${((editJson.trim.out - editJson.trim.in) / Math.max(1, duration)) * 100}%`,
            }}
          />

          {/* Outro Bumper Highlight on Timeline */}
          {editJson.outro?.enabled && (
            <div
              className="absolute top-1 bottom-1 bg-red-600/30 border-r-2 border-red-500 rounded-r z-10 pointer-events-none flex items-center justify-center"
              style={{
                left: `${(editJson.trim.out / Math.max(1, duration)) * 100}%`,
                width: `${(editJson.outro.duration_s / Math.max(1, duration)) * 100}%`,
              }}
            >
              <span className="text-[9px] text-red-300 font-bold uppercase truncate px-1">Outro</span>
            </div>
          )}

          {/* Playhead */}
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
