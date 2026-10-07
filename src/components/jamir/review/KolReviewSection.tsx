import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Skeleton } from '@/components/ui/skeleton'
import { useKolReviews } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import type { KolReview } from '@/types/domain'
import { SectionError } from '../layout/PageStates'
import { KolReviewCard } from './KolReviewCard'
import { KolVideoViewer } from './KolVideoViewer'

export function KolReviewSection({ productId, className }: { productId: string; className?: string }) {
  const { data: reviews, isPending, isError, refetch } = useKolReviews(productId)
  const [active, setActive] = useState<KolReview | null>(null)

  return (
    <Card id="kol-reviews" className={cn('scroll-mt-24', className)}>
      <CardHeader>
        <CardTitle>Video review từ KOL & khách hàng</CardTitle>
        <Link to="/explore" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
          Xem tất cả <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent>
        {isError ? (
          <SectionError onRetry={() => refetch()} />
        ) : isPending ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-video rounded-[14px]" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-8 w-3/5" />
              </div>
            ))}
          </div>
        ) : (
          <Carousel opts={{ dragFree: true }} aria-label="Video review" className="[--kol-card-h:196px] md:[--kol-card-h:220px]">
            <CarouselContent>
              {reviews?.map((r) => (
                <CarouselItem key={r.id} className="basis-auto">
                  <KolReviewCard review={r} layout="row" onOpen={() => setActive(r)} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="top-[30%]" />
            <CarouselNext className="top-[30%]" />
          </Carousel>
        )}
      </CardContent>
      <KolVideoViewer review={active} playlist={reviews ?? []} onChange={setActive} onClose={() => setActive(null)} />
    </Card>
  )
}
