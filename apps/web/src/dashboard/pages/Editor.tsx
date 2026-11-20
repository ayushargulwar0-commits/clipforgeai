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
  ChevronDown,
  Film,
  Video,
  FileVideo,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import api, { API_BASE_URL } from '@/lib/api'
import { YouTubePublishModal } from '@/components/youtube/YouTubePublishModal'
import { Youtube } from '@/components/ui/Icons'

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

const extractYtId = (url: string) => {
  if (!url) return null
  const match = url.match(/(?:v=|\/|youtu\.be\/|embed\/)([0-9A-Za-z_-]{11})/)
  return match ? match[1] : null
}

export interface PresetClip {
  id: string
  title: string
  description?: string
  hook?: string
  transcript_text?: string
  start_time: number
  end_time: number
  duration: number
  aspect_ratio: AspectRatio
  video_url: string
  thumbnail_url?: string
  youtube_id?: string
}

export const ALL_PRESET_CLIPS: PresetClip[] = []

const DEFAULT_TIMELINE_THUMBNAILS: string[] = []

export default function Editor() {
  const { clipId: routeClipId } = useParams<{ clipId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error: toastError, info } = useToast()

  const clipId = routeClipId || searchParams.get('clip') || ''
  const isDebug = searchParams.get('debug') === '1'
  const [debugInfo, setDebugInfo] = useState<{
    filePath?: string
    fileSize?: number
    fileMd5Prefix?: string
  }>({})

  // Clip Switcher & Source Video State
  const [availableClips, setAvailableClips] = useState<any[]>([])
  const [showClipDropdown, setShowClipDropdown] = useState(false)
  const clipDropdownRef = useRef<HTMLDivElement>(null)
  const customVideoInputRef = useRef<HTMLInputElement>(null)
  const [customUrlInput, setCustomUrlInput] = useState('')

  // Load user clips from backend API strictly
  useEffect(() => {
    let unmounted = false
    api.get('/clips').then((res) => {
      if (!unmounted && Array.isArray(res.data)) {
        setAvailableClips(res.data)
      }
    }).catch(() => {})
    return () => { unmounted = true }
  }, [])

  // Outside click listener for clip dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (clipDropdownRef.current && !clipDropdownRef.current.contains(event.target as Node)) {
        setShowClipDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [youtubeId, setYoutubeId] = useState<string | null>(null)

  // Real Streaming & Ingestion Status
  const [clipStatus, setClipStatus] = useState<'loading' | 'queued' | 'downloading' | 'rendering' | 'ready' | 'failed'>('loading')
  const [clipStatusProgress, setClipStatusProgress] = useState<number>(0)
  const [clipStatusError, setClipStatusError] = useState<string | null>(null)
  const [streamWarning, setStreamWarning] = useState<string | null>(null)
  const [hasStreamErrorRetried, setHasStreamErrorRetried] = useState<boolean>(false)
  const [isRetrying, setIsRetrying] = useState<boolean>(false)
  const [isUploadingSource, setIsUploadingSource] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false)
  const sourceUploadInputRef = useRef<HTMLInputElement>(null)

  const fetchStreamTokenAndPlay = useCallback(
    async (cId: string, forceFresh = false, signal?: AbortSignal) => {
      try {
        const res = await api.post(`/clips/${cId}/stream-token`, {}, { signal })
        const token = res.data.token
        const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
        const streamUrl = `${baseUrl}/api/clips/${cId}/stream?token=${encodeURIComponent(token)}&clip=${encodeURIComponent(cId)}&v=${Date.now()}`
        setVideoUrl(streamUrl)
        setVideoError(null)
        setStreamWarning(null)
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.load()
          }
        }, 20)
        return streamUrl
      } catch (err: any) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          return null
        }
        console.warn('[Editor] Failed to fetch stream token:', err)
        setStreamWarning('Stream playback interrupted. Refreshing stream token...')
        return null
      }
    },
    []
  )

  const handleRetryRender = useCallback(async () => {
    setIsRetrying(true)
    info('Retrying Processing', 'Re-queueing clip rendering...')
    try {
      await api.post(`/clips/${clipId}/retry`)
      setClipStatus('rendering')
      setClipStatusError(null)
      setStreamWarning(null)
      success('Re-queued', 'Processing has been restarted.')
    } catch (err: any) {
      toastError('Retry Failed', err.response?.data?.detail || 'Could not restart processing.')
    } finally {
      setIsRetrying(false)
    }
  }, [clipId, info, success, toastError])

  const handleSourceFileUpload = useCallback(
    async (file: File) => {
      if (!file) return

      // Max size 500 MB
      if (file.size > 500 * 1024 * 1024) {
        toastError('File Too Large', 'Maximum allowed upload size is 500 MB.')
        return
      }

      // Check file type
      const validExts = ['.mp4', '.mov', '.webm', '.mkv']
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!validExts.includes(fileExt) && !file.type.startsWith('video/')) {
        toastError('Unsupported File', 'Please upload an MP4, MOV, or WebM video file.')
        return
      }

      setIsUploadingSource(true)
      setUploadProgress(10)
      info('Uploading Source Video', `Uploading "${file.name}" (re-encoding to standard H.264/AAC)...`)

      try {
        const formData = new FormData()
        formData.append('file', file)

        await api.post(`/clips/${clipId}/source`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded * 90) / progressEvent.total)
              setUploadProgress(pct)
            }
          },
        })

        setUploadProgress(100)
        success('Source Replaced!', 'Video re-encoded and applied successfully.')
        setClipStatus('ready')
        setClipStatusError(null)
        setStreamWarning(null)

        // Refresh stream token and play
        await fetchStreamTokenAndPlay(clipId, true)
      } catch (err: any) {
        console.error('[Editor] Upload source error:', err)
        const detail = err.response?.data?.detail || err.message || 'Failed to upload source video.'
        toastError('Upload Failed', detail)
      } finally {
        setIsUploadingSource(false)
        setUploadProgress(0)
      }
    },
    [clipId, fetchStreamTokenAndPlay, info, success, toastError]
  )

  const handleCustomVideoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      handleSourceFileUpload(file)
    },
    [handleSourceFileUpload]
  )

  const handleCustomUrlApply = useCallback(async () => {
    if (!customUrlInput.trim()) return
    const newUrl = customUrlInput.trim()
    setVideoUrl(newUrl)
    setVideoError(null)
    setCustomUrlInput('')
    success('Video URL Loaded', 'Video source applied.')
  }, [customUrlInput, success])

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
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'completed' | 'failed'>('idle')
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [isYouTubePublishOpen, setIsYouTubePublishOpen] = useState(false)
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

  const handleVideoError = useCallback(
    async (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const vid = e.currentTarget
      console.warn('[Editor] Video stream warning:', vid.error?.message, vid.src)
      if (!hasStreamErrorRetried) {
        setHasStreamErrorRetried(true)
        console.log('[Editor] Retrying stream with fresh token...')
        await fetchStreamTokenAndPlay(clipId, true)
      } else {
        setStreamWarning('Stream playback interrupted. Video stream temporarily unavailable.')
      }
      setVideoError(null)
    },
    [clipId, fetchStreamTokenAndPlay, hasStreamErrorRetried]
  )

  // -------------------------------------------------------------------------
  // 1. Data Loading: GET /clips/{id}/edit & Dynamic Clip Data with AbortController
  // -------------------------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal
    let pollTimer: any = null

    // Reset all clip-specific state immediately when clipId changes
    setVideoUrl('')
    setCurrentTime(0)
    setIsPlaying(false)
    setVideoError(null)
    setStreamWarning(null)
    setClipStatus('loading')
    setClipStatusProgress(0)
    setClipStatusError(null)
    setExportStatus('idle')
    setExportProgress(0)
    setExportDownloadUrl(null)
    setExportError(null)

    async function loadClipData() {
      try {
        if (!clipId) {
          setClipStatus('failed')
          setClipStatusError('No clip ID specified. Please choose a clip from My Clips.')
          return
        }

        // Direct Stream & Status Resolution strictly from backend
        let stData: any = null
        try {
          const statusRes = await api.get(`/clips/${clipId}/status`, { signal })
          stData = statusRes.data
        } catch (stErr: any) {
          if (signal.aborted) return
          const detail = stErr.response?.data?.detail || stErr.message || 'Clip not found'
          setClipStatus('failed')
          setClipStatusError(
            clipId.startsWith('yt-clip-') || detail.toLowerCase().includes('not found')
              ? `Clip "${clipId}" not found in database. Needs re-import.`
              : detail
          )
          return
        }

        if (!stData) {
          setClipStatus('failed')
          setClipStatusError(`Clip "${clipId}" not found in database. Needs re-import.`)
          return
        }

        // Set debug strip info
        setDebugInfo({
          filePath: stData.file_path || '',
          fileSize: stData.file_size || 0,
          fileMd5Prefix: stData.file_md5_prefix || (stData.file_md5 ? stData.file_md5.slice(0, 8) : ''),
        })

        const title = stData.title || (clipId.startsWith('yt-clip-') ? 'YouTube Viral Short' : `Clip ${clipId}`)
        setClipTitle(title)

        const yId = stData.youtube_id || extractYtId(stData.video_url || '') || null
        setYoutubeId(yId)

        if (stData.thumbnail_url) {
          setThumbnails([stData.thumbnail_url])
        } else if (yId) {
          setThumbnails([`https://img.youtube.com/vi/${yId}/hqdefault.jpg`])
        }

        const curStatus = stData.status || 'queued'
        setClipStatus(curStatus)
        setClipStatusProgress(stData.progress || 0)
        if (stData.error_message) {
          setClipStatusError(stData.error_message)
        }

        if (curStatus === 'ready') {
          await fetchStreamTokenAndPlay(clipId, true, signal)
        } else if (curStatus === 'failed') {
          setClipStatusError(stData.error_message || 'Video processing failed. Needs re-import.')
        } else {
          // Poll status every 3 seconds until ready or failed
          pollTimer = setInterval(async () => {
            if (signal.aborted) return
            try {
              const pRes = await api.get(`/clips/${clipId}/status`, { signal })
              const pData = pRes.data
              const pStatus = pData.status || 'queued'
              setClipStatus(pStatus)
              setClipStatusProgress(pData.progress || 0)
              if (pData.file_path || pData.file_size || pData.file_md5_prefix) {
                setDebugInfo({
                  filePath: pData.file_path || '',
                  fileSize: pData.file_size || 0,
                  fileMd5Prefix: pData.file_md5_prefix || (pData.file_md5 ? pData.file_md5.slice(0, 8) : ''),
                })
              }
              if (pStatus === 'ready') {
                clearInterval(pollTimer)
                await fetchStreamTokenAndPlay(clipId, true, signal)
              } else if (pStatus === 'failed') {
                clearInterval(pollTimer)
                setClipStatusError(pData.error_message || 'Video processing failed. Needs re-import.')
              }
            } catch (pErr) {
              console.warn('[Editor] Status poll warning:', pErr)
            }
          }, 3000)
        }

        if (signal.aborted) return

        // Fetch clip edit state from API
        try {
          const editRes = await api.get(`/clips/${clipId}/edit`, { signal })
          if (editRes.data?.edit_json && Object.keys(editRes.data.edit_json).length > 0) {
            const ed = editRes.data.edit_json
            setEditJson(ed)
            setHistory([ed])
            setHistoryIdx(0)
            setHasUnsaved(false)
            if (ed.trim?.in !== undefined && videoRef.current) {
              videoRef.current.currentTime = ed.trim.in
              setCurrentTime(ed.trim.in)
            }
            if (ed.trim?.out !== undefined) {
              setDuration(Math.max(1, ed.trim.out - (ed.trim.in || 0)))
            }
            return
          }
        } catch (_) {}

        if (signal.aborted) return

        // Construct dynamic clip-specific Edit JSON
        const targetIn = typeof stData?.start_time === 'number' ? stData.start_time : 0
        const targetOut =
          typeof stData?.end_time === 'number' && stData.end_time > targetIn
            ? stData.end_time
            : targetIn + (stData?.duration || 30)
        const clipAspect = (stData?.aspect_ratio as AspectRatio) || '9:16'
        const clipDuration =
          typeof stData?.duration === 'number' && stData.duration > 0
            ? stData.duration
            : Math.max(1, targetOut - targetIn)

        const transcriptText =
          stData?.transcript_text ||
          stData?.hook ||
          `Highlight for clip ${clipId}`
        const wordsList = transcriptText.split(/\s+/).filter(Boolean)
        const totalDuration = Math.max(1, targetOut - targetIn)
        const wordStep = totalDuration / Math.max(1, wordsList.length)
        const dynamicWords = wordsList.map((w: string, idx: number) => ({
          text: w,
          start: Number((targetIn + idx * wordStep).toFixed(2)),
          end: Number((targetIn + (idx + 1) * wordStep).toFixed(2)),
        }))

        const dynamicEdit: EditJson = {
          ...DEFAULT_EDIT_JSON,
          trim: { in: targetIn, out: targetOut },
          aspect: clipAspect,
          captions: {
            ...DEFAULT_EDIT_JSON.captions,
            words: dynamicWords,
          },
        }

        setDuration(clipDuration)
        setEditJson(dynamicEdit)
        setHistory([dynamicEdit])
        setHistoryIdx(0)
        setHasUnsaved(false)
        if (videoRef.current) {
          videoRef.current.currentTime = targetIn
          setCurrentTime(targetIn)
        }
      } catch (err: any) {
        if (!signal.aborted) {
          console.warn('[Editor] Failed to load clip data:', err.message)
        }
      }
    }

    loadClipData()
    return () => {
      controller.abort()
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [clipId, fetchStreamTokenAndPlay])

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
  // 2b. Export Video: POST /api/clips/{id}/export & Background Job Polling
  // -------------------------------------------------------------------------
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setExportStatus('exporting')
    setExportProgress(10)
    setExportError(null)

    try {
      // 1. Save edit settings to database first
      await saveChanges(false)
      setExportProgress(20)

      // 2. Start background export job
      const res = await api.post(`/clips/${clipId}/export`)
      const jobId = res?.data?.job_id
      if (!jobId) {
        throw new Error('No job ID returned from export endpoint.')
      }

      setExportProgress(30)

      // 3. Poll /api/exports/{job_id} until completed or failed
      let isDone = false
      let pollCount = 0

      while (!isDone && pollCount < 120) {
        await new Promise((r) => setTimeout(r, 1500))
        pollCount++

        try {
          const statusRes = await api.get(`/exports/${jobId}`)
          const data = statusRes.data
          if (data.progress !== undefined) {
            setExportProgress(data.progress)
          }

          if (data.status === 'completed') {
            isDone = true
            setExportProgress(100)
            setExportStatus('completed')
            const directUrl = data.download_url?.startsWith('http')
              ? data.download_url
              : `${API_BASE_URL}${data.download_url}`
            setExportDownloadUrl(directUrl)
            success('Export Ready!', 'Your 9:16 Short is rendered with burned captions.')
            break
          } else if (data.status === 'failed') {
            throw new Error(data.error || 'Export rendering failed.')
          }
        } catch (pollErr: any) {
          if (pollErr.message && pollErr.message.includes('Export rendering failed')) {
            throw pollErr
          }
          console.warn('[Editor] Poll status warning:', pollErr)
        }
      }

      if (!isDone) {
        throw new Error('Export timed out. Please try again.')
      }
    } catch (err: any) {
      console.error('[Editor] Export failed:', err)
      const msg = err.response?.data?.detail || err.message || 'Export failed.'
      setExportStatus('failed')
      setExportError(msg)
      toastError('Export Failed', msg)
    } finally {
      setIsExporting(false)
    }
  }, [clipId, saveChanges, success, toastError])

  const handleDownload = useCallback(() => {
    if (!exportDownloadUrl) return
    const safeTitle = (clipTitle || 'clipforge-render').replace(/[^a-zA-Z0-9_-]/g, '_')
    const filename = `${safeTitle}_9x16.mp4`

    const a = document.createElement('a')
    a.href = exportDownloadUrl
    a.download = filename
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [exportDownloadUrl, clipTitle])

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
          {/* Interactive Clip Switcher Dropdown */}
          <div className="relative" ref={clipDropdownRef}>
            <button
              onClick={() => setShowClipDropdown((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-surface-border hover:border-brand-500/50 hover:bg-slate-800 transition text-left"
            >
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="truncate max-w-[180px] sm:max-w-[260px]">{clipTitle}</span>
                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                  <span className="truncate max-w-[110px]">ID: {clipId}</span>
                  <span>·</span>
                  <span className="text-brand-400 font-bold">{editJson.aspect}</span>
                </div>
              </div>
            </button>

            {showClipDropdown && (
              <div className="absolute left-0 top-full mt-2 w-80 rounded-xl bg-slate-900 border border-surface-border shadow-2xl p-2 z-50 space-y-1 max-h-96 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Reel ({availableClips.length})</span>
                  <button
                    onClick={() => {
                      setShowClipDropdown(false)
                      navigate('/dashboard/clips')
                    }}
                    className="text-brand-400 hover:text-brand-300 font-semibold lowercase"
                  >
                    all clips
                  </button>
                </div>

                {availableClips.map((c) => {
                  const isCurrent = c.id === clipId
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setShowClipDropdown(false)
                        navigate(`/dashboard/editor/${c.id}`)
                      }}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition ${
                        isCurrent
                          ? 'bg-brand-500/20 border border-brand-500/40 text-white'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded bg-slate-800 border border-surface-border shrink-0 overflow-hidden flex items-center justify-center">
                        {c.thumbnail_url ? (
                          <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Film size={16} className="text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate text-white">{c.title || 'Untitled Clip'}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>{c.duration ? `${c.duration}s` : '30s'}</span>
                          <span>·</span>
                          <span className="font-mono truncate max-w-[110px]">{c.id}</span>
                        </div>
                      </div>
                      {isCurrent && <Check size={14} className="text-brand-400 shrink-0" />}
                    </button>
                  )
                })}

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowClipDropdown(false)
                      navigate('/dashboard/clips')
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 text-xs font-semibold transition"
                  >
                    <Plus size={13} /> Detect & Generate New Reel
                  </button>
                </div>
              </div>
            )}
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

          {exportStatus === 'completed' && exportDownloadUrl ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleDownload}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
              >
                <Download size={14} /> Download MP4
              </Button>
              <Button
                size="sm"
                onClick={() => setIsYouTubePublishOpen(true)}
                className="gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm"
              >
                <Youtube size={14} /> Upload to YouTube
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="gap-1 text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
              >
                <Sparkles size={13} /> Re-Export
              </Button>
            </div>
          ) : exportStatus === 'exporting' || isExporting ? (
            <Button
              size="sm"
              disabled
              className="gap-1.5 bg-brand-600/80 text-white font-bold text-xs cursor-wait"
            >
              <Loader2 size={14} className="animate-spin" />
              Exporting {exportProgress}%
            </Button>
          ) : exportStatus === 'failed' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400 font-medium max-w-[200px] truncate" title={exportError || ''}>
                {exportError || 'Failed'}
              </span>
              <Button
                size="sm"
                onClick={handleExport}
                className="gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                <RefreshCw size={14} /> Retry Export
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm"
            >
              <Download size={14} />
              Export
            </Button>
          )}
        </div>
      </header>

      {/* Debug Strip (?debug=1) */}
      {isDebug && (
        <div
          id="editor-debug-strip"
          className="bg-amber-950/95 border-b border-amber-600/60 text-amber-200 text-xs px-4 py-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono items-center z-30 shrink-0"
        >
          <span className="font-bold text-amber-300 bg-amber-900/80 px-1.5 py-0.5 rounded border border-amber-600/50">
            DEBUG
          </span>
          <span>
            <strong>clipId:</strong> <span className="text-white">{clipId || 'none'}</span>
          </span>
          <span>
            <strong>DB file_path:</strong> <span className="text-white truncate max-w-xs">{debugInfo.filePath || 'None'}</span>
          </span>
          <span>
            <strong>file size:</strong> <span className="text-white">{debugInfo.fileSize ? `${debugInfo.fileSize} B` : '0 B'}</span>
          </span>
          <span>
            <strong>md5:</strong> <span className="text-white">{debugInfo.fileMd5Prefix || 'None'}</span>
          </span>
          <span>
            <strong>video.currentSrc:</strong> <span className="text-white truncate max-w-xs inline-block align-bottom">{videoRef.current?.currentSrc || videoUrl || 'None'}</span>
          </span>
          <span>
            <strong>video.duration:</strong> <span className="text-white">{videoRef.current?.duration ? `${videoRef.current.duration.toFixed(2)}s` : `${duration.toFixed(2)}s`}</span>
          </span>
        </div>
      )}

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
            {/* Stream Warning Notice (Non-blocking, controls stay interactive) */}
            {streamWarning && (
              <div className="absolute top-2 inset-x-2 z-40 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[10px] px-2.5 py-1.5 rounded-lg flex items-center justify-between backdrop-blur-md">
                <span className="truncate">{streamWarning}</span>
                <button
                  onClick={() => setStreamWarning(null)}
                  className="text-amber-300 hover:text-white ml-1.5 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Preparation / Ingestion / Failed Overlay */}
            {clipStatus !== 'ready' && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-5 text-center bg-slate-950/95 backdrop-blur-sm">
                {clipStatus === 'failed' ? (
                  <div className="flex flex-col items-center max-w-[240px]">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
                      <AlertTriangle size={22} />
                    </div>
                    <h3 className="text-xs font-bold text-white mb-1">Clip Preparation Error</h3>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      {clipStatusError || 'The video clip file could not be generated or found.'}
                    </p>
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        size="xs"
                        variant="brand"
                        onClick={handleRetryRender}
                        disabled={isRetrying}
                        className="w-full gap-1.5 text-xs py-2"
                      >
                        {isRetrying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Retry
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => sourceUploadInputRef.current?.click()}
                        className="w-full gap-1.5 text-xs py-2 border-slate-700 hover:bg-slate-800"
                      >
                        <Upload size={12} />
                        Upload MP4 instead
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => navigate('/dashboard/clips')}
                        className="w-full text-xs py-1.5 text-slate-400 hover:text-white"
                      >
                        Back to My Clips
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center max-w-[240px]">
                    <div className="relative mb-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                        <Film size={22} />
                      </div>
                      <Loader2 size={20} className="animate-spin text-brand-400 absolute -top-1 -right-1" />
                    </div>
                    <h3 className="text-xs font-bold text-white mb-1">Preparing your clip...</h3>
                    <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                      {clipStatus === 'downloading'
                        ? 'Downloading source from YouTube...'
                        : clipStatus === 'rendering'
                        ? 'Cutting clip and transcoding to H.264...'
                        : 'Queued for processing. Ready shortly...'}
                    </p>
                    <div className="w-40 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-brand-500 h-full transition-all duration-300"
                        style={{ width: `${Math.max(20, clipStatusProgress)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 mt-2 capitalize font-mono">
                      Status: {clipStatus}
                    </span>
                  </div>
                )}
              </div>
            )}
            {/* Background Layer: Blur / Solid / Image */}
            {editJson.framing.mode === 'blur_fit' && !isShowingOutro && (
              <div className="absolute inset-0 z-0 overflow-hidden">
                {editJson.background.type === 'blur' && (
                  <video
                    key={`bg-${clipId}`}
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
                {editJson.framing.mode === 'crop' && (
                  <div className="relative w-full h-full overflow-hidden">
                    <video
                      key={`fg-crop-${clipId}`}
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
                    key={`fg-blur-${clipId}`}
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
                        key={`fg-split-top-${clipId}`}
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
                        key={`fg-split-bot-${clipId}`}
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
                    {youtubeId ? (
                      <img
                        src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                        alt="Crop Source"
                        className="w-full h-full object-cover opacity-80 pointer-events-none"
                      />
                    ) : (
                      <video
                        src={videoUrl}
                        className="w-full h-full object-cover opacity-60 pointer-events-none"
                      />
                    )}

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
              {/* SOURCE VIDEO & REEL MEDIA */}
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-900 border border-surface-border">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <FileVideo size={13} className="text-brand-400" /> Source Media File
                  </span>
                  <Badge variant={clipStatus === 'ready' ? 'brand' : 'default'} className="text-[9px] uppercase font-mono">
                    {clipStatus}
                  </Badge>
                </div>

                {/* Drag-and-drop replacement zone */}
                <input
                  type="file"
                  ref={sourceUploadInputRef}
                  accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleSourceFileUpload(file)
                  }}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDraggingFile(true)
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDraggingFile(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file) handleSourceFileUpload(file)
                  }}
                  onClick={() => sourceUploadInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                    isDraggingFile
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-950/60'
                  }`}
                >
                  {isUploadingSource ? (
                    <div className="py-2 flex flex-col items-center">
                      <Loader2 size={20} className="animate-spin text-brand-400 mb-2" />
                      <span className="text-[11px] font-semibold text-white">Transcoding & Re-encoding...</span>
                      <div className="w-36 bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
                        <div
                          className="bg-brand-500 h-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-1.5 text-slate-400" size={18} />
                      <p className="text-[11px] font-semibold text-slate-200">
                        Drag & drop MP4/MOV/WebM here, or <span className="text-brand-400 underline">browse</span>
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1">Re-encodes to H.264/AAC faststart (max 500 MB)</p>
                    </>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 truncate bg-slate-950 p-2 rounded-lg border border-surface-border font-mono flex items-center justify-between">
                  <span className="truncate">
                    ID: {clipId}
                  </span>
                  <span className="text-[9px] text-slate-500 shrink-0">
                    {duration.toFixed(1)}s
                  </span>
                </div>

                {/* Paste URL */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold block">Or Load Video URL / Stream:</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="Paste MP4 direct URL..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-surface-border text-white text-[11px] placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                    />
                    <Button size="xs" onClick={handleCustomUrlApply} disabled={!customUrlInput.trim()}>
                      Load
                    </Button>
                  </div>
                </div>
              </div>

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
            {(thumbnails.length > 0
              ? thumbnails.length === 1
                ? Array.from({ length: 8 }, () => thumbnails[0])
                : thumbnails
              : DEFAULT_TIMELINE_THUMBNAILS
            ).map((src, i) => (
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

      <YouTubePublishModal
        open={isYouTubePublishOpen}
        onClose={() => setIsYouTubePublishOpen(false)}
        clip={{
          id: clipId,
          title: clipTitle || 'Viral Reel #Shorts',
          description: editJson.captions?.words?.map((w) => w.text).join(' ') || 'Created with ClipForge AI',
          duration: duration || 30.0,
          video_url: exportDownloadUrl || undefined,
        }}
      />
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
