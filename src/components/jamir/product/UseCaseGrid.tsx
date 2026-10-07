import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { UseCase } from '@/types/domain'

/**
 * "Phù hợp với bạn nếu"
 * - `full`   : image cards (mobile scroll / tablet 2 cols / desktop 3 cols)
 * - `compact`: icon tiles for the desktop right column (as in the reference design)
 */
export function UseCaseGrid({
  useCases,
  variant = 'full',
  className,
}: {
  useCases: UseCase[]
  variant?: 'full' | 'compact'
  className?: string
}) {
  if (variant === 'compact')
    return (
      <Card className={className}>
        <CardHeader className="pt-4">
          <CardTitle className="text-base md:text-lg">Phù hợp với bạn nếu</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <ul className="grid grid-cols-4 gap-2">
            {useCases.slice(0, 8).map((u) => (
              <li key={u.id} className="group flex flex-col items-center gap-1.5 rounded-[12px] px-1 py-2 text-center transition-colors hover:bg-brand-50" title={u.description}>
                <span className="flex size-11 items-center justify-center rounded-[12px] bg-brand-50 text-brand-600 transition-transform group-hover:-translate-y-0.5">
                  <Icon name={u.icon} className="size-6" strokeWidth={1.8} />
                </span>
                <span className="text-[11px] leading-tight font-medium text-ink-soft">{u.title}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Phù hợp với bạn nếu</CardTitle>
      </CardHeader>
      <CardContent>
        <ul tabIndex={0} aria-label="Đối tượng phù hợp" className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {useCases.map((u) => (
            <li
              key={u.id}
              className="group w-[62%] shrink-0 snap-start overflow-hidden rounded-[14px] border border-line/80 bg-surface transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card sm:w-auto"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-line-soft">
                <img src={u.image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute bottom-2 left-2 flex size-9 items-center justify-center rounded-[10px] bg-white/95 text-brand-600 shadow-sm">
                  <Icon name={u.icon} className="size-5" />
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-ink">{u.title}</p>
                <p className={cn('mt-0.5 text-xs leading-relaxed text-muted')}>{u.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
