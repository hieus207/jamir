import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setTokenProvider, setUnauthorizedHandler } from '@/services/client'
import type { AuthSession, Customer } from '@/types/domain'

type Mode = 'login' | 'register'

export const useAuthDialog = create<{ mode: Mode | null; show: (m: Mode) => void; hide: () => void }>()((set) => ({
  mode: null,
  show: (mode) => set({ mode }),
  hide: () => set({ mode: null }),
}))

interface SessionState {
  token: string | null
  user: Customer | null
  setSession: (s: AuthSession) => void
  setUser: (u: Customer) => void
  logout: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ token, user }) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'jamir-session' },
  ),
)

// wire the HTTP client to the session
setTokenProvider(() => useSession.getState().token)
setUnauthorizedHandler(() => useSession.getState().logout())

export const useIsAdmin = () => useSession((s) => s.user?.role === 'admin')
