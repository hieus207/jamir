import { BadgeCheck, Play } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { cn, formatCompact, formatDuration } from '@/lib/utils'
import type { KolReview } from '@/types/domain'

export function KolReviewCard({ review, onOpen, className }: { review: KolReview; onOpen: () => void; className?: string }) {
  return (
    <article className={cn('group flex flex-col gap-2.5', className)}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Xem video: ${review.title}`}
        className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-[14px] bg-line-soft"
      >
        <img
          src={review.thumbnail}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-12 items-center justify-center rounded-full border-2 border-white/90 bg-black/30 text-white backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
            <Play className="size-5 translate-x-0.5 fill-white" aria-hidden="true" />
          </span>
        </span>
        <span className="absolute right-2 bottom-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums">
          {formatDuration(review.duration)}
        </span>
      </button>
      <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-ink">
        <button type="button" onClick={onOpen} className="cursor-pointer text-left hover:text-brand-700">
          {review.title}
        </button>
      </h3>
      <div className="flex items-center gap-2">
        <Avatar src={review.kol.avatar} name={review.kol.name} className="size-8" />
        <div className="min-w-0 text-xs">
          <p className="flex items-center gap-1 font-semibold text-ink">
            <span className="truncate">{review.kol.name}</span>
            {review.kol.verified && <BadgeCheck className="size-3.5 shrink-0 fill-brand-600 text-white" aria-label="Đã xác minh" />}
          </p>
          <p className="truncate text-muted">
            {formatCompact(review.views)} lượt xem · {review.kol.title}
          </p>
        </div>
      </div>
    </article>
  )
}
