import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore, isOwnerUser, isOwnerEmail } from '@/store/authStore'

export function useAuth() {
  const { user, profile, loading, isOwner, setUser, setProfile, setLoading, signOut, elevateToOwner } = useAuthStore()

  const userIsOwner = isOwner || isOwnerUser(user, profile) || isOwnerEmail(user?.email)
  const isAdmin = userIsOwner || profile?.role === 'admin'

  useEffect(() => {
    // If the session matches Ayush or owner credentials, ensure admin role and unlimited credits
    if (userIsOwner) {
      if (profile?.role !== 'admin' || profile?.credits !== 999999 || profile?.plan !== 'team' || !isOwner) {
        setProfile({
          id: user?.id || 'owner-ayush',
          full_name: profile?.full_name || user?.user_metadata?.full_name || 'Ayush Argulwar',
          avatar_url: null,
          role: 'admin',
          plan: 'team',
          credits: 999999,
        })
      }
    }

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
  }, [setUser, setProfile, setLoading, userIsOwner, user, profile, isOwner])

  return {
    user,
    profile,
    loading,
    signOut,
    isAdmin,
    isOwner: userIsOwner,
    elevateToOwner,
  }
}

export function useRequireAuth() {
  const { user, loading, isAdmin, isOwner } = useAuth()
  return { user, loading, isAuthenticated: !!user, isAdmin, isOwner }
}
