import { formatPrice } from '@/lib/utils'
import type { CheckoutLine } from '@/stores/checkoutStore'
import { QuantitySelector } from '../product/QuantitySelector'

/** Items in the order: thumbnail, name, color, quantity stepper, line total. */
export function ProductSummary({
  lines,
  onQuantityChange,
}: {
  lines: CheckoutLine[]
  onQuantityChange: (index: number, quantity: number) => void
}) {
  return (
    <ul className="flex flex-col gap-3">
      {lines.map((l, i) => (
        <li key={`${l.product.id}-${l.colorId}`} className="flex gap-3">
          <img src={l.product.thumbnail} alt="" className="size-[72px] shrink-0 rounded-[12px] bg-canvas object-cover" />
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
            <div>
              <p className="truncate text-sm font-semibold text-ink">{l.product.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <span className="size-3 rounded-full ring-1 ring-line" style={{ backgroundColor: l.colorHex }} aria-hidden="true" />
                Màu: {l.colorName}
              </p>
              {!!l.product.gifts?.length && (
                <p className="mt-0.5 text-xs font-medium text-pink-700">🎁 Tặng: {l.product.gifts.join(', ')}</p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <QuantitySelector
                size="sm"
                value={l.quantity}
                max={Math.max(1, Math.min(l.product.stock, 99))}
                onChange={(q) => onQuantityChange(i, q)}
                label={`Số lượng ${l.product.name}`}
              />
              <span className="text-sm font-bold text-ink tabular-nums">{formatPrice(l.product.price * l.quantity)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
