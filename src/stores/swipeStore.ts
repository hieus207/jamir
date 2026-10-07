import { create } from 'zustand'

/** Direction of the last product-to-product navigation (drives the slide animation). */
export const useSwipeStore = create<{ direction: 1 | -1 | 0; setDirection: (d: 1 | -1 | 0) => void }>()((set) => ({
  direction: 0,
  setDirection: (direction) => set({ direction }),
}))
