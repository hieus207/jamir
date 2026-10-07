import { BadgeCheck, Eye, Heart, Play } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { cn, formatCompact, formatDuration, formatRelative } from '@/lib/utils'
import type { KolReview } from '@/types/domain'
import { aspectValue, isVertical, KolMediaPlayer, SourceBadge } from './KolMedia'

/**
 * KOL video viewer: large Dialog on desktop, near-full-screen bottom sheet on mobile.
 * `playlist` lets the viewer jump to other videos without closing.
 */
export function KolVideoViewer({
  review,
  playlist,
  onChange,
  onClose,
}: {
  review: KolReview | null
  playlist: KolReview[]
  onChange: (r: KolReview) => void
  onClose: () => void
}) {
  const isDesktop = useIsDesktop()
  const open = review !== null
  // keep rendering the last video while the close animation runs
  const lastRef = useRef<KolReview | null>(null)
  if (review) lastRef.current = review
  const shown = review ?? lastRef.current

  if (isDesktop)
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="flex w-auto max-w-[min(1120px,calc(100vw-4rem))] flex-row bg-ink text-white">
          {shown && (
            <>
              {/* frame follows the clip: tall for TikTok 9:16, wide for 16:9 */}
              <KolMediaPlayer
                review={shown}
                className={cn('shrink', isVertical(shown.aspectRatio) ? 'h-[min(84dvh,780px)]' : 'w-[min(760px,calc(100vw-26rem))]')}
                style={{ aspectRatio: aspectValue(shown.aspectRatio) }}
              />
              <ViewerInfo review={shown} playlist={playlist} onChange={onChange} className="max-h-[min(84dvh,780px)] w-80 shrink-0" Title={DialogTitle} Description={DialogDescription} />
            </>
          )}
        </DialogContent>
      </Dialog>
    )

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[calc(96dvh+3rem)] bg-ink text-white [&>div:first-child>div]:bg-white/30">
        {shown && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            <KolMediaPlayer
              review={shown}
              className={cn('w-full shrink-0', isVertical(shown.aspectRatio) ? 'h-[68dvh]' : 'aspect-video')}
            />
            <ViewerInfo review={shown} playlist={playlist} onChange={onChange} Title={DrawerTitle} Description={DrawerDescription} />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}

function ViewerInfo({
  review,
  playlist,
  onChange,
  className,
  Title,
  Description,
}: {
  review: KolReview
  playlist: KolReview[]
  onChange: (r: KolReview) => void
  className?: string
  Title: typeof DialogTitle
  Description: typeof DialogDescription
}) {
  const others = playlist.filter((p) => p.id !== review.id)
  return (
    <div className={cn('flex min-h-0 flex-col gap-4 p-5', className)}>
      <div className="flex items-center gap-3 pr-10">
        <Avatar src={review.kol.avatar} name={review.kol.name} className="size-11 ring-2 ring-white/20" />
        <div className="min-w-0">
          <p className="flex items-center gap-1 font-semibold">
            {review.kol.name}
            <BadgeCheck className="size-4 fill-brand-500 text-ink" aria-label="Đã xác minh" />
          </p>
          <p className="text-xs text-white/60">
            {formatCompact(review.kol.followers ?? 0)} người theo dõi · {review.kol.title}
          </p>
        </div>
      </div>
      <Button variant="primary" size="sm" className="self-start" disabled>
        Theo dõi
      </Button>
      <div>
        <SourceBadge source={review.source} className="mb-1.5" />
        <Title className="text-base leading-snug font-bold text-white">{review.title}</Title>
        <Description className="mt-1.5 flex items-center gap-3 text-xs text-white/60">
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden="true" />
            {formatCompact(review.views)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="size-3.5" aria-hidden="true" />
            {formatCompact(review.likes)}
          </span>
          <span>{formatRelative(review.publishedAt)}</span>
        </Description>
      </div>
      {others.length > 0 && (
        <div className="flex min-h-0 flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-white/50 uppercase">Video khác</p>
          <ul className="flex min-h-0 flex-col gap-2 overflow-y-auto pr-1">
            {others.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onChange(o)}
                  className="flex w-full cursor-pointer gap-3 rounded-[12px] p-1.5 text-left transition-colors hover:bg-white/10"
                >
                  <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-[10px] bg-white/10">
                    <img src={o.thumbnail} alt="" loading="lazy" className="size-full object-cover" />
                    <Play className="absolute inset-0 m-auto size-5 fill-white text-white" aria-hidden="true" />
                    <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-[10px]">{formatDuration(o.duration)}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[13px] font-semibold">{o.title}</span>
                    <span className="mt-0.5 block text-xs text-white/55">{o.kol.name}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
