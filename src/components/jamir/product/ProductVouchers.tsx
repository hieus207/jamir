import { Check, TicketPercent } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { useVouchers } from '@/hooks/queries'
import { cn, formatCompact } from '@/lib/utils'
import { useSavedVoucher } from '@/stores/checkoutStore'
import type { Voucher } from '@/types/domain'

export const voucherTitle = (v: Voucher) =>
  v.type === 'freeship'
    ? 'Miễn phí vận chuyển'
    : v.type === 'percent'
      ? `Giảm ${v.value}%${v.maxDiscount ? ` tối đa ${formatCompact(v.maxDiscount)}` : ''}`
      : `Giảm ${formatCompact(v.value)}`

/** Ticket-style voucher chip. */
export function VoucherChip({ voucher, selected, onSelect }: { voucher: Voucher; selected?: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={voucher.description}
      className={cn(
        'relative flex shrink-0 cursor-pointer items-center gap-2 rounded-[10px] border border-dashed py-1.5 pr-3 pl-2 text-left transition-colors',
        selected ? 'border-brand-600 bg-brand-50' : 'border-danger/40 bg-danger-50/60 hover:border-danger',
      )}
    >
      <TicketPercent className={cn('size-5 shrink-0', selected ? 'text-brand-600' : 'text-danger')} aria-hidden="true" />
      <span className="min-w-0">
        <span className={cn('block text-xs font-bold', selected ? 'text-brand-700' : 'text-danger-strong')}>{voucherTitle(voucher)}</span>
        <span className="block text-[11px] text-muted">
          {voucher.code}
          {voucher.minOrder > 0 && ` · Đơn từ ${formatCompact(voucher.minOrder)}`}
          {voucher.remaining !== undefined && ` · Còn ${voucher.remaining} lượt`}
        </span>
      </span>
      {selected && <Check className="size-4 shrink-0 text-brand-600" aria-label="Đã lưu" />}
    </button>
  )
}

/** Vouchers usable for this product — tap to save; applied automatically at checkout. */
export function ProductVouchers({ productId, className }: { productId: string; className?: string }) {
  const { data } = useVouchers(productId)
  const { code, save } = useSavedVoucher()
  if (!data?.length) return null
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="text-sm font-medium text-ink-soft">Mã giảm giá:</p>
      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" data-swipe-ignore>
        {data.map((v) => (
          <VoucherChip
            key={v.id}
            voucher={v}
            selected={code === v.code}
            onSelect={() => {
              const next = code === v.code ? null : v.code
              save(next)
              if (next) toast.success(`Đã lưu mã ${v.code}`, 'Mã sẽ tự áp dụng khi bạn thanh toán.')
            }}
          />
        ))}
      </div>
    </div>
  )
}
