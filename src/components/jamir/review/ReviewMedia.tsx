import { Play } from 'lucide-react'
import { useState } from 'react'
import { Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ReviewMedia as Media } from '@/types/domain'

/** Thumbnail strip; opens a swipeable lightbox carousel. */
export function ReviewMedia({ media, author, className }: { media: Media[]; author: string; className?: string }) {
  const [start, setStart] = useState<number | null>(null)
  if (!media.length) return null
  const visible = media.slice(0, 4)
  return (
    <>
      <ul className={cn('flex gap-1.5', className)}>
        {visible.map((m, i) => {
          const rest = media.length - visible.length
          return (
            <li key={i} className="w-1/4 max-w-20">
              <button
                type="button"
                onClick={() => setStart(i)}
                aria-label={`Xem ${m.type === 'video' ? 'video' : 'ảnh'} ${i + 1} của ${author}`}
                className="relative block aspect-square w-full cursor-pointer overflow-hidden rounded-[10px] bg-line-soft"
              >
                <img src={m.thumbnail} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 hover:scale-105" />
                {m.type === 'video' && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="flex size-7 items-center justify-center rounded-full bg-black/55">
                      <Play className="size-3.5 translate-x-px fill-white text-white" aria-hidden="true" />
                    </span>
                  </span>
                )}
                {i === visible.length - 1 && rest > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white">+{rest}</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
      <Dialog open={start !== null} onOpenChange={(o) => !o && setStart(null)}>
        <DialogContent className="max-w-3xl bg-ink p-0">
          <DialogTitle className="sr-only">Ảnh và video từ {author}</DialogTitle>
          {start !== null && (
            <Carousel opts={{ startIndex: start, loop: media.length > 1 }} className="pb-4">
              <CarouselContent className="ml-0">
                {media.map((m, i) => (
                  <CarouselItem key={i} className="pl-0">
                    <div className="flex aspect-square max-h-[78dvh] w-full items-center justify-center bg-black md:aspect-[4/3]">
                      {m.type === 'video' ? (
                        <video src={m.src} poster={m.thumbnail} controls playsInline muted className="max-h-full max-w-full" />
                      ) : (
                        <img src={m.src} alt={`Ảnh ${i + 1} từ ${author}`} className="max-h-full max-w-full object-contain" />
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-3" />
              <CarouselNext className="right-3" />
              <CarouselDots className="mt-3 [&_button:not([aria-current=true])]:bg-white/30" />
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
