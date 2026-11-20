import axios from 'axios'
import { supabase } from './supabase'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ''
).replace(/\/+$/, '')

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  timeout: 30000,
})

// Attach Supabase JWT or Owner token to every request
api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession()
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`
      return config
    }
  } catch (_) {}

  // Fallback to local persisted session
  try {
    const stored = localStorage.getItem('clipforge-auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      const isOwner = parsed?.state?.isOwner
      const user = parsed?.state?.user
      const profile = parsed?.state?.profile
      const email = user?.email || ''
      const name = profile?.full_name || ''

      if (isOwner || email.toLowerCase().includes('ayush') || name.toLowerCase().includes('ayush')) {
        config.headers.Authorization = 'Bearer owner-ayush-token'
        config.headers['X-User-Email'] = 'ayushargulwar0@gmail.com'
        config.headers['X-User-Role'] = 'admin'
      }
    }
  } catch (_) {}

  // Fallback to owner token for unauthenticated dev/preview sessions
  if (!config.headers.Authorization) {
    config.headers.Authorization = 'Bearer owner-ayush-token'
    config.headers['X-User-Email'] = 'ayushargulwar0@gmail.com'
    config.headers['X-User-Role'] = 'admin'
  }

  return config
})

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Request failed'
    console.error('[ClipForge API]', msg)
    return Promise.reject(new Error(msg))
  }
)

export default api
