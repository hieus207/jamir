import { Star } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useRatingSummary } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import { Stars } from '../product/ProductRating'

export function RatingSummary({ productId, className }: { productId: string; className?: string }) {
  const { data } = useRatingSummary(productId)
  if (!data) return <Skeleton className={cn('h-28', className)} />
  const max = Math.max(...data.distribution.map((d) => d.count), 1)
  return (
    <div className={cn('flex items-center gap-5 rounded-[14px] bg-canvas p-4', className)}>
      <div className="flex shrink-0 flex-col items-center gap-1">
        <p className="text-4xl leading-none font-extrabold text-ink">{data.average.toFixed(1)}</p>
        <Stars value={data.average} />
        <p className="text-xs text-muted">{data.total} đánh giá</p>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-1" aria-label="Phân bố đánh giá">
        {data.distribution.map((d) => (
          <li key={d.stars} className="flex items-center gap-2 text-xs text-muted">
            <span className="flex w-6 items-center gap-0.5 tabular-nums">
              {d.stars}
              <Star className="size-3 fill-star text-star" aria-hidden="true" />
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <span className="block h-full rounded-full bg-star" style={{ width: `${(d.count / max) * 100}%` }} />
            </span>
            <span className="w-8 text-right tabular-nums">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
