import { useEffect } from 'react'
import { useParams } from 'react-router'
import { ProductStories } from '@/components/jamir/navigation/ProductStories'
import { ProductVideo } from '@/components/jamir/product/ProductVideo'
import { PurchasePanel } from '@/components/jamir/product/PurchasePanel'
import { useKolReviews, useProduct } from '@/hooks/queries'
import { useSelectionStore } from '@/stores/selectionStore'

export default function ProductPage() {
  const { slug = '' } = useParams()
  const { data: product, isPending, isError } = useProduct(slug)
  const { data: kol } = useKolReviews(product?.id)
  const resetSelection = useSelectionStore((s) => s.reset)

  useEffect(() => {
    if (product) resetSelection(product)
  }, [product, resetSelection])

  useEffect(() => {
    if (product) document.title = `${product.name} — JAMIR`
  }, [product])

  if (isPending) return <div className="container-page py-10 text-muted">Đang tải…</div>
  if (isError || !product) return <div className="container-page py-10">Không tìm thấy sản phẩm</div>

  return (
    <div className="container-page pt-3 pb-28 md:pt-5 lg:pb-14">
      <ProductStories activeSlug={product.slug} className="mb-4 md:mb-5" />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_372px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-5">
          <ProductVideo key={product.id} product={product} kolCount={kol?.length} className="order-1" />
          <PurchasePanel product={product} className="order-2 lg:hidden" />
        </div>
        <aside className="sticky top-[88px] hidden lg:block" aria-label="Mua hàng">
          <PurchasePanel product={product} />
        </aside>
      </div>
    </div>
  )
}
