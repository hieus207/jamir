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

/** "Đã mua hàng" badge — hidden for now (data kept); set to true to show it again. */
const SHOW_PURCHASE_BADGE = false

/**
 * Customer review. `card` = social post (landing, community); `row` = compact
 * list item ("Cảm nhận khách hàng" on product pages). Likes are buyers-only.
 */
export function ReviewCard({
  review,
  colorName,
  canLike,
  signedIn,
  variant = 'card',
  className,
}: {
  review: CustomerReview
  colorName?: string
  /** viewer bought this product (or is admin) */
  canLike?: boolean
  signedIn?: boolean
  variant?: 'card' | 'row'
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
  const row = variant === 'row'

  const avatar = review.anonymous ? (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-line-soft text-subtle', row ? 'size-8' : 'size-10')} aria-hidden="true">
      <UserRound className={row ? 'size-4' : 'size-5'} />
    </span>
  ) : (
    <Avatar src={review.user.avatar || undefined} name={review.user.name} className={row ? 'size-8' : 'size-10'} />
  )

  const likeButton = (
    <button
      type="button"
      aria-pressed={!!review.likedByMe}
      onClick={onLike}
      disabled={like.isPending}
      title={canLike ? 'Thấy hữu ích' : 'Chỉ người đã mua sản phẩm mới có thể bấm hữu ích'}
      className={cn(
        'flex cursor-pointer items-center gap-1.5 rounded-full text-xs transition-colors hover:text-brand-700',
        row ? 'py-0.5 text-muted' : 'px-2.5 py-1.5 font-semibold hover:bg-brand-50',
        review.likedByMe && 'font-semibold text-brand-700',
        !row && review.likedByMe && 'bg-brand-50',
      )}
    >
      <ThumbsUp className={cn('size-3.5', review.likedByMe && 'fill-brand-200')} aria-hidden="true" />
      {row
        ? review.helpfulCount > 0
          ? `${review.helpfulCount} người thấy hữu ích`
          : 'Hữu ích'
        : `${review.likedByMe ? 'Đã thích' : 'Thích'}${review.helpfulCount > 0 ? ` · ${review.helpfulCount}` : ''}`}
    </button>
  )

  const reply = review.reply && (
    <div className="rounded-[12px] bg-brand-50/70 p-3 text-sm">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-brand-700">
        <Store className="size-3.5" aria-hidden="true" />
        Phản hồi từ JAMIR
      </p>
      <p className="text-ink-soft">{review.reply.content}</p>
    </div>
  )

  const badge = SHOW_PURCHASE_BADGE && review.verifiedPurchase && (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-strong">
      <BadgeCheck className="size-3.5" aria-hidden="true" />
      Đã mua hàng
    </span>
  )

  if (row)
    return (
      <article className={cn('flex gap-3 border-b border-line/70 py-3.5 last:border-0', className)}>
        {avatar}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-ink">{review.user.name}</p>
            {badge}
            <time dateTime={review.createdAt} className="ml-auto text-xs text-subtle">
              {formatRelative(review.createdAt)}
            </time>
          </div>
          <div className="flex items-center gap-2 text-xs text-subtle">
            <Stars value={review.rating} size="size-3.5" />
            {colorName && <span>Phân loại: {colorName}</span>}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line text-ink-soft">{review.content}</p>
          <ReviewMedia media={review.media} author={review.user.name} />
          {reply}
          <div>{likeButton}</div>
        </div>
      </article>
    )

  return (
    <article className={cn('flex flex-col gap-3 rounded-[16px] border border-line/80 bg-surface p-4', className)}>
      <header className="flex items-start gap-3">
        {avatar}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-ink">{review.user.name}</p>
            {badge}
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
      {reply}
      <footer className="mt-auto flex items-center gap-2 border-t border-line/70 pt-2.5 text-xs text-muted">{likeButton}</footer>
    </article>
  )
}
