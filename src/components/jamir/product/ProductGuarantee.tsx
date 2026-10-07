import { ChevronRight } from 'lucide-react'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { Guarantee, ShippingInfo } from '@/types/domain'

export function ShippingBanner({ shipping, className }: { shipping: ShippingInfo; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-[14px] border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50/60 p-3.5', className)}>
      <Icon name={shipping.icon} className="size-7 shrink-0 fill-amber-400 text-orange-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-orange-700">{shipping.title}</p>
        <p className="text-xs text-muted">{shipping.description}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-orange-400" aria-hidden="true" />
    </div>
  )
}

export function ProductGuarantee({ guarantees, className }: { guarantees: Guarantee[]; className?: string }) {
  return (
    <ul className={cn('grid grid-cols-3 gap-2', className)}>
      {guarantees.map((g) => (
        <li key={g.title} className="flex flex-col items-center gap-1.5 rounded-[12px] bg-canvas px-2 py-2.5 text-center">
          <Icon name={g.icon} className="size-5 text-brand-600" />
          <span className="text-xs leading-tight font-semibold text-ink">{g.title}</span>
          <span className="sr-only">{g.description}</span>
        </li>
      ))}
    </ul>
  )
}
