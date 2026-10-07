import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartLine } from './cartStore'

/** Items being checked out — either "buy now" (single line) or the whole cart. */
export type CheckoutLine = Omit<CartLine, 'key'>

interface CheckoutState {
  open: boolean
  source: 'buy-now' | 'cart'
  lines: CheckoutLine[]
  openBuyNow: (line: CheckoutLine) => void
  openCart: (lines: CheckoutLine[]) => void
  setOpen: (open: boolean) => void
  setQuantity: (index: number, quantity: number) => void
}

/** Voucher the shopper saved from a product page — pre-filled at checkout. */
export const useSavedVoucher = create<{ code: string | null; save: (code: string | null) => void }>()(
  persist((set) => ({ code: null, save: (code) => set({ code }) }), { name: 'jamir-voucher' }),
)

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  open: false,
  source: 'buy-now',
  lines: [],
  openBuyNow: (line) => set({ open: true, source: 'buy-now', lines: [line] }),
  openCart: (lines) => set({ open: true, source: 'cart', lines }),
  setOpen: (open) => set({ open }),
  setQuantity: (index, quantity) =>
    set((s) => ({ lines: s.lines.map((l, i) => (i === index ? { ...l, quantity: Math.max(1, quantity) } : l)) })),
}))
