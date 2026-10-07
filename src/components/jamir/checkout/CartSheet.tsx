import { ShoppingBag, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { formatPrice } from '@/lib/utils'
import { selectCartTotal, useCartStore } from '@/stores/cartStore'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useUiStore } from '@/stores/uiStore'
import { StateBlock } from '../layout/PageStates'
import { QuantitySelector } from '../product/QuantitySelector'

export function CartSheet() {
  const open = useUiStore((s) => s.cartOpen)
  const setOpen = useUiStore((s) => s.setCartOpen)
  const { lines, setQuantity, remove } = useCartStore()
  const total = useCartStore(selectCartTotal)
  const openCheckout = useCheckoutStore((s) => s.openCart)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent title={`Giỏ hàng (${lines.reduce((n, l) => n + l.quantity, 0)})`}>
        {lines.length === 0 ? (
          <StateBlock
            icon={ShoppingBag}
            title="Giỏ hàng đang trống"
            description="Khám phá video sản phẩm và chọn món bạn thích nhé."
            className="my-auto"
            action={
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Tiếp tục mua sắm
              </Button>
            }
          />
        ) : (
          <>
            <ul className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-5">
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <motion.li
                    key={l.key}
                    layout
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex gap-3"
                  >
                    <Link to={`/product/${l.product.slug}`} onClick={() => setOpen(false)} className="shrink-0">
                      <img src={l.product.thumbnail} alt="" className="size-20 rounded-[12px] bg-canvas object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex items-start gap-2">
                        <Link
                          to={`/product/${l.product.slug}`}
                          onClick={() => setOpen(false)}
                          className="line-clamp-2 flex-1 text-sm font-semibold text-ink hover:text-brand-700"
                        >
                          {l.product.name}
                        </Link>
                        <button
                          type="button"
                          aria-label={`Xóa ${l.product.name}`}
                          onClick={() => remove(l.key)}
                          className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-subtle hover:bg-danger-50 hover:text-danger"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-muted">
                        <span className="size-3 rounded-full ring-1 ring-line" style={{ backgroundColor: l.colorHex }} aria-hidden="true" />
                        {l.colorName}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <QuantitySelector
                          size="sm"
                          value={l.quantity}
                          onChange={(q) => setQuantity(l.key, q)}
                          max={Math.max(1, Math.min(l.product.stock, 99))}
                          label={`Số lượng ${l.product.name}`}
                        />
                        <span className="text-sm font-bold tabular-nums">{formatPrice(l.product.price * l.quantity)}</span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="flex flex-col gap-3 border-t border-line p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Tạm tính</span>
                <span className="text-xl font-extrabold text-brand-700 tabular-nums">{formatPrice(total)}</span>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  setOpen(false)
                  openCheckout(lines.map(({ key: _key, ...l }) => l))
                }}
              >
                Thanh toán
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
