import Autoplay from 'embla-carousel-autoplay'
import { ArrowRight, BadgeCheck, Play, RefreshCw, Truck } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { NewsSection } from '@/components/jamir/news/NewsSection'
import { RecommendationSection } from '@/components/jamir/recommendation/RecommendationSection'
import { StoriesHero } from '@/components/jamir/stories/StoriesHero'
import { KolHotSection } from '@/components/jamir/recommendation/KolHotSection'
import { buttonVariants } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselDots, CarouselItem } from '@/components/ui/carousel'
import { useRecommendedForYou } from '@/hooks/queries'

const BANNERS = [
  {
    image: '/media/banners/hero-1.jpg',
    eyebrow: 'Video commerce',
    title: 'Xem trước. Chọn đúng.\nMua ngay trong video.',
    cta: 'Xem Tai nghe Pro X1',
    to: '/product/tai-nghe-pro-x1',
  },
  {
    image: '/media/banners/hero-2.jpg',
    eyebrow: 'Ưu đãi tuần này',
    title: 'Âm thanh di động\ngiảm đến 25%',
    cta: 'Khám phá Loa Mini S2',
    to: '/product/loa-mini-s2',
  },
  {
    image: '/media/banners/hero-3.jpg',
    eyebrow: 'Sạc nhanh — sống chậm',
    title: 'Một củ sạc GaN 65W\ncho mọi thiết bị',
    cta: 'Xem Sạc GaN 65W',
    to: '/product/sac-gan-65w',
  },
]

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
      <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]} aria-label="Ưu đãi nổi bật">
        <CarouselContent>
          {BANNERS.map((b, i) => (
            <CarouselItem key={b.to}>
              <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-ink sm:aspect-[16/7] lg:aspect-[16/6]">
                <img
                  src={b.image}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
                <div className="relative flex h-full max-w-xl flex-col justify-end gap-3 p-5 text-white sm:justify-center sm:p-10">
                  <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">{b.eyebrow}</span>
                  <h2 className="text-2xl leading-tight font-extrabold whitespace-pre-line sm:text-4xl lg:text-5xl">{b.title}</h2>
                  <Link to={b.to} className={buttonVariants({ variant: 'primary', size: 'md', className: 'w-fit' })}>
                    {b.cta}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots className="mt-3" />
      </Carousel>

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
