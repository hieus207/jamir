import { Star } from 'lucide-react'
import { cn, formatCompact } from '@/lib/utils'

export function Stars({ value, className, size = 'size-4' }: { value: number; className?: string; size?: string }) {
  return (
    <span className={cn('relative inline-flex', className)} role="img" aria-label={`${value} trên 5 sao`}>
      <span className="flex gap-0.5 text-line" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={cn(size, 'fill-current')} />
        ))}
      </span>
      <span
        className="absolute inset-0 flex gap-0.5 overflow-hidden text-star"
        style={{ width: `${(value / 5) * 100}%` }}
        aria-hidden="true"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={cn(size, 'shrink-0 fill-current')} />
        ))}
      </span>
    </span>
  )
}

export function ProductRating({
  rating,
  reviewCount,
  soldCount,
  onReviewsClick,
  className,
}: {
  rating: number
  reviewCount: number
  soldCount: number
  onReviewsClick?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-sm', className)}>
      <span className="flex items-center gap-1.5">
        <span className="font-bold text-ink">{rating.toFixed(1)}</span>
        <Stars value={rating} />
      </span>
      <button type="button" onClick={onReviewsClick} className="cursor-pointer text-muted underline-offset-2 hover:text-brand-700 hover:underline">
        {reviewCount} đánh giá
      </button>
      <span className="h-3.5 w-px bg-line" aria-hidden="true" />
      <span className="text-muted">{formatCompact(soldCount)} lượt bán</span>
    </div>
  )
}
