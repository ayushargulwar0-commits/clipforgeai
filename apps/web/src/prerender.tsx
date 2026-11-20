import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui/Toast'

// Marketing Pages
import Home from '@/pages/Home'
import Pricing from '@/pages/Pricing'
import Privacy from '@/pages/Privacy'
import Terms from '@/pages/Terms'
import Contact from '@/pages/Contact'
import About from '@/pages/About'

export interface RouteMeta {
  title: string
  description: string
  component: React.ComponentType
}

export const ROUTE_MAP: Record<string, RouteMeta> = {
  '/': {
    title: 'ClipForge AI — Turn Long Videos Into Scroll-Stopping Shorts',
    description: 'Transform long footage into vertical Shorts, Reels, and TikToks with smart 9:16 crop, kinetic captions, and direct YouTube publishing.',
    component: Home,
  },
  '/pricing': {
    title: 'Pricing & Plans — ClipForge AI',
    description: 'Simple, transparent pricing for creators and agencies. Start free with 10 exports per month, no credit card required.',
    component: Pricing,
  },
  '/privacy': {
    title: 'Privacy Policy — ClipForge AI',
    description: 'Learn how ClipForge AI collects, protects, and handles your account data, video imports, and YouTube API tokens.',
    component: Privacy,
  },
  '/terms': {
    title: 'Terms of Service — ClipForge AI',
    description: 'Read the ClipForge AI Terms of Service governing your use of our automated video repurposing and AI editing software.',
    component: Terms,
  },
  '/contact': {
    title: 'Contact Us — ClipForge AI',
    description: 'Get in touch with the ClipForge AI team for technical support, feedback, partnerships, and inquiries.',
    component: Contact,
  },
  '/about': {
    title: 'About ClipForge AI — Honest Video Repurposing for Creators',
    description: 'ClipForge AI is an open-source powered software platform built to transform long-form recordings into clean, vertical short videos.',
    component: About,
  },
}

export function renderRoute(url: string) {
  const meta = ROUTE_MAP[url]
  if (!meta) {
    throw new Error(`Route not configured for prerendering: ${url}`)
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const Component = meta.component

  const html = renderToString(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StaticRouter location={url}>
            <Component />
          </StaticRouter>
        </ToastProvider>
      </QueryClientProvider>
    </React.StrictMode>
  )

  return {
    html,
    title: meta.title,
    description: meta.description,
  }
}
