import { Check, ShoppingCart, Star } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from '@/components/ui/toast'
import { usePrefetchProduct } from '@/hooks/queries'
import { cn, formatCompact, formatPrice } from '@/lib/utils'
import { useCartStore } from '@/stores/cartStore'
import type { ProductSummary } from '@/types/domain'

/** Product card: image, badge, name, rating, price, discount, quick add-to-cart. */
export function RecommendationCard({ product, className }: { product: ProductSummary; className?: string }) {
  const add = useCartStore((s) => s.add)
  const prefetch = usePrefetchProduct()
  const [added, setAdded] = useState(false)
  const soldOut = product.stock === 0

  const quickAdd = () => {
    if (soldOut) return
    add({
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        thumbnail: product.thumbnail,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
      },
      colorId: product.defaultColor.id,
      colorName: product.defaultColor.name,
      colorHex: product.defaultColor.hex,
      quantity: 1,
    })
    setAdded(true)
    toast.success('Đã thêm vào giỏ hàng', product.name)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <article
      onPointerEnter={() => prefetch(product.slug)}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-card border border-line/80 bg-surface transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-canvas">
        <img
          src={product.thumbnail}
          alt=""
          loading="lazy"
          className={cn('size-full object-cover transition-transform duration-500 group-hover:scale-105', soldOut && 'opacity-60 grayscale')}
        />
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 rounded-md bg-danger-strong px-1.5 py-0.5 text-[11px] font-bold text-white">-{product.discount}%</span>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-xs font-semibold text-white">Tạm hết hàng</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-ink">
          <Link to={`/product/${product.slug}`} className="after:absolute after:inset-0 hover:text-brand-700">
            {product.name}
          </Link>
        </h3>
        <p className="flex items-center gap-1 text-xs text-muted">
          <Star className="size-3.5 fill-star text-star" aria-hidden="true" />
          <span className="font-semibold text-ink-soft">{product.rating.toFixed(1)}</span>
          <span aria-hidden="true">·</span>
          {formatCompact(product.soldCount)} đã bán
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-brand-700 tabular-nums">{formatPrice(product.price)}</p>
            {product.originalPrice > product.price && (
              <p className="text-xs text-subtle line-through tabular-nums">{formatPrice(product.originalPrice)}</p>
            )}
          </div>
          <button
            type="button"
            onClick={quickAdd}
            disabled={soldOut}
            aria-label={`Thêm ${product.name} vào giỏ`}
            className={cn(
              'relative z-10 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] transition-[background-color,color,transform] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40',
              added ? 'bg-success text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white',
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={added ? 'ok' : 'cart'}
                initial={{ scale: 0.4, opacity: 0, rotate: added ? -30 : 0 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="inline-flex"
              >
                {added ? <Check className="size-[18px]" strokeWidth={3} /> : <ShoppingCart className="size-[18px]" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>
    </article>
  )
}
