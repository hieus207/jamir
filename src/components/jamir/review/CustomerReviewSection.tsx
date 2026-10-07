import { ImageOff, PenLine } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useProductReviews, useReviewEligibility } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import type { Product, ReviewSort } from '@/types/domain'
import { useAuthDialog } from '../auth/authStore'
import { SectionError, StateBlock } from '../layout/PageStates'
import { toast } from '@/components/ui/toast'
import { WriteReviewDialog } from './WriteReviewDialog'
import { RatingSummary } from './RatingSummary'
import { ReviewCard } from './ReviewCard'
import { ReviewFilter } from './ReviewFilter'

const PAGE = 6

export function CustomerReviewSection({ product, className }: { product: Product; className?: string }) {
  const [sort, setSort] = useState<ReviewSort>('featured')
  const [limit, setLimit] = useState(PAGE)
  const { data: reviews, isPending, isError, refetch, isPlaceholderData } = useProductReviews(product.id, sort)
  const colorName = (id?: string) => product.colors.find((c) => c.id === id)?.name
  const { data: can } = useReviewEligibility(product.id)
  const showAuth = useAuthDialog((s) => s.show)
  const [writing, setWriting] = useState(false)
  const onWrite = () => {
    if (!can?.signedIn) {
      toast.info('Đăng nhập để đánh giá', 'Chỉ khách đã mua sản phẩm mới có thể viết đánh giá.')
      showAuth('login')
    } else if (can.alreadyReviewed) toast.info('Bạn đã đánh giá sản phẩm này', 'Cảm ơn bạn đã chia sẻ!')
    else if (!can.canReview) toast.info('Chỉ dành cho người đã mua', 'Đặt mua sản phẩm này để chia sẻ trải nghiệm của bạn nhé.')
    else setWriting(true)
  }

  return (
    <Card id="reviews" className={cn('scroll-mt-24', className)}>
      <CardHeader className="flex-wrap">
        <CardTitle>
          Đánh giá từ khách hàng <span className="text-brand-600">({product.reviewCount})</span>
        </CardTitle>
        <Button variant={can?.canReview ? 'primary' : 'outline'} size="sm" onClick={onWrite} className="order-last sm:order-none">
          <PenLine />
          {can?.alreadyReviewed ? 'Đã đánh giá' : 'Viết đánh giá'}
        </Button>
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
                  <ReviewCard review={r} colorName={colorName(r.colorId)} canLike={can?.canLike} signedIn={can?.signedIn} className="h-full" />
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
        <p className="text-center text-xs text-subtle">Chỉ khách đã mua sản phẩm mới có thể viết và thích đánh giá.</p>
      </CardContent>
      <WriteReviewDialog product={product} open={writing} onClose={() => setWriting(false)} />
    </Card>
  )
}
