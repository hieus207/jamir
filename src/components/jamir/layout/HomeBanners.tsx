import Autoplay from 'embla-carousel-autoplay'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselDots, CarouselItem } from '@/components/ui/carousel'
import { Skeleton } from '@/components/ui/skeleton'
import { useBanners, useKolFeed } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import type { HomeBanner, KolReview } from '@/types/domain'
import { KolVideoViewer } from '../review/KolVideoViewer'

/** Where a banner's button goes (same targets as event popups). */
const href = (b: HomeBanner) => {
  const { type, value } = b.target
  if (type === 'product') return `/product/${value}`
  if (type === 'news') return `/news/${value}`
  return value
}

/** Home hero banners (admin → Banner trang chủ): auto-advancing slider. */
export function HomeBanners({ className }: { className?: string }) {
  const { data, isPending } = useBanners()
  const kol = useKolFeed()
  const [video, setVideo] = useState<KolReview | null>(null)

  if (isPending) return <Skeleton className={cn('aspect-[16/10] rounded-card sm:aspect-[16/7] lg:aspect-[16/6]', className)} />
  if (!data?.length) return null

  const cta = (b: HomeBanner) => {
    const cls = buttonVariants({ variant: 'primary', size: 'md', className: 'w-fit' })
    const label = (
      <>
        {b.ctaText || 'Xem ngay'}
        <ArrowRight aria-hidden="true" />
      </>
    )
    if (b.target.type === 'video')
      return (
        <button type="button" className={cls} onClick={() => setVideo(kol.data?.find((v) => v.id === b.target.value) ?? null)}>
          {label}
        </button>
      )
    const to = href(b)
    if (/^https?:\/\//.test(to))
      return (
        <a href={to} target="_blank" rel="noreferrer" className={cls}>
          {label}
        </a>
      )
    return (
      <Link to={to} className={cls}>
        {label}
      </Link>
    )
  }

  return (
    <>
      <Carousel
        opts={{ loop: data.length > 1 }}
        plugins={data.length > 1 ? [Autoplay({ delay: 5000, stopOnInteraction: true })] : undefined}
        aria-label="Ưu đãi nổi bật"
        className={className}
      >
        <CarouselContent>
          {data.map((b, i) => (
            <CarouselItem key={b.id}>
              <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-ink sm:aspect-[16/7] lg:aspect-[16/6]">
                <picture>
                  {b.mobileImage && <source media="(max-width: 639px)" srcSet={b.mobileImage} />}
                  <img
                    src={b.image}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                    fetchPriority={i === 0 ? 'high' : 'low'}
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </picture>
                {b.overlay !== false && <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />}
                <div className="relative flex h-full max-w-xl flex-col justify-end gap-3 p-5 text-white sm:justify-center sm:p-10">
                  {b.eyebrow && <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">{b.eyebrow}</span>}
                  {b.title && <h2 className="text-2xl leading-tight font-extrabold whitespace-pre-line sm:text-4xl lg:text-5xl">{b.title}</h2>}
                  {b.subtitle && <p className="max-w-md text-sm text-white/85 sm:text-base">{b.subtitle}</p>}
                  {b.target.value && cta(b)}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {data.length > 1 && <CarouselDots className="mt-3" />}
      </Carousel>
      <KolVideoViewer review={video} playlist={video ? [video] : []} onChange={setVideo} onClose={() => setVideo(null)} />
    </>
  )
}
