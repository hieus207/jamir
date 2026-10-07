import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Ellipsis, Flag, Store, ThumbsUp, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'
import { cn, formatRelative } from '@/lib/utils'
import { ApiError, likeReview } from '@/services'
import type { CustomerReview } from '@/types/domain'
import { useAuthDialog } from '../auth/authStore'
import { Stars } from '../product/ProductRating'
import { ReviewMedia } from './ReviewMedia'

/**
 * Customer review as a social post: who (full name / nickname / masked), when,
 * what they bought, the story, photos, the shop's reply — and a like that only
 * buyers can give.
 */
export function ReviewCard({
  review,
  colorName,
  canLike,
  signedIn,
  className,
}: {
  review: CustomerReview
  colorName?: string
  /** viewer bought this product (or is admin) */
  canLike?: boolean
  signedIn?: boolean
  className?: string
}) {
  const qc = useQueryClient()
  const showAuth = useAuthDialog((s) => s.show)
  const like = useMutation({
    mutationFn: () => likeReview(review.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews', review.productId] }),
    onError: (e) => toast.error('Không thích được', e instanceof ApiError ? e.message : undefined),
  })
  const onLike = () => {
    if (!signedIn) {
      toast.info('Đăng nhập để thích đánh giá', 'Chỉ khách đã mua sản phẩm mới có thể thích và đánh giá.')
      showAuth('login')
    } else if (!canLike) toast.info('Chỉ dành cho người đã mua', 'Mua sản phẩm này để thích và viết đánh giá nhé.')
    else like.mutate()
  }

  return (
    <article className={cn('flex flex-col gap-3 rounded-[16px] border border-line/80 bg-surface p-4', className)}>
      <header className="flex items-start gap-3">
        {review.anonymous ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-line-soft text-subtle" aria-hidden="true">
            <UserRound className="size-5" />
          </span>
        ) : (
          <Avatar src={review.user.avatar || undefined} name={review.user.name} className="size-10" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-ink">{review.user.name}</p>
            {review.verifiedPurchase && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-strong">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                Đã mua hàng
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-subtle">
            <time dateTime={review.createdAt}>{formatRelative(review.createdAt)}</time>
            {colorName && <> · Phân loại: {colorName}</>}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Tùy chọn" className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-line-soft">
            <Ellipsis className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => toast.info('Đã gửi báo cáo', 'Cảm ơn bạn đã giúp cộng đồng JAMIR.')}>
              <Flag />
              Báo cáo đánh giá
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <Stars value={review.rating} size="size-4" />
      <p className="text-sm leading-relaxed whitespace-pre-line text-ink-soft">{review.content}</p>
      <ReviewMedia media={review.media} author={review.user.name} />

      {review.reply && (
        <div className="rounded-[12px] bg-brand-50/70 p-3 text-sm">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-brand-700">
            <Store className="size-3.5" aria-hidden="true" />
            Phản hồi từ JAMIR
          </p>
          <p className="text-ink-soft">{review.reply.content}</p>
        </div>
      )}

      <footer className="mt-auto flex items-center gap-2 border-t border-line/70 pt-2.5 text-xs text-muted">
        <button
          type="button"
          aria-pressed={!!review.likedByMe}
          onClick={onLike}
          disabled={like.isPending}
          title={canLike ? 'Thích đánh giá này' : 'Chỉ người đã mua sản phẩm mới có thể thích'}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 font-semibold transition-colors hover:bg-brand-50 hover:text-brand-700',
            review.likedByMe && 'bg-brand-50 text-brand-700',
            signedIn && !canLike && 'opacity-60',
          )}
        >
          <ThumbsUp className={cn('size-4', review.likedByMe && 'fill-brand-200')} aria-hidden="true" />
          {review.likedByMe ? 'Đã thích' : 'Thích'}
          {review.helpfulCount > 0 && <span className="tabular-nums">· {review.helpfulCount}</span>}
        </button>
      </footer>
    </article>
  )
}
