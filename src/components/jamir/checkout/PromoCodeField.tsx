import { TicketPercent, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useVouchers } from '@/hooks/queries'
import { cn, formatPrice } from '@/lib/utils'
import { validatePromotion } from '@/services'
import { useSavedVoucher } from '@/stores/checkoutStore'
import type { PromotionCheck } from '@/types/domain'
import { VoucherChip } from '../product/ProductVouchers'

/**
 * Promo code input + available vouchers. Validates against the server and
 * re-validates whenever the items / shipping fee change. The code saved on a
 * product page is applied automatically.
 */
export function PromoCodeField({
  items,
  shippingFee,
  applied,
  onChange,
}: {
  items: { productId: string; quantity: number }[]
  shippingFee: number
  applied: PromotionCheck | null
  onChange: (p: PromotionCheck | null) => void
}) {
  const { code: savedCode, save } = useSavedVoucher()
  const { data: vouchers } = useVouchers()
  const [value, setValue] = useState(savedCode ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const itemsKey = JSON.stringify(items)
  const productIds = items.map((i) => i.productId)
  const usable = vouchers?.filter((v) => !v.productIds?.length || v.productIds.some((id) => productIds.includes(id)))

  const apply = async (code: string, silent = false) => {
    const c = code.trim().toUpperCase()
    if (!c) return
    setLoading(true)
    setError(null)
    try {
      const res = await validatePromotion(c, items, shippingFee)
      if (res.valid) {
        onChange(res)
        setValue(res.code)
        save(res.code)
      } else {
        onChange(null)
        if (!silent) setError(res.message)
      }
    } catch {
      if (!silent) setError('Không kiểm tra được mã, thử lại sau')
    } finally {
      setLoading(false)
    }
  }

  // auto-apply the saved voucher once
  const autoApplied = useRef(false)
  useEffect(() => {
    if (!autoApplied.current && savedCode) {
      autoApplied.current = true
      void apply(savedCode, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCode])

  // keep the discount right when quantities / shipping change
  useEffect(() => {
    if (applied) void apply(applied.code, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, shippingFee])

  const remove = () => {
    onChange(null)
    setValue('')
    setError(null)
    save(null)
  }

  return (
    <div className="flex flex-col gap-2.5">
      {applied ? (
        <div className="flex items-center gap-3 rounded-btn border border-success/40 bg-success-50 p-3">
          <TicketPercent className="size-5 shrink-0 text-success-strong" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-bold text-success-strong">{applied.code}</p>
            <p className="truncate text-xs text-muted">
              {applied.freeShipping ? 'Miễn phí vận chuyển' : `Giảm ${formatPrice(applied.discount)}`} · {applied.message}
            </p>
          </div>
          <button type="button" aria-label="Bỏ mã" onClick={remove} className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-white hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value.toUpperCase())
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void apply(value)
              }
            }}
            placeholder="Nhập mã giảm giá"
            aria-label="Mã giảm giá"
            aria-invalid={!!error}
            className={cn(
              'h-11 min-w-0 flex-1 rounded-btn border border-line bg-surface px-3.5 text-sm font-semibold tracking-wide uppercase placeholder:font-normal placeholder:tracking-normal placeholder:normal-case placeholder:text-subtle focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none',
              error && 'border-danger',
            )}
          />
          <Button variant="secondary" loading={loading} disabled={!value.trim()} onClick={() => apply(value)}>
            Áp dụng
          </Button>
        </div>
      )}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      {!applied && !!usable?.length && (
        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {usable.map((v) => (
            <VoucherChip key={v.id} voucher={v} onSelect={() => apply(v.code)} />
          ))}
        </div>
      )}
    </div>
  )
}
