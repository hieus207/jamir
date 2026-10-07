import { BadgeCheck, Play, RefreshCw, Truck } from 'lucide-react'
import { useEffect } from 'react'
import { HomeBanners } from '@/components/jamir/layout/HomeBanners'
import { NewsSection } from '@/components/jamir/news/NewsSection'
import { RecommendationSection } from '@/components/jamir/recommendation/RecommendationSection'
import { StoriesHero } from '@/components/jamir/stories/StoriesHero'
import { KolHotSection } from '@/components/jamir/recommendation/KolHotSection'
import { useRecommendedForYou } from '@/hooks/queries'

const USPS = [
  { icon: Truck, title: 'Hỏa tốc 4h', text: 'Nội thành HN & HCM' },
  { icon: BadgeCheck, title: 'Chính hãng 100%', text: 'Hoàn tiền 200% nếu giả' },
  { icon: RefreshCw, title: 'Đổi trả 30 ngày', text: 'Miễn phí vận chuyển' },
  { icon: Play, title: 'Review thật', text: 'Video từ KOL & khách hàng' },
]

export default function HomePage() {
  const forYou = useRecommendedForYou()
  useEffect(() => {
    document.title = 'JAMIR — Mua sắm công nghệ qua video'
  }, [])

  return (
    <div className="container-page flex flex-col gap-8 pt-3 pb-10 md:gap-10 md:pt-5">
      <h1 className="sr-only">JAMIR — Mua sắm công nghệ qua video</h1>
      <StoriesHero />
      <HomeBanners />

      <ul className="-mt-2 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {USPS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center gap-3 rounded-card border border-line/70 bg-surface p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-50 text-brand-600">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{title}</span>
              <span className="block truncate text-xs text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>

      <KolHotSection count={5} />

      <NewsSection />

      <RecommendationSection
        title="Gợi ý cho bạn"
        description="Chọn lọc từ những sản phẩm được yêu thích nhất"
        products={forYou.data}
        loading={forYou.isPending}
        autoplayMs={5000}
      />
    </div>
  )
}
