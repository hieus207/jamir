import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  ids: string[]
  toggle: (productId: string) => boolean
  has: (productId: string) => boolean
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) => {
        const added = !get().ids.includes(productId)
        set((s) => ({ ids: added ? [productId, ...s.ids] : s.ids.filter((id) => id !== productId) }))
        return added
      },
      has: (productId) => get().ids.includes(productId),
    }),
    { name: 'jamir-wishlist' },
  ),
)

export const useIsWishlisted = (productId: string) => useWishlistStore((s) => s.ids.includes(productId))
