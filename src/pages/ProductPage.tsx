import { Home, PackageX } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { StateBlock } from '@/components/jamir/layout/PageStates'
import { ProductStories } from '@/components/jamir/navigation/ProductStories'
import { StoryModeBar } from '@/components/jamir/stories/StoryModeBar'
import { ProductFaq } from '@/components/jamir/product/ProductFaq'
import { ProductInfo } from '@/components/jamir/product/ProductInfo'
import { ProductPrice } from '@/components/jamir/product/ProductPrice'
import { ProductStepNav } from '@/components/jamir/product/ProductStepNav'
import { ProductPageSkeleton } from '@/components/jamir/product/ProductPageSkeleton'
import { ProductSpecs } from '@/components/jamir/product/ProductSpecs'
import { ProductSwipeNavigator } from '@/components/jamir/product/ProductSwipeNavigator'
import { ProductVideo } from '@/components/jamir/product/ProductVideo'
import { PurchasePanel } from '@/components/jamir/product/PurchasePanel'
import { RelatedProducts } from '@/components/jamir/product/RelatedProducts'
import { StickyPurchaseBar } from '@/components/jamir/product/StickyPurchaseBar'
import { UseCaseGrid } from '@/components/jamir/product/UseCaseGrid'
import { CustomerReviewSection } from '@/components/jamir/review/CustomerReviewSection'
import { KolReviewSection } from '@/components/jamir/review/KolReviewSection'
import { buttonVariants } from '@/components/ui/button'
import { useKolReviews, useProduct } from '@/hooks/queries'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useSeo } from '@/hooks/useSeo'
import { useStickyTop } from '@/hooks/useStickyTop'
import { paths } from '@/lib/paths'
import { useSelectionStore } from '@/stores/selectionStore'
import { useSwipeStore } from '@/stores/swipeStore'

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 56 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -56 }),
}

/**
 * Jamir funnel — one layer per question, buy CTA always reachable.
 * Mobile (< lg) follows the 7-step swipe flow; ↑↓ = deeper into this product,
 * ←→ = previous / next product (ProductSwipeNavigator):
 *   1 Video + tổng quan  2 KOL Review  3 Đánh giá  4 Thông số  5 Phù hợp với ai
 *   6 Thông tin đặt hàng (sticky CTA throughout)  7 Checkout bottom sheet
 * Desktop keeps V1: video → KOL → thông số → cảm nhận → hỏi đáp, buy panel sticky on the right.
 */
export default function ProductPage() {
  const { slug = '' } = useParams()
  const { data: product, isPending, isError } = useProduct(slug)
  const { data: kol } = useKolReviews(product?.id)
  const resetSelection = useSelectionStore((s) => s.reset)
  const direction = useSwipeStore((s) => s.direction)
  const asideRef = useRef<HTMLDivElement>(null)
  const asideTop = useStickyTop(asideRef)
  // exactly one visible h1: mobile overview below lg, the buy panel on desktop
  const wide = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    if (product) resetSelection(product)
  }, [product, resetSelection])

  useSeo(
    product
      ? { title: `${product.name}, giá ${product.price.toLocaleString('vi-VN')}đ | JAMIR`, description: product.shortDescription, path: paths.product(product.slug), image: product.thumbnail }
      : null,
  )

  if (isPending) return <ProductPageSkeleton />
  if (isError || !product)
    return (
      <StateBlock
        icon={PackageX}
        title="Không tìm thấy sản phẩm"
        description="Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng."
        className="min-h-[60vh] justify-center"
        action={
          <Link to="/" className={buttonVariants({ variant: 'secondary' })}>
            <Home aria-hidden="true" />
            Về trang chủ
          </Link>
        }
      />
    )

  return (
    <>
      <StoryModeBar />
      <ProductSwipeNavigator slug={product.slug}>
        <div className="container-page pt-3 pb-4 md:pt-5">
          <ProductStories activeSlug={product.slug} className="mb-3 md:mb-5" />
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={product.id}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductStepNav productId={product.id} className="mb-3" />
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_372px] xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
                <div className="flex min-w-0 flex-col gap-4 md:gap-5">
                  <section id="tong-quan" aria-label="Tổng quan" className="order-1 flex scroll-mt-32 flex-col gap-3">
                    <ProductVideo key={product.id} product={product} kolCount={kol?.length} />
                    {!wide && (
                      <div className="flex flex-col gap-2 lg:hidden">
                        <ProductInfo product={product} compact />
                        <ProductPrice price={product.price} originalPrice={product.originalPrice} discount={product.discount} />
                      </div>
                    )}
                  </section>
                  <KolReviewSection productId={product.id} className="order-2 scroll-mt-32 lg:scroll-mt-24" />
                  <CustomerReviewSection product={product} className="order-3 scroll-mt-32 lg:order-5 lg:scroll-mt-24" />
                  <div id="thong-so" className="order-4 scroll-mt-32 lg:scroll-mt-24">
                    <ProductSpecs specs={product.specs} />
                  </div>
                  <div id="phu-hop" className="order-5 scroll-mt-32 lg:hidden">
                    <UseCaseGrid useCases={product.useCases} variant="list" />
                  </div>
                  <div id="dat-hang" className="order-6 scroll-mt-32 lg:hidden">
                    <PurchasePanel product={product} inline />
                  </div>
                  <ProductFaq productId={product.id} total={product.faqCount} className="order-7 scroll-mt-32 lg:scroll-mt-24" />
                </div>
                <aside ref={asideRef} style={{ top: asideTop }} className="sticky hidden flex-col gap-4 lg:flex" aria-label="Mua hàng">
                  <PurchasePanel product={product} headingLevel={wide ? 'h1' : 'h2'} />
                  <UseCaseGrid useCases={product.useCases} variant="compact" />
                </aside>
              </div>
              <RelatedProducts productId={product.id} className="mt-6" />
            </motion.div>
          </AnimatePresence>
        </div>
      </ProductSwipeNavigator>
      {/* kept outside transformed ancestors so `position: fixed` stays viewport-relative */}
      <StickyPurchaseBar product={product} />
    </>
  )
}
