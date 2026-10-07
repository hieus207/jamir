import { Heart } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/jamir/layout/PageHeader'
import { StateBlock } from '@/components/jamir/layout/PageStates'
import { ProductGrid } from '@/components/jamir/recommendation/ProductGrid'
import { buttonVariants } from '@/components/ui/button'
import { useProductsByIds } from '@/hooks/queries'
import { useWishlistStore } from '@/stores/wishlistStore'

export default function WishlistPage() {
  const ids = useWishlistStore((s) => s.ids)
  const { data, isPending } = useProductsByIds(ids)
  useEffect(() => {
    document.title = 'Yêu thích — JAMIR'
  }, [])
  return (
    <div className="container-page flex flex-col gap-5 pt-4 pb-10 md:pt-6">
      <PageHeader title="Yêu thích" description={`${ids.length} sản phẩm đã lưu`} />
      {ids.length === 0 ? (
        <StateBlock
          icon={Heart}
          title="Chưa có sản phẩm yêu thích"
          description="Nhấn ♡ trên sản phẩm hoặc nút Lưu trong video để lưu lại xem sau."
          action={
            <Link to="/shop" className={buttonVariants({ variant: 'secondary' })}>
              Khám phá sản phẩm
            </Link>
          }
        />
      ) : (
        <ProductGrid products={data} loading={isPending && !data} />
      )}
    </div>
  )
}
