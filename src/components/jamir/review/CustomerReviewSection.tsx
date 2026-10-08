import { ImageOff, PenLine, Sparkles, Star } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { useProductReviews, useReviewEligibility } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import type { Product, ReviewSort } from '@/types/domain'
import { useAuthDialog } from '../auth/authStore'
import { SectionError, StateBlock } from '../layout/PageStates'
import { RatingSummary } from './RatingSummary'
import { ReviewCard } from './ReviewCard'
import { ReviewFilter } from './ReviewFilter'
import { WriteReviewDialog } from './WriteReviewDialog'

const PAGE = 4

/** Written by the admin (or generated with AI there); otherwise a plain digest of the product data. */
function summaryOf(p: Product) {
  if (p.aiSummary?.trim()) return { ai: true, text: p.aiSummary.trim() }
  const tags = p.featureTags.slice(0, 3)
  const said = tags.join(' ').toLowerCase()
  // specs only when they add something the tags don't already say
  const specs = p.specs
    .filter((s) => !said.includes(s.value.toLowerCase()) && !said.includes(s.label.toLowerCase()))
    .slice(0, 2)
    .map((s) => `${s.label} ${s.value}`)
  const parts = [p.name, tags.join('. '), specs.join(', '), p.reviewCount ? `Cộng đồng đánh giá ${p.rating.toFixed(1)}/5` : '']
  return { ai: false, text: parts.filter(Boolean).join('. ') + '.' }
}

/**
 * "Cảm nhận khách hàng": rating breakdown and quick summary side by side,
 * then the reviews (stacked on phones).
 */
export function CustomerReviewSection({ product, className }: { product: Product; className?: string }) {
  const [sort, setSort] = useState<ReviewSort>('featured')
  const [limit, setLimit] = useState(PAGE)
  const { data: reviews, isPending, isError, refetch, isPlaceholderData } = useProductReviews(product.id, sort)
  const { data: can } = useReviewEligibility(product.id)
  const showAuth = useAuthDialog((s) => s.show)
  const [writing, setWriting] = useState(false)
  const colorName = (id?: string) => product.colors.find((c) => c.id === id)?.name
  const summary = summaryOf(product)

  const onWrite = () => {
    if (!can?.signedIn) {
      toast.info('Đăng nhập để đánh giá', 'Chỉ khách đã mua sản phẩm mới có thể viết đánh giá.')
      showAuth('login')
    } else if (can.alreadyReviewed) toast.info('Bạn đã dùng lượt đánh giá', 'Mỗi tài khoản được đánh giá một lần. Cảm ơn bạn đã chia sẻ!')
    else if (!can.canReview) toast.info('Chỉ dành cho người đã mua', 'Đặt mua sản phẩm này để chia sẻ trải nghiệm của bạn nhé.')
    else setWriting(true)
  }

  return (
    <section id="reviews" aria-labelledby="reviews-title" className={cn('scroll-mt-24', className)}>

      <Card className="min-w-0">
        <CardHeader className="flex-wrap gap-y-2">
          <CardTitle id="reviews-title">Cảm nhận khách hàng</CardTitle>
          <Button variant={can?.canReview ? 'primary' : 'outline'} size="sm" onClick={onWrite}>
            <PenLine />
            {can?.alreadyReviewed ? 'Đã dùng lượt đánh giá' : 'Viết đánh giá'}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-1">
          {/* ratings and the quick summary side by side */}
          <div className="grid gap-3 md:grid-cols-2">
            <RatingSummary productId={product.id} className="h-full" />
            <div className="flex flex-col rounded-[14px] border border-brand-100 bg-gradient-to-br from-brand-50 via-accent-50/60 to-pink-50/60 p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-brand-700">
                <Sparkles className="size-4" aria-hidden="true" />
                Tóm tắt nhanh
              </p>
              <p className="text-sm leading-relaxed text-ink-soft">{summary.text}</p>
              {product.reviewCount > 0 && (
                <p className="mt-auto flex items-center gap-1.5 pt-2 text-[11px] text-muted">
                  <Star className="size-3 fill-star text-star" aria-hidden="true" />
                  Dựa trên {product.reviewCount} đánh giá và thông số sản phẩm
                </p>
              )}
            </div>
          </div>
          <ReviewFilter
            value={sort}
            onChange={(v) => {
              setSort(v)
              setLimit(PAGE)
            }}
          />
          {isError ? (
            <SectionError onRetry={() => refetch()} />
          ) : isPending ? (
            <div className="flex flex-col gap-3 py-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-20 rounded-[12px]" />
              ))}
            </div>
          ) : reviews?.length === 0 ? (
            <StateBlock icon={ImageOff} title="Chưa có cảm nhận phù hợp" description="Hãy thử bộ lọc khác nhé." className="py-8" />
          ) : (
            <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
              {reviews?.slice(0, limit).map((r) => (
                <ReviewCard key={r.id} review={r} variant="row" colorName={colorName(r.colorId)} canLike={can?.canLike} signedIn={can?.signedIn} />
              ))}
            </div>
          )}
          {reviews && reviews.length > limit && (
            <Button variant="ghost" size="sm" className="w-full text-brand-700" onClick={() => setLimit((l) => l + PAGE * 2)}>
              Xem thêm {Math.min(reviews.length - limit, PAGE * 2)} cảm nhận
            </Button>
          )}
        </CardContent>
      </Card>
      <WriteReviewDialog product={product} open={writing} onClose={() => setWriting(false)} />
    </section>
  )
}
