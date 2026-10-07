import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductSummary } from '@/types/domain'

export interface CartLine {
  key: string
  product: Pick<ProductSummary, 'id' | 'slug' | 'name' | 'thumbnail' | 'price' | 'originalPrice' | 'stock'> & { gifts?: string[] }
  colorId: string
  colorName: string
  colorHex: string
  quantity: number
}

interface CartState {
  lines: CartLine[]
  add: (line: Omit<CartLine, 'key'>) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const key = `${line.product.id}:${line.colorId}`
          const existing = s.lines.find((l) => l.key === key)
          if (existing)
            return {
              lines: s.lines.map((l) =>
                l.key === key ? { ...l, quantity: Math.min(l.quantity + line.quantity, 99) } : l,
              ),
            }
          return { lines: [{ ...line, key }, ...s.lines] }
        }),
      setQuantity: (key, quantity) =>
        set((s) => ({ lines: s.lines.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, quantity) } : l)) })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'jamir-cart' },
  ),
)

export const selectCartCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0)
export const selectCartTotal = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity * l.product.price, 0)
