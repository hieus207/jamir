import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsWishlisted } from '@/stores/wishlistStore'

/** Heart toggle with a quick scale "pop" when added. */
export function WishlistButton({
  productId,
  onToggle,
  className,
}: {
  productId: string
  onToggle: () => void
  className?: string
}) {
  const active = useIsWishlisted(productId)
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? 'Bỏ khỏi Yêu thích' : 'Thêm vào Yêu thích'}
      className={cn(
        'inline-flex size-[52px] shrink-0 cursor-pointer items-center justify-center rounded-btn border bg-surface transition-[border-color,background-color,transform] active:scale-95',
        active ? 'border-danger/30 bg-danger-50' : 'border-line hover:border-brand-300',
        className,
      )}
    >
      <span key={String(active)} className={cn('inline-flex', active && 'animate-pop')}>
        <Heart className={cn('size-6', active ? 'fill-danger text-danger' : 'text-brand-600')} aria-hidden="true" />
      </span>
    </button>
  )
}
