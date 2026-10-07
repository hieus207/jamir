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
  className,
}: {
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
        <h2 className="text-lg font-bold tracking-tight md:text-xl">{title}</h2>
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
      ) : (
        <Carousel opts={{ dragFree: true }}>
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
