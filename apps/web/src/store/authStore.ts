import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { SupabaseUser } from '@/lib/supabase'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  plan: 'free' | 'creator' | 'pro' | 'team'
  credits: number
}

interface AuthState {
  user: SupabaseUser | null
  profile: Profile | null
  loading: boolean
  setUser: (user: SupabaseUser | null) => void
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
        await supabase.auth.signOut()
        set({ user: null, profile: null })
      },
    }),
    {
      name: 'clipforge-auth',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)
