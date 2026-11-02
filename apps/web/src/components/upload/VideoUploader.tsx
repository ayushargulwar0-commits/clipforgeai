import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Film, X, CheckCircle2, AlertCircle, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Feedback'
import { formatFileSize } from '@/lib/utils'
import api from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface VideoUploaderProps {
  onUploadComplete?: (video: any) => void
  projectId?: string
}

export function VideoUploader({ onUploadComplete, projectId }: VideoUploaderProps) {
  const { error, success } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [urlInput, setUrlInput] = useState('')
  const [mode, setMode] = useState<'file' | 'url'>('file')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0]
      if (selected.size > 500 * 1024 * 1024) {
        error('File too large', 'Max upload size is 500MB')
        return
      }
      setFile(selected)
    }
  }, [error])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
    },
    maxFiles: 1,
    multiple: false,
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (projectId) {
        formData.append('project_id', projectId)
      }

      const res = await api.post('/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 90) / progressEvent.total)
            setProgress(pct)
          }
        },
      })

      setProgress(100)
      success('Upload Complete', `${file.name} uploaded and analyzed.`)
      if (onUploadComplete) onUploadComplete(res.data)
      setFile(null)
    } catch (err: any) {
      error('Upload Failed', err.message || 'Server error during upload')
    } finally {
      setUploading(false)
    }
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    setUploading(true)
    setProgress(30)
    try {
      // Simulate URL ingestion or backend trigger
      setTimeout(() => {
        setProgress(100)
        success('Source Processed', 'Imported video source successfully.')
        if (onUploadComplete) {
          onUploadComplete({
            video_id: 'sample-' + Date.now(),
            filename: 'URL Source Video',
            file_size: 15400000,
            duration: 120,
            status: 'ready',
          })
        }
        setUrlInput('')
        setUploading(false)
      }, 1500)
    } catch (err: any) {
      error('Import Failed', err.message)
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex border-b border-surface-border">
        <button
          type="button"
          onClick={() => setMode('file')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            mode === 'file'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload size={14} /> Upload Video File
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            mode === 'url'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LinkIcon size={14} /> Import from URL
        </button>
      </div>

      {mode === 'file' ? (
        <div className="space-y-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={`p-10 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-surface-border hover:border-brand-500/50 hover:bg-surface-card/60'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-12 h-12 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center text-brand-400 mx-auto mb-3">
                <Upload size={22} />
              </div>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                {isDragActive ? 'Drop your video here...' : 'Drag & drop your video here'}
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Supports MP4, MOV, WebM, MKV up to 500MB
              </p>
              <Button type="button" variant="outline" size="sm" className="text-xs pointer-events-none">
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center shrink-0">
                  <Film size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {!uploading && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} label="Uploading and analyzing video..." showLabel />
            </div>
          )}

          {file && !uploading && (
            <Button onClick={handleUpload} className="w-full font-semibold">
              Start Upload & Analysis
            </Button>
          )}
        </div>
      ) : (
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Video Source URL</label>
            <input
              type="url"
              required
              placeholder="https://example.com/podcast-recording.mp4"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
            <p className="text-[11px] text-slate-500">
              Only direct video streams and permitted open sources are supported.
            </p>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} label="Importing remote stream..." showLabel />
            </div>
          )}

          {!uploading && (
            <Button type="submit" className="w-full font-semibold">
              Fetch and Ingest Video
            </Button>
          )}
        </form>
      )}
    </div>
  )
}
