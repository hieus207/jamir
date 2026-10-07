import { ArrowRight, Clapperboard } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Skeleton } from '@/components/ui/skeleton'
import { useKolReviews } from '@/hooks/queries'
import { cn, formatCompact } from '@/lib/utils'
import type { KolReview } from '@/types/domain'
import { SectionError } from '../layout/PageStates'
import { KolReviewCard } from './KolReviewCard'
import { KolVideoViewer } from './KolVideoViewer'

/** Dark "theater" section so KOL/customer videos stand out on the product page. */
export function KolReviewSection({ productId, className }: { productId: string; className?: string }) {
  const { data: reviews, isPending, isError, refetch } = useKolReviews(productId)
  const [active, setActive] = useState<KolReview | null>(null)
  const totalViews = reviews?.reduce((s, r) => s + r.views, 0) ?? 0

  return (
    <section
      id="kol-reviews"
      aria-labelledby="kol-title"
      className={cn('relative scroll-mt-24 overflow-hidden rounded-card bg-ink text-white shadow-lift', className)}
    >
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent-600/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-brand-600/30 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-wrap items-end justify-between gap-3 px-4 pt-5 md:px-6 md:pt-6">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-300 uppercase">
            <Clapperboard className="size-4" aria-hidden="true" />
            Review thật · {reviews?.length ?? 0} video · {formatCompact(totalViews)} lượt xem
          </p>
          <h2 id="kol-title" className="text-xl font-extrabold tracking-tight md:text-2xl">
            Video review từ KOL & khách hàng
          </h2>
        </div>
        <Link to="/explore" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-200 hover:text-white">
          Xem tất cả <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="relative p-4 md:p-6">
        {isError ? (
          <SectionError onRetry={() => refetch()} />
        ) : isPending ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className={cn('h-[200px] shrink-0 rounded-[14px] opacity-20 md:h-[260px]', i % 2 ? 'w-[133px] md:w-[146px]' : 'w-[420px] md:w-[462px]')} />
            ))}
          </div>
        ) : (
          <Carousel opts={{ dragFree: true }} aria-label="Video review" className="[--kol-card-h:200px] md:[--kol-card-h:260px]">
            <CarouselContent>
              {reviews?.map((r) => (
                <CarouselItem key={r.id} className="basis-auto">
                  <KolReviewCard review={r} layout="row" tone="dark" onOpen={() => setActive(r)} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="top-[40%] -left-3" />
            <CarouselNext className="top-[40%] -right-3" />
          </Carousel>
        )}
      </div>
      <KolVideoViewer review={active} playlist={reviews ?? []} onChange={setActive} onClose={() => setActive(null)} />
    </section>
  )
}
