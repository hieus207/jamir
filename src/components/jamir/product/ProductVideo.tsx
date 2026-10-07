import { useState } from 'react'
import { toast } from '@/components/ui/toast'
import { useVideoController } from '@/hooks/useVideoController'
import { cn } from '@/lib/utils'
import { useIsWishlisted, useWishlistStore } from '@/stores/wishlistStore'
import type { Product } from '@/types/domain'
import { VideoChapterList } from './VideoChapterList'
import { VideoPlayer } from './VideoPlayer'

export const scrollToSection = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export async function shareProduct(name: string) {
  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({ title: `${name} — JAMIR`, url })
      return
    }
    await navigator.clipboard.writeText(url)
    toast.success('Đã sao chép liên kết', 'Gửi cho bạn bè ngay nhé!')
  } catch {
    /* user cancelled share sheet */
  }
}

/** Player + chapter strip sharing one video controller. Remount per product (key by id). */
export function ProductVideo({
  product,
  kolCount = 0,
  className,
}: {
  product: Product
  kolCount?: number
  className?: string
}) {
  const controller = useVideoController(product.video.duration)
  const [liked, setLiked] = useState(false)
  const saved = useIsWishlisted(product.id)
  const toggleWishlist = useWishlistStore((s) => s.toggle)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <VideoPlayer
        video={product.video}
        chapters={product.chapters}
        controller={controller}
        title={product.name}
        className="-mx-4 w-[calc(100%+2rem)] md:mx-0 md:w-full md:rounded-card"
        actions={{
          liked,
          saved,
          onLike: () => setLiked((v) => !v),
          onComment: () => scrollToSection('reviews'),
          onShare: () => shareProduct(product.name),
          onSave: () => {
            const added = toggleWishlist(product.id)
            toast.success(added ? 'Đã lưu vào Yêu thích' : 'Đã bỏ khỏi Yêu thích')
          },
        }}
      />
      <VideoChapterList
        chapters={product.chapters}
        currentTime={controller.state.currentTime}
        onSelect={(c) => {
          const v = controller.videoRef.current
          if (v) v.dataset.userPaused = '0'
          controller.seek(c.start + 0.01, true)
        }}
        moreCount={kolCount}
        onMore={() => scrollToSection('kol-reviews')}
      />
    </div>
  )
}
