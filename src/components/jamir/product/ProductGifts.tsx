import { Gift } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import type { ProductGift } from '@/types/domain'

/** "Quà tặng kèm" — renders nothing when the product has no gifts. */
export function ProductGifts({ gifts, className }: { gifts?: ProductGift[]; className?: string }) {
  if (!gifts?.length) return null
  const total = gifts.reduce((s, g) => s + g.value, 0)
  return (
    <div className={cn('rounded-[14px] border border-pink-200 bg-gradient-to-r from-pink-50 to-accent-50 p-3', className)}>
      <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-pink-700">
        <Gift className="size-4" aria-hidden="true" />
        Quà tặng kèm
        <span className="ml-auto text-xs font-semibold text-pink-700/80">Trị giá {formatPrice(total)}</span>
      </p>
      <ul className="flex flex-col gap-2">
        {gifts.map((g) => (
          <li key={g.id} className="flex items-center gap-2.5">
            <img src={g.image} alt="" className="size-10 shrink-0 rounded-[10px] bg-white object-cover ring-1 ring-pink-100" />
            <span className="min-w-0 flex-1 text-sm leading-tight text-ink">{g.name}</span>
            <span className="shrink-0 text-xs text-muted line-through">{formatPrice(g.value)}</span>
            <span className="shrink-0 rounded-md bg-pink-600 px-1.5 py-0.5 text-[11px] font-bold text-white">0đ</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
