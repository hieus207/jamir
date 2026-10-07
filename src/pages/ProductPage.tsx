import { Home, PackageX } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { StateBlock } from '@/components/jamir/layout/PageStates'
import { ProductStories } from '@/components/jamir/navigation/ProductStories'
import { ProductFaq } from '@/components/jamir/product/ProductFaq'
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
import { useSelectionStore } from '@/stores/selectionStore'
import { useSwipeStore } from '@/stores/swipeStore'

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 56 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -56 }),
}

/**
 * Section order differs per breakpoint (CSS `order`):
 *   mobile : video → info/panel → KOL → specs → use cases → FAQ → reviews
 *   desktop: video → specs → use cases → KOL → reviews → FAQ  (+ sticky panel on the right)
 */
export default function ProductPage() {
  const { slug = '' } = useParams()
  const { data: product, isPending, isError } = useProduct(slug)
  const { data: kol } = useKolReviews(product?.id)
  const resetSelection = useSelectionStore((s) => s.reset)
  const direction = useSwipeStore((s) => s.direction)

  useEffect(() => {
    if (product) resetSelection(product)
  }, [product, resetSelection])

  useEffect(() => {
    if (product) document.title = `${product.name} — JAMIR`
  }, [product])

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
      <ProductSwipeNavigator slug={product.slug}>
        <div className="container-page pt-3 pb-28 md:pt-5 lg:pb-14">
          <ProductStories activeSlug={product.slug} className="mb-4 md:mb-5" />
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
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_372px] xl:grid-cols-[minmax(0,1fr)_400px]">
                <div className="flex min-w-0 flex-col gap-4 md:gap-5">
                  <ProductVideo key={product.id} product={product} kolCount={kol?.length} className="order-1" />
                  <PurchasePanel product={product} inline className="order-2 lg:hidden" />
                  <KolReviewSection productId={product.id} className="order-3 lg:order-4" />
                  <ProductSpecs specs={product.specs} className="order-4 lg:order-2" />
                  <UseCaseGrid useCases={product.useCases} className="order-5 lg:order-3" />
                  <ProductFaq productId={product.id} total={product.faqCount} className="order-6" />
                  <CustomerReviewSection product={product} className="order-7 lg:order-5" />
                </div>
                <aside className="sticky top-[88px] hidden lg:block" aria-label="Mua hàng">
                  <PurchasePanel product={product} />
                </aside>
              </div>
              <RelatedProducts productId={product.id} className="mt-8" />
            </motion.div>
          </AnimatePresence>
        </div>
      </ProductSwipeNavigator>
      {/* kept outside transformed ancestors so `position: fixed` stays viewport-relative */}
      <StickyPurchaseBar product={product} />
    </>
  )
}
