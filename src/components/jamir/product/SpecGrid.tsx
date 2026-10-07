import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { ProductSpec } from '@/types/domain'

export function SpecGrid({ specs, className }: { specs: ProductSpec[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-6', className)}>
      {specs.map((s) => (
        <div
          key={s.label}
          className="flex flex-col items-center gap-1 rounded-[14px] border border-line/80 px-1.5 py-3 text-center transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-200"
        >
          <Icon name={s.icon} className="mb-1 size-6 text-brand-600" strokeWidth={1.8} />
          <dt className="text-xs text-muted">{s.label}</dt>
          <dd className="text-sm leading-tight font-bold text-ink">{s.value}</dd>
          {s.note && <dd className="hidden text-[11px] leading-tight text-subtle sm:block">{s.note}</dd>}
        </div>
      ))}
    </dl>
  )
}
