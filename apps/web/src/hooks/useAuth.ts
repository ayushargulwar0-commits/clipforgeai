import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, profile, loading, setUser, setProfile, setLoading, signOut } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line

  return { user, profile, loading, signOut, isAdmin: profile?.role === 'admin' }
}

export function useRequireAuth() {
  const { user, loading } = useAuth()
  return { user, loading, isAuthenticated: !!user }
}
