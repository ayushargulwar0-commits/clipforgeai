import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const OWNER_EMAILS = [
  'ayushargulwar0@gmail.com',
  'ayushargulwar77@gmail.com',
]

export const isOwnerEmail = (email?: string | null): boolean => {
  if (!email) return false
  const clean = email.trim().toLowerCase()
  return (
    OWNER_EMAILS.some((e) => e.toLowerCase() === clean) ||
    clean.includes('ayushargulwar') ||
    clean.includes('ayush')
  )
}

export const isOwnerName = (name?: string | null): boolean => {
  if (!name) return false
  const clean = name.trim().toLowerCase()
  return clean.includes('ayush') || clean.includes('argulwar')
}

export const isOwnerUser = (user?: any, profile?: any): boolean => {
  if (isOwnerEmail(user?.email)) return true
  if (isOwnerName(profile?.full_name)) return true
  if (isOwnerName(user?.user_metadata?.full_name)) return true
  return false
}

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
  isOwner: boolean
  setUser: (user: UserSession | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  elevateToOwner: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,
      isOwner: false,

      elevateToOwner: () => {
        const ownerUser: UserSession = {
          id: 'owner-ayush',
          email: 'ayushargulwar0@gmail.com',
          user_metadata: {
            full_name: 'Ayush Argulwar',
            plan: 'team',
          },
        }
        const ownerProfile: Profile = {
          id: 'owner-ayush',
          full_name: 'Ayush Argulwar',
          avatar_url: null,
          role: 'admin',
          plan: 'team',
          credits: 999999,
        }
        set({
          user: ownerUser,
          profile: ownerProfile,
          isOwner: true,
          loading: false,
        })
      },

      setUser: (user) => {
        const currentProfile = get().profile
        const owner = isOwnerUser(user, currentProfile)
        let updatedProfile = currentProfile

        if (owner) {
          updatedProfile = {
            id: user?.id || 'owner-ayush',
            full_name: user?.user_metadata?.full_name || currentProfile?.full_name || 'Ayush Argulwar',
            avatar_url: null,
            role: 'admin',
            plan: 'team',
            credits: 999999,
          }
        }

        set({
          user: owner
            ? {
                id: user?.id || 'owner-ayush',
                email: user?.email || 'ayushargulwar0@gmail.com',
                user_metadata: {
                  full_name: user?.user_metadata?.full_name || currentProfile?.full_name || 'Ayush Argulwar',
                  plan: 'team',
                },
              }
            : user,
          isOwner: owner,
          profile: updatedProfile,
        })
      },

      setProfile: (profile) => {
        const currentUser = get().user
        const owner = isOwnerUser(currentUser, profile)
        if (owner && profile) {
          set({
            profile: {
              ...profile,
              full_name: profile.full_name || currentUser?.user_metadata?.full_name || 'Ayush Argulwar',
              role: 'admin',
              plan: 'team',
              credits: 999999,
            },
            isOwner: true,
          })
        } else {
          set({ profile, isOwner: owner })
        }
      },

      setLoading: (loading) => set({ loading }),

      signOut: async () => {
        if (isSupabaseConfigured) {
          try {
            await supabase.auth.signOut()
          } catch (_) {}
        }
        set({ user: null, profile: null, isOwner: false })
      },
    }),
    {
      name: 'clipforge-auth',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (isOwnerUser(state.user, state.profile)) {
          state.isOwner = true
          if (state.profile) {
            state.profile.role = 'admin'
            state.profile.plan = 'team'
            state.profile.credits = 999999
            if (!state.profile.full_name || state.profile.full_name === 'Creator User') {
              state.profile.full_name = 'Ayush Argulwar'
            }
          }
          if (state.user) {
            if (!state.user.email || state.user.email === 'creator@example.com') {
              state.user.email = 'ayushargulwar0@gmail.com'
            }
          }
        }
      },
    }
  )
)
