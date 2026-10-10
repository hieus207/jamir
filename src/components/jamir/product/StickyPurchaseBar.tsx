import { BellRing, ShoppingCart } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { usePurchaseActions } from '@/hooks/usePurchaseActions'
import { formatPrice } from '@/lib/utils'
import { useSelectionStore } from '@/stores/selectionStore'
import type { Product } from '@/types/domain'
import { WishlistButton } from './WishlistButton'

/** Mobile/tablet sticky CTA: price · ♡ · Đặt hàng ngay. */
export function StickyPurchaseBar({ product }: { product: Product }) {
  const actions = usePurchaseActions(product)
  const quantity = useSelectionStore((s) => s.quantity)
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36, delay: 0.15 }}
      className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 border-t md:bottom-0 md:pb-[env(safe-area-inset-bottom,0px)] border-line/70 bg-surface shadow-[0_-8px_24px_-12px_rgb(17_24_39/0.18)] lg:hidden"
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-2 md:py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-xl leading-tight font-extrabold text-brand-700 tabular-nums">{formatPrice(product.price * quantity)}</p>
          <p className="truncate text-xs text-subtle">
            {quantity > 1 ? `${quantity} × ${formatPrice(product.price)}` : <span className="line-through">{formatPrice(product.originalPrice)}</span>}
          </p>
        </div>
        <WishlistButton productId={product.id} onToggle={actions.toggleWishlist} className="size-12 max-[359px]:hidden" />
        {actions.inStock ? (
          <Button size="lg" className="h-12 px-5" onClick={actions.buyNow}>
            <ShoppingCart aria-hidden="true" />
            Đặt hàng ngay
          </Button>
        ) : (
          <Button variant="dark" size="lg" className="h-12 px-5" onClick={actions.notifyRestock}>
            <BellRing aria-hidden="true" />
            Báo khi có hàng
          </Button>
        )}
      </div>
    </motion.div>
  )
}
