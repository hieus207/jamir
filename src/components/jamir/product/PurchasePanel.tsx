import { BellRing, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePurchaseActions } from '@/hooks/usePurchaseActions'
import { cn } from '@/lib/utils'
import { useSelectionStore } from '@/stores/selectionStore'
import type { Product } from '@/types/domain'
import { ProductGifts } from './ProductGifts'
import { ProductGuarantee, ShippingBanner } from './ProductGuarantee'
import { ProductInfo } from './ProductInfo'
import { ProductPrice } from './ProductPrice'
import { ProductVariant } from './ProductVariant'
import { ProductVouchers } from './ProductVouchers'
import { QuantitySelector } from './QuantitySelector'
import { WishlistButton } from './WishlistButton'

export function StockStatus({ stock, className }: { stock: number; className?: string }) {
  const tone = stock === 0 ? 'bg-danger' : stock <= 10 ? 'bg-warning' : 'bg-success'
  const text = stock === 0 ? 'Tạm hết hàng' : stock <= 10 ? `Chỉ còn ${stock} sản phẩm` : 'Còn hàng'
  return (
    <p className={cn('flex items-center gap-2 text-sm font-medium', stock === 0 ? 'text-danger' : stock <= 10 ? 'text-orange-700' : 'text-success-strong', className)}>
      <span className={cn('relative flex size-2.5 rounded-full', tone)}>
        {stock > 0 && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', tone)} />}
      </span>
      {text}
    </p>
  )
}

/**
 * Right-hand purchase panel (desktop: sticky). On mobile the same blocks are
 * rendered inline and the CTA moves to the sticky bottom bar.
 */
export function PurchasePanel({
  product,
  inline,
  headingLevel = 'h2',
  className,
}: {
  product: Product
  /** inline (< lg): CTA row lives in the sticky bottom bar instead. */
  inline?: boolean
  headingLevel?: 'h1' | 'h2'
  className?: string
}) {
  const { colorId, quantity, setColor, setQuantity } = useSelectionStore()
  const actions = usePurchaseActions(product)

  return (
    <Card className={cn('flex flex-col gap-4 p-5 lg:p-6', className)}>
      {inline ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold tracking-tight text-ink">Thông tin đặt hàng</h2>
          <div className="flex items-center gap-3">
            <img src={product.thumbnail} alt="" className="size-16 shrink-0 rounded-[12px] bg-canvas object-cover" />
            <p className="line-clamp-2 text-[15px] leading-snug font-semibold text-ink">{product.name}</p>
          </div>
        </div>
      ) : (
        <ProductInfo product={product} headingLevel={headingLevel} />
      )}
      <div className="flex flex-col gap-2">
        <ProductPrice price={product.price} originalPrice={product.originalPrice} discount={product.discount} />
        <StockStatus stock={product.stock} />
      </div>
      <ProductGifts gifts={product.gifts} />
      <ProductVouchers productId={product.id} />
      <ProductVariant colors={product.colors} value={colorId} onChange={setColor} />
      <div className="flex items-center gap-4">
        <span className="w-20 shrink-0 text-sm font-medium text-ink-soft">Số lượng:</span>
        <QuantitySelector value={quantity} onChange={setQuantity} max={Math.max(1, Math.min(product.stock, 99))} />
      </div>
      <div className={cn('flex gap-2.5', inline && 'hidden')}>
        {actions.inStock ? (
          <>
            <Button size="lg" className="h-[52px] flex-1 text-[17px]" onClick={actions.buyNow}>
              <ShoppingCart aria-hidden="true" />
              Đặt hàng ngay
            </Button>
            <Button variant="secondary" size="icon" className="size-[52px]" aria-label="Thêm vào giỏ hàng" onClick={actions.addToCart}>
              <ShoppingCart className="size-6" />
            </Button>
          </>
        ) : (
          <Button variant="dark" size="lg" className="h-[52px] flex-1" onClick={actions.notifyRestock}>
            <BellRing aria-hidden="true" />
            Báo khi có hàng
          </Button>
        )}
        <WishlistButton productId={product.id} onToggle={actions.toggleWishlist} />
      </div>
      {inline && actions.inStock && (
        <Button variant="outline" size="md" className="w-full" onClick={actions.addToCart}>
          <ShoppingCart aria-hidden="true" />
          Thêm vào giỏ hàng
        </Button>
      )}
      <ShippingBanner shipping={product.shipping} />
      <ProductGuarantee guarantees={product.guarantees} />
    </Card>
  )
}
