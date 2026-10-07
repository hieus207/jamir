import { Music2, Play } from 'lucide-react'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { KolReview, VideoAspect, VideoSource } from '@/types/domain'

/** '9:16' → 0.5625 (width / height) */
export const aspectValue = (a: VideoAspect) => {
  const [w, h] = a.split(':').map(Number)
  return w! / h!
}
export const isVertical = (a: VideoAspect) => aspectValue(a) < 1

const SOURCE: Record<Exclude<VideoSource, 'jamir'>, { label: string; className: string; icon: typeof Play }> = {
  tiktok: { label: 'TikTok', className: 'bg-black/75 text-white', icon: Music2 },
  youtube: { label: 'YouTube', className: 'bg-[#cc0000] text-white', icon: Play },
  facebook: { label: 'Facebook', className: 'bg-[#1877f2] text-white', icon: Play },
}

export function SourceBadge({ source, className }: { source: VideoSource; className?: string }) {
  if (source === 'jamir') return null
  const s = SOURCE[source]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold backdrop-blur', s.className, className)}>
      <s.icon className="size-3" aria-hidden="true" />
      {s.label}
    </span>
  )
}

/**
 * Plays a KOL clip in its native frame (vertical or horizontal) without cropping:
 * the clip is letterboxed over a blurred copy of its thumbnail.
 * Platform embeds (TikTok/YouTube) render as an iframe.
 */
export function KolMediaPlayer({ review, className, style }: { review: KolReview; className?: string; style?: CSSProperties }) {
  return (
    <div className={cn('relative isolate overflow-hidden bg-black', className)} style={style}>
      <img src={review.thumbnail} alt="" aria-hidden="true" className="absolute inset-0 -z-1 size-full scale-110 object-cover opacity-50 blur-2xl" />
      {review.embedUrl ? (
        <iframe
          key={review.id}
          src={review.embedUrl}
          title={review.title}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          className="size-full border-0"
        />
      ) : (
        <video
          key={review.id}
          src={review.videoSrc}
          poster={review.thumbnail}
          controls
          autoPlay
          muted
          playsInline
          className="size-full object-contain"
        />
      )}
    </div>
  )
}
