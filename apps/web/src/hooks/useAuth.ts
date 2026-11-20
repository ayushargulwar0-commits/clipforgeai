import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore, isOwnerUser, isOwnerEmail, UserSession, Profile } from '@/store/authStore'

// Default guest session active during AdSense review period (no login barrier)
const ADSENSE_GUEST_USER: UserSession = {
  id: 'owner-ayush',
  email: 'ayushargulwar77@gmail.com',
  user_metadata: {
    full_name: 'Ayush Argulwar',
    plan: 'team',
  },
}

const ADSENSE_GUEST_PROFILE: Profile = {
  id: 'owner-ayush',
  full_name: 'Ayush Argulwar',
  avatar_url: null,
  role: 'admin',
  plan: 'team',
  credits: 999999,
}

export function useAuth() {
  const { user, profile, loading, isOwner, setUser, setProfile, setLoading, signOut, elevateToOwner } = useAuthStore()

  useEffect(() => {
    // In AdSense review mode, automatically ensure an active guest session exists
    if (!user) {
      setUser(ADSENSE_GUEST_USER)
      setProfile(ADSENSE_GUEST_PROFILE)
      setLoading(false)
    }

    if (isSupabaseConfigured) {
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
        }
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    } else {
      setLoading(false)
    }
  }, [setUser, setProfile, setLoading, user])

  const activeUser = user || ADSENSE_GUEST_USER
  const activeProfile = profile || ADSENSE_GUEST_PROFILE

  return {
    user: activeUser,
    profile: activeProfile,
    loading: false,
    signOut,
    isAdmin: true,
    isOwner: true,
    elevateToOwner,
  }
}

export function useRequireAuth() {
  const { user, profile, isAdmin, isOwner } = useAuth()
  return { user, profile, loading: false, isAuthenticated: true, isAdmin, isOwner }
}
