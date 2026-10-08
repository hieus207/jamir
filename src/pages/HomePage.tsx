import { useSeo } from '@/hooks/useSeo'
import { HomeBanners } from '@/components/jamir/layout/HomeBanners'
import { NewsSection } from '@/components/jamir/news/NewsSection'
import { RecommendationSection } from '@/components/jamir/recommendation/RecommendationSection'
import { StoriesHero } from '@/components/jamir/stories/StoriesHero'
import { KolHotSection } from '@/components/jamir/recommendation/KolHotSection'
import { useRecommendedForYou, useSettings } from '@/hooks/queries'
import { DEFAULT_USPS } from '@/lib/brand'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'


export default function HomePage() {
  const forYou = useRecommendedForYou()
  // settings.json → forYouLabels (default: off)
  const settings = useSettings().data
  const labels = { enabled: false, max: 2, ...settings?.forYouLabels }
  const usps = settings?.usps?.length ? settings.usps : DEFAULT_USPS
  useSeo({ title: 'JAMIR | Mua sắm công nghệ qua video', description: 'Xem video thật từ KOL và khách hàng, chọn đúng phụ kiện công nghệ và mua ngay.', path: '/' })

  return (
    <div className="container-page flex flex-col gap-8 pt-3 pb-3 md:gap-10 md:pt-5">
      <h1 className="sr-only">JAMIR: mua sắm phụ kiện công nghệ qua video review thật</h1>
      <StoriesHero />
      <KolHotSection count={5} />
      <HomeBanners />

      {/* cam kết — edited in Admin → Cài đặt */}
      <ul className="-mt-2 grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        {usps.map((u) => (
          <li
            key={u.title}
            className={cn(
              'flex items-center gap-3 rounded-[18px] border p-3.5 md:gap-4 md:p-5',
              u.highlight ? 'border-transparent bg-brand-gradient text-white shadow-brand' : 'border-line/70 bg-surface',
            )}
          >
            <span
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-[14px] md:size-14',
                u.highlight ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600',
              )}
            >
              <Icon name={u.icon} className="size-6 md:size-7" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] leading-tight font-extrabold md:text-lg">{u.title}</span>
              <span className={cn('mt-0.5 block text-xs md:text-sm', u.highlight ? 'text-white/85' : 'text-muted')}>{u.text}</span>
            </span>
          </li>
        ))}
      </ul>

      <NewsSection />

      <RecommendationSection
        labelLimit={labels.enabled ? labels.max : 0}
        title="Gợi ý"
        accent="cho bạn"
        description="Chọn lọc từ những sản phẩm được yêu thích nhất"
        products={forYou.data}
        loading={forYou.isPending}
        autoplayMs={5000}
      />
    </div>
  )
}
