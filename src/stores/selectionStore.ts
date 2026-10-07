import { create } from 'zustand'
import type { Product } from '@/types/domain'

/** Color + quantity chosen on the current product page (shared by panel, sticky CTA and checkout). */
interface SelectionState {
  productId: string | null
  colorId: string
  quantity: number
  reset: (product: Product) => void
  setColor: (colorId: string) => void
  setQuantity: (quantity: number) => void
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  productId: null,
  colorId: '',
  quantity: 1,
  reset: (p) => set({ productId: p.id, colorId: p.colors[0]?.id ?? '', quantity: 1 }),
  setColor: (colorId) => set({ colorId }),
  setQuantity: (quantity) => set({ quantity }),
}))
