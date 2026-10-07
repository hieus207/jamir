import { formatPrice } from '@/lib/utils'

export function OrderSummary({
  subtotal,
  shippingFee,
  savings,
  promo,
}: {
  subtotal: number
  /** fee after any free-shipping voucher */
  shippingFee: number
  savings: number
  /** applied voucher; `discount` is subtracted from the total (0 for free shipping) */
  promo?: { code: string; discount: number; freeShipping: boolean }
}) {
  const discount = promo?.discount ?? 0
  const total = subtotal + shippingFee - discount
  return (
    <dl className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between text-muted">
        <dt>Tạm tính</dt>
        <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
      </div>
      <div className="flex justify-between text-muted">
        <dt>Phí vận chuyển</dt>
        <dd className="tabular-nums">{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</dd>
      </div>
      {promo && (
        <div className="flex justify-between text-success-strong">
          <dt>Mã {promo.code}</dt>
          <dd className="tabular-nums">{promo.freeShipping ? 'Freeship' : `-${formatPrice(discount)}`}</dd>
        </div>
      )}
      {savings > 0 && (
        <div className="flex justify-between text-success-strong">
          <dt>Tiết kiệm so với giá gốc</dt>
          <dd className="tabular-nums">-{formatPrice(savings)}</dd>
        </div>
      )}
      <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
        <dt className="font-semibold text-ink">Tổng tiền</dt>
        <dd className="text-xl font-extrabold text-brand-700 tabular-nums">{formatPrice(total)}</dd>
      </div>
    </dl>
  )
}
