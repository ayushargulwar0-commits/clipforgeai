/**
 * ClipForge AI — Shared TypeScript interfaces and domain models
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type JobType = 'transcription' | 'clip_detection' | 'render' | 'thumbnail'
export type AspectRatio = '9:16' | '16:9' | '1:1'
export type VideoStatus = 'uploaded' | 'transcribing' | 'transcribed' | 'processing' | 'ready' | 'failed'
export type ClipStatus = 'detected' | 'rendering' | 'rendered' | 'failed'
export type SubscriptionPlan = 'free' | 'creator' | 'pro' | 'team'

export interface VideoMetadata {
  duration?: number
  width?: number
  height?: number
  fps?: number
  codec?: string
  bitrate?: number
}

export interface WordTimestamp {
  word: string
  start: number
  end: number
}

export interface TranscriptSegment {
  start: number
  end: number
  text: string
  words?: WordTimestamp[]
}

export interface TranscriptData {
  language: string
  duration: number
  segments: TranscriptSegment[]
}

export interface ClipCandidate {
  start: number
  end: number
  duration: number
  title: string
  description: string
  hook: string
  transcript_text: string
  score: number
  score_explanation: string
}

export interface EditingConfiguration {
  startTime: number
  endTime: number
  aspectRatio: AspectRatio
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
