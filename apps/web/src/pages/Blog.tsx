import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BookOpen, Clock, Calendar, ArrowRight, User, Share2, Sparkles, ChevronLeft } from 'lucide-react'

export interface Article {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  date: string
  author: string
  content: string[]
}

export const ARTICLES: Article[] = [
  {
    slug: 'the-ultimate-guide-to-repurposing-long-form-video-into-viral-shorts',
    title: 'The Ultimate Guide to Repurposing Long-Form Video into Viral Shorts & Reels (2026)',
    excerpt: 'Learn the exact framework top creators use to extract 15+ high-retention vertical clips from a single 60-minute podcast or webinar.',
    category: 'Content Strategy',
    readTime: '6 min read',
    date: 'November 18, 2026',
    author: 'Ayush Argulwar',
    content: [
      'Short-form video has completely revolutionized creator discovery. With over 70 billion daily views on YouTube Shorts and billions more across TikTok and Instagram Reels, short clips are no longer an optional marketing tactic—they are the primary engine of modern audience acquisition.',
      'However, the biggest hurdle creators encounter is time: meticulously scrubbing through an hour-long recording, finding punchy soundbites, cropping to 9:16 portrait orientation, and manually timing word-by-word subtitles can take 6 to 8 hours per episode. This comprehensive guide outlines the systematic framework to repurpose long videos efficiently.',
      '1. The 3-Second Hook Rule: In short-form feeds, viewers scroll past within milliseconds if not immediately captivated. Your clip must begin not with introductory small talk or pleasantries, but directly at the peak of tension, a provocative question, or an unexpected statement.',
      '2. Audio Pacing & Dead Air Elimination: Unlike conversational podcasts where natural pauses build rapport, mobile viewers interpret dead air as lack of momentum. Removing silences greater than 0.4 seconds increases audience retention curves by over 35%.',
      '3. Visual Framing (16:9 to 9:16): Horizontal videos leave massive black bars on smartphones. Repurposing requires intelligent speaker centering or split-screen views so the speaker fills at least 70% of the vertical canvas.',
      '4. Word-by-Word Kinetic Captions: Over 69% of mobile viewers consume content with sound muted in public spaces. Dynamic, animated subtitles ensure complete message comprehension and give the viewer a visual anchor to remain on the screen.',
      'By implementing an automated pipeline that couples speech-to-text with intelligent clip selection, creators can consistently publish 3 to 5 high-converting shorts daily without burnout.'
    ]
  },
  {
    slug: 'how-ai-smart-reframing-works-16-9-to-9-16',
    title: 'How AI Smart Reframing Works: Converting 16:9 Landscape to 9:16 Portrait',
    excerpt: 'An inside look at computer vision algorithms, face tracking, and split-screen rendering for multi-speaker podcasts.',
    category: 'Technology & AI',
    readTime: '5 min read',
    date: 'November 16, 2026',
    author: 'ClipForge Engineering',
    content: [
      'Traditional video production recorded horizontal footage (1920x1080) optimized for television screens and desktop monitors. With smartphones dominating digital media consumption, creators face a geometric challenge: converting 16:9 widescreen footage into 9:16 vertical formats without losing context.',
      'Simply letterboxing the video (placing black bars above and below) drastically degrades viewer engagement because the visual subject appears tiny on mobile screens.',
      'To solve this, ClipForge AI employs automated multi-modal reframing pipelines:',
      '• Speaker Centering & Face Tracking: Using lightweight convolutional neural networks and Haar-cascade algorithms, the system identifies active faces and computes a dynamic bounding box that tracks the speaker smoothly across the 1080x1920 viewport.',
      '• Split-Screen Layouts for Interviews: In two-person podcasts or webinars, our pipeline detects both subjects and renders a vertically stacked layout where each speaker occupies a dedicated half of the frame.',
      '• Blur-Fit Background Padding: When landscape context is essential (e.g., coding tutorials or gaming footage), the primary video is centered at native proportions while a gaussian-blurred, high-saturation copy of the same video fills the top and bottom borders.',
      'This multi-strategy approach ensures your content looks natively shot for mobile platforms while preserving full visual clarity.'
    ]
  },
  {
    slug: 'the-science-of-kinetic-subtitles-why-captions-boost-retention',
    title: 'The Science of Kinetic Subtitles: Why Word-by-Word Captions Boost Retention by 82%',
    excerpt: 'Discover why top TikTok and YouTube creators prioritize colored word highlighting, safe zones, and readable typography.',
    category: 'Video Editing',
    readTime: '4 min read',
    date: 'November 14, 2026',
    author: 'Ayush Argulwar',
    content: [
      'Watch any top-performing TikTok, YouTube Short, or Instagram Reel today, and you will notice an undeniable commonality: dynamic, animated subtitles popping up word-by-word with vibrant color highlights.',
      'Eye-tracking studies reveal that kinetic subtitles serve as cognitive anchors. When viewers see and hear speech simultaneously, information processing speed doubles, resulting in up to 82% longer average watch durations.',
      'Key best practices for subtitle styling in short-form video:',
      '• High-Contrast Typography: Sans-serif fonts (such as Montserrat, Inter, or The Bold Font) with clean outlines and subtle drop shadows guarantee legibility against both light and dark video backgrounds.',
      '• Mobile Safe Zones: All short-form platforms overlay platform UI elements—such as usernames, follow buttons, sound icons, and captions—over the bottom 25% and right 15% of the screen. Subtitles must be positioned safely within the vertical center.',
      '• Word-by-Word Color Highlighting: Highlighting the currently spoken word with a contrasting vibrant accent (such as energetic yellow or neon cyan) guides the viewer’s eye in lockstep with the speaker’s cadence.',
      'ClipForge AI automates this exact process with faster-whisper speech recognition and custom ASS subtitle rendering engines.'
    ]
  },
  {
    slug: 'youtube-shorts-vs-tiktok-vs-instagram-reels-algorithm-guide',
    title: 'YouTube Shorts vs. TikTok vs. Instagram Reels: Algorithm Breakdown (2026)',
    excerpt: 'A comparative analysis of ranking signals, completion rates, and audience demographics across the big three platforms.',
    category: 'Social Media Algorithms',
    readTime: '7 min read',
    date: 'November 10, 2026',
    author: 'Ayush Argulwar',
    content: [
      'While YouTube Shorts, TikTok, and Instagram Reels all share the identical 9:16 aspect ratio, their recommendation algorithms prioritize distinct behavioral metrics:',
      '1. YouTube Shorts: The YouTube algorithm values Viewed vs. Swiped Away percentage and Average Percentage Viewed (APV). Aim for over 70% viewed rate and 100%+ retention through seamless looping.',
      '2. TikTok: TikTok is intensely interest-graph driven. The algorithm prioritizes completion rate, repeat rewatches, and shares within the first 100 impressions to determine whether to push the video to broader For You Page (FYP) tiers.',
      '3. Instagram Reels: Instagram prioritizes sends via DM (Direct Message) and saves over raw likes. Relatable, educational, or highly entertaining content that prompts users to share with friends receives the highest algorithmic boost.',
      'Repurposing your master clips across all three platforms maximizes your organic reach and ensures resilience against single-platform algorithmic fluctuations.'
    ]
  }
]

export default function Blog() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  return (
    <PublicLayout>
      <div className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {selectedArticle ? (
          /* Single Article Reader View */
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setSelectedArticle(null)}
              className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 font-medium mb-8 transition-colors"
            >
              <ChevronLeft size={16} /> Back to all articles
            </button>

            <div className="mb-8">
              <Badge variant="brand" className="mb-3">{selectedArticle.category}</Badge>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                {selectedArticle.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pb-6 border-b border-surface-border">
                <span className="flex items-center gap-1.5"><User size={14} /> {selectedArticle.author}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} /> {selectedArticle.date}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} /> {selectedArticle.readTime}</span>
              </div>
            </div>

            <Card className="p-8 sm:p-12 space-y-6 text-slate-300 text-base leading-relaxed border-surface-border bg-surface-card">
              {selectedArticle.content.map((paragraph, index) => (
                <p key={index} className="text-slate-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </Card>

            <div className="mt-12 text-center p-8 rounded-2xl bg-surface-card border border-surface-border">
              <h3 className="text-xl font-bold text-white mb-2">Ready to turn this strategy into reality?</h3>
              <p className="text-slate-400 text-sm mb-6">
                ClipForge AI automatically generates clips, kinetic captions, and reframing in minutes.
              </p>
              <Link to="/dashboard">
                <Button size="lg" className="font-semibold shadow-brand">
                  Launch ClipForge Studio Free →
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Article Directory / Grid View */
          <div>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="brand" className="mb-3">Guides &amp; Resources</Badge>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                The Video Creator <span className="gradient-text">Knowledge Hub</span>
              </h1>
              <p className="text-slate-400 text-base">
                In-depth guides, technical breakdowns, and algorithmic strategies to help you scale your short-form video reach.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {ARTICLES.map((article) => (
                <Card
                  key={article.slug}
                  hover
                  onClick={() => setSelectedArticle(article)}
                  className="p-8 cursor-pointer flex flex-col justify-between border-surface-border bg-surface-card"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <Badge variant="brand">{article.category}</Badge>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={12} /> {article.readTime}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-3 hover:text-brand-300 transition-colors">
                      {article.title}
                    </h2>

                    <p className="text-sm text-slate-400 leading-relaxed mb-6">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-surface-border flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {article.date}
                    </span>
                    <span className="text-brand-400 font-semibold flex items-center gap-1 group">
                      Read Guide <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
