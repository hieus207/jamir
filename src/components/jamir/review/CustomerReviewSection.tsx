import { ImageOff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useProductReviews } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import type { Product, ReviewSort } from '@/types/domain'
import { SectionError, StateBlock } from '../layout/PageStates'
import { RatingSummary } from './RatingSummary'
import { ReviewCard } from './ReviewCard'
import { ReviewFilter } from './ReviewFilter'

const PAGE = 6

export function CustomerReviewSection({ product, className }: { product: Product; className?: string }) {
  const [sort, setSort] = useState<ReviewSort>('featured')
  const [limit, setLimit] = useState(PAGE)
  const { data: reviews, isPending, isError, refetch, isPlaceholderData } = useProductReviews(product.id, sort)
  const colorName = (id?: string) => product.colors.find((c) => c.id === id)?.name

  return (
    <Card id="reviews" className={cn('scroll-mt-24', className)}>
      <CardHeader className="flex-wrap">
        <CardTitle>
          Đánh giá từ khách hàng <span className="text-brand-600">({product.reviewCount})</span>
        </CardTitle>
        <ReviewFilter
          value={sort}
          onChange={(v) => {
            setSort(v)
            setLimit(PAGE)
          }}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <RatingSummary productId={product.id} className="md:max-w-md" />
        {isError ? (
          <SectionError onRetry={() => refetch()} />
        ) : isPending ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-48 rounded-[14px]" />
            ))}
          </div>
        ) : reviews?.length === 0 ? (
          <StateBlock icon={ImageOff} title="Chưa có đánh giá phù hợp" description="Hãy thử bộ lọc khác nhé." />
        ) : (
          <div className={cn('grid gap-3 transition-opacity md:grid-cols-2 xl:grid-cols-3', isPlaceholderData && 'opacity-60')}>
            <AnimatePresence mode="popLayout" initial={false}>
              {reviews?.slice(0, limit).map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <ReviewCard review={r} colorName={colorName(r.colorId)} className="h-full" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        {reviews && reviews.length > limit && (
          <Button variant="outline" className="self-center" onClick={() => setLimit((l) => l + PAGE)}>
            Xem thêm đánh giá
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
