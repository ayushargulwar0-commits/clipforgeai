import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, profile, loading, setUser, setProfile, setLoading, signOut } = useAuthStore()

  useEffect(() => {
    if (isSupabaseConfigured) {
      // Supabase is configured with real cloud URL & key
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          setUser(data.session.user as any)
        }
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user as any)
        } else {
          setUser(null)
        }
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    } else {
      // Local dev mode: preserve current user from persisted zustand store
      setLoading(false)
    }
  }, [setUser, setLoading])

  return { user, profile, loading, signOut, isAdmin: profile?.role === 'admin' }
}

export function useRequireAuth() {
  const { user, loading } = useAuth()
  return { user, loading, isAuthenticated: !!user }
}
