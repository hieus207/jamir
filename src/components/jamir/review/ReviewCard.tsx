import { BadgeCheck, Ellipsis, Flag, MessageSquare, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'
import { cn, formatRelative } from '@/lib/utils'
import type { CustomerReview } from '@/types/domain'
import { Stars } from '../product/ProductRating'
import { ReviewMedia } from './ReviewMedia'

export function ReviewCard({ review, colorName, className }: { review: CustomerReview; colorName?: string; className?: string }) {
  const [helpful, setHelpful] = useState(false)
  return (
    <article className={cn('flex flex-col gap-3 rounded-[14px] border border-line/80 bg-surface p-4', className)}>
      <header className="flex items-start gap-3">
        <Avatar src={review.user.avatar} name={review.user.name} className="size-10" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-ink">{review.user.name}</p>
            {review.verifiedPurchase && (
              <Badge variant="soft" size="sm">
                <BadgeCheck aria-hidden="true" />
                Đã mua
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-subtle">
            <Stars value={review.rating} size="size-3.5" />
            <time dateTime={review.createdAt}>{formatRelative(review.createdAt)}</time>
          </div>
        </div>
      </header>
      <p className="text-sm leading-relaxed text-ink-soft">{review.content}</p>
      {colorName && <p className="-mt-1 text-xs text-subtle">Phân loại: {colorName}</p>}
      <ReviewMedia media={review.media} author={review.user.name} />
      <footer className="mt-auto flex items-center gap-4 pt-1 text-xs text-muted">
        <button
          type="button"
          aria-pressed={helpful}
          onClick={() => setHelpful((v) => !v)}
          className={cn('flex cursor-pointer items-center gap-1.5 transition-colors hover:text-brand-700', helpful && 'font-semibold text-brand-700')}
        >
          <ThumbsUp className={cn('size-4', helpful && 'fill-brand-100')} aria-hidden="true" />
          Hữu ích ({review.helpfulCount + (helpful ? 1 : 0)})
        </button>
        <span className="flex items-center gap-1.5">
          <MessageSquare className="size-4" aria-hidden="true" />
          Bình luận ({review.commentCount})
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Tùy chọn" className="ml-auto inline-flex size-7 cursor-pointer items-center justify-center rounded-md hover:bg-line-soft">
            <Ellipsis className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => toast.info('Đã gửi báo cáo', 'Cảm ơn bạn đã giúp cộng đồng JAMIR.')}>
              <Flag />
              Báo cáo đánh giá
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>
    </article>
  )
}
