import { useEffect } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/jamir/layout/PageHeader'
import { ReviewCard } from '@/components/jamir/review/ReviewCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useCommunityFeed } from '@/hooks/queries'

export default function CommunityPage() {
  const { data, isPending } = useCommunityFeed()
  useEffect(() => {
    document.title = 'Cộng đồng — JAMIR'
  }, [])
  return (
    <div className="container-page flex flex-col gap-6 pt-4 pb-10 md:pt-6">
      <PageHeader title="Cộng đồng" description="Ảnh & video thật từ khách hàng đã mua tại JAMIR" />
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {isPending
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="mb-4 h-56 break-inside-avoid rounded-[14px]" />)
          : data?.map((r) => (
              <div key={r.id} className="mb-4 break-inside-avoid">
                <ReviewCard review={r} />
                <Link to={`/product/${r.productSlug}`} className="mt-1.5 ml-1 inline-block text-xs font-semibold text-brand-700 hover:underline">
                  Sản phẩm: {r.productName} →
                </Link>
              </div>
            ))}
      </div>
    </div>
  )
}
