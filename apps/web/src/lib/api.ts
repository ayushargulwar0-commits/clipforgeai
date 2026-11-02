import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`
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
