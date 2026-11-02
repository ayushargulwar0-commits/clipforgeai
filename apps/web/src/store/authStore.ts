import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  plan: 'free' | 'creator' | 'pro' | 'team'
  credits: number
  bio?: string | null
}

export interface UserSession {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    plan?: string
    avatar_url?: string
  }
}

interface AuthState {
  user: UserSession | null
  profile: Profile | null
  loading: boolean
  setUser: (user: UserSession | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      loading: true,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      signOut: async () => {
        if (isSupabaseConfigured) {
          try {
            await supabase.auth.signOut()
          } catch (_) {}
        }
        set({ user: null, profile: null })
      },
    }),
    {
      name: 'clipforge-auth',
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    }
  )
)
