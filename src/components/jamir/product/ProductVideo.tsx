import { useState } from 'react'
import { toast } from '@/components/ui/toast'
import { useVideoController } from '@/hooks/useVideoController'
import { cn } from '@/lib/utils'
import { useIsWishlisted, useWishlistStore } from '@/stores/wishlistStore'
import type { Product } from '@/types/domain'
import { SourceBadge } from '../review/KolMedia'
import { normalizeEmbedUrl } from '@/lib/video'
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

  const [start, setStart] = useState<number | null>(null)

  // YouTube / TikTok / Facebook video chosen in the admin
  if (product.video.embedUrl) {
    const vertical = product.video.aspectRatio === '9:16' || product.video.aspectRatio === '4:5'
    const yt = product.video.source === 'youtube'
    const base = normalizeEmbedUrl(product.video.embedUrl)!
    const src = yt && start !== null ? `${base}&start=${Math.floor(start)}&autoplay=1` : base
    return (
      <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative isolate -mx-4 aspect-video w-[calc(100%+2rem)] overflow-hidden bg-black md:mx-0 md:w-full md:rounded-card">
        <img src={product.video.poster || product.thumbnail} alt="" aria-hidden="true" className="absolute inset-0 -z-10 size-full scale-110 object-cover opacity-50 blur-2xl" />
        <iframe
          key={src}
          src={src}
          title={product.name}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          className={cn('border-0', vertical ? 'mx-auto block aspect-[9/16] h-full' : 'size-full')}
        />
        {product.video.source && <SourceBadge source={product.video.source} className="absolute top-3 left-3" />}
      </div>
      {product.chapters.length > 0 && (
        <VideoChapterList
          chapters={product.chapters}
          currentTime={start ?? -1}
          onSelect={(c) => (yt ? setStart(c.start) : undefined)}
          moreCount={kolCount}
          onMore={() => scrollToSection('kol-reviews')}
        />
      )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <VideoPlayer
        video={product.video}
        chapters={product.chapters}
        controller={controller}
        title={product.name}
        fallbackImage={product.gallery[0] ?? product.thumbnail}
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
