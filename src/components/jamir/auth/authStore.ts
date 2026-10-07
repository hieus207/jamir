import { create } from 'zustand'

type Mode = 'login' | 'register'

export const useAuthDialog = create<{ mode: Mode | null; show: (m: Mode) => void; hide: () => void }>()((set) => ({
  mode: null,
  show: (mode) => set({ mode }),
  hide: () => set({ mode: null }),
}))
