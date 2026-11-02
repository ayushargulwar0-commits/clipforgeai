import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const supabaseAnon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnon &&
  !supabaseAnon.includes('placeholder')
)

if (!isSupabaseConfigured) {
  console.info(
    '[ClipForge] Supabase credentials not set — running in Local Development / Offline Auth Mode. All features will work with local persistence.'
  )
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnon : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

export type SupabaseUser = any
