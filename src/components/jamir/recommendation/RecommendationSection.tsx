import { SectionHeading } from '@/components/jamir/layout/SectionHeading'
import Autoplay from 'embla-carousel-autoplay'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ProductSummary } from '@/types/domain'
import { RecommendationCard } from './RecommendationCard'

export function RecommendationSection({
  title,
  accent,
  products,
  loading,
  moreHref = '/shop',
  autoplayMs,
  description,
  columns,
  labelLimit,
  className,
}: {
  /** at most this many cards show their label (undefined = all) */
  labelLimit?: number
  /** grid of up to N large cards (full width) instead of a carousel */
  columns?: number
  /** auto-advance one slide every N ms (loops) */
  autoplayMs?: number
  description?: string
  title: string
  /** gradient word after the title */
  accent?: string
  products?: ProductSummary[]
  loading?: boolean
  moreHref?: string
  className?: string
}) {
  if (!loading && !products?.length) return null
  return (
    <section aria-label={accent ? `${title} ${accent}` : title} className={cn('flex flex-col gap-3', className)}>
      <SectionHeading title={title} accent={accent} description={description} action={{ to: moreHref, label: 'Xem thêm' }} />
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className={cn('aspect-[3/4] rounded-card', i >= 2 && 'hidden sm:block', i >= 3 && 'sm:hidden lg:block')} />
          ))}
        </div>
      ) : columns ? (
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {(() => {
            const shown = products!.slice(0, columns)
            const labelled = new Set(shown.filter((p) => p.highlight).slice(0, labelLimit ?? Infinity).map((p) => p.id))
            return shown.map((p) => <RecommendationCard key={p.id} product={p} size="lg" showLabel={labelled.has(p.id)} />)
          })()}
        </div>
      ) : (
        <Carousel
          opts={autoplayMs ? { loop: true } : { dragFree: true }}
          plugins={autoplayMs ? [Autoplay({ delay: autoplayMs, stopOnInteraction: false, stopOnMouseEnter: true })] : undefined}
        >
          <CarouselContent className="py-1">
            {products!.map((p, _i, all) => (
              <CarouselItem key={p.id} className="basis-[46%] sm:basis-1/3 lg:basis-1/5">
                <RecommendationCard
                  product={p}
                  showLabel={labelLimit === undefined || all.filter((x) => x.highlight).slice(0, labelLimit).some((x) => x.id === p.id)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="top-[38%]" />
          <CarouselNext className="top-[38%]" />
        </Carousel>
      )}
    </section>
  )
}
