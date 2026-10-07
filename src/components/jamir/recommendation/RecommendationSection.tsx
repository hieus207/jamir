import Autoplay from 'embla-carousel-autoplay'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ProductSummary } from '@/types/domain'
import { RecommendationCard } from './RecommendationCard'

export function RecommendationSection({
  title,
  products,
  loading,
  moreHref = '/shop',
  autoplayMs,
  description,
  columns,
  className,
}: {
  /** grid of up to N large cards (full width) instead of a carousel */
  columns?: number
  /** auto-advance one slide every N ms (loops) */
  autoplayMs?: number
  description?: string
  title: string
  products?: ProductSummary[]
  loading?: boolean
  moreHref?: string
  className?: string
}) {
  if (!loading && !products?.length) return null
  return (
    <section aria-label={title} className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('font-bold tracking-tight', columns ? 'text-xl md:text-2xl' : 'text-lg md:text-xl')}>{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        <Link to={moreHref} className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
          Xem thêm <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className={cn('aspect-[3/4] rounded-card', i >= 2 && 'hidden sm:block', i >= 3 && 'sm:hidden lg:block')} />
          ))}
        </div>
      ) : columns ? (
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {products!.slice(0, columns).map((p) => (
            <RecommendationCard key={p.id} product={p} size="lg" />
          ))}
        </div>
      ) : (
        <Carousel
          opts={autoplayMs ? { loop: true } : { dragFree: true }}
          plugins={autoplayMs ? [Autoplay({ delay: autoplayMs, stopOnInteraction: false, stopOnMouseEnter: true })] : undefined}
        >
          <CarouselContent className="py-1">
            {products!.map((p) => (
              <CarouselItem key={p.id} className="basis-[46%] sm:basis-1/3 lg:basis-1/5">
                <RecommendationCard product={p} />
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
