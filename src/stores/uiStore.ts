import { create } from 'zustand'

interface UiState {
  cartOpen: boolean
  searchOpen: boolean
  /** product name shown in the mobile product header (set by ProductPage) */
  productTitle: string
  setProductTitle: (t: string) => void
  setCartOpen: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()((set) => ({
  cartOpen: false,
  searchOpen: false,
  productTitle: '',
  setProductTitle: (productTitle) => set({ productTitle }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}))
