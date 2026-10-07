import { ArrowRight, BadgeCheck, CircleCheck, PackageX, ShieldCheck, Star, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Logo } from '@/components/jamir/brand/Logo'
import { PageFallback, StateBlock } from '@/components/jamir/layout/PageStates'
import { ProductGifts } from '@/components/jamir/product/ProductGifts'
import { ProductVariant } from '@/components/jamir/product/ProductVariant'
import { ProductVideo } from '@/components/jamir/product/ProductVideo'
import { KolReviewCard } from '@/components/jamir/review/KolReviewCard'
import { KolVideoViewer } from '@/components/jamir/review/KolVideoViewer'
import { ReviewCard } from '@/components/jamir/review/ReviewCard'
import { buttonVariants } from '@/components/ui/button'
import { useLanding } from '@/hooks/queries'
import { usePurchaseActions } from '@/hooks/usePurchaseActions'
import { cn, formatCompact, formatPrice } from '@/lib/utils'
import { useSelectionStore } from '@/stores/selectionStore'
import type { KolReview, LandingPayload } from '@/types/domain'

/**
 * Ad landing page for one product (admin → Landing page). No site navigation:
 * hero → why → proof (KOL + reviews) → buy, with a CTA always on screen.
 */
export default function LandingPage() {
  const { slug = '' } = useParams()
  const { data, isPending, isError } = useLanding(slug)
  const reset = useSelectionStore((s) => s.reset)
  useEffect(() => {
    if (data) {
      reset(data.product)
      document.title = `${data.page.headline} — JAMIR`
    }
  }, [data, reset])

  if (isPending) return <PageFallback />
  if (isError || !data)
    return (
      <StateBlock
        icon={PackageX}
        className="min-h-[70vh] justify-center"
        title="Chương trình không còn"
        description="Ưu đãi có thể đã kết thúc. Xem các sản phẩm khác của JAMIR nhé."
        action={
          <Link to="/" className={buttonVariants({ variant: 'secondary' })}>
            Về trang chủ
          </Link>
        }
      />
    )
  return <Landing data={data} />
}

function Landing({ data: { page, product, reviews, kol } }: { data: LandingPayload }) {
  const { buyNow, inStock } = usePurchaseActions(product)
  const colorId = useSelectionStore((s) => s.colorId)
  const setColor = useSelectionStore((s) => s.setColor)
  const [video, setVideo] = useState<KolReview | null>(null)
  const left = useCountdown(page.countdownEndsAt)

  const cta = (className?: string) => (
    <button
      type="button"
      onClick={buyNow}
      disabled={!inStock}
      className={cn(
        'inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-btn bg-brand-gradient px-6 text-base font-extrabold text-white shadow-brand transition-[filter] hover:brightness-110 disabled:opacity-50',
        className,
      )}
    >
      {inStock ? page.ctaText || 'Mua ngay' : 'Tạm hết hàng'}
      <ArrowRight className="size-5" aria-hidden="true" />
    </button>
  )

  return (
    <div className="pb-28 lg:pb-12">
      <header className="container-page flex h-14 items-center justify-between">
        <Logo />
        <a href="#buy" className="text-sm font-semibold text-brand-700">
          Đặt hàng
        </a>
      </header>

      {/* hero */}
      <section className="container-page grid items-center gap-6 py-4 lg:grid-cols-[1.2fr_1fr] lg:gap-10 lg:py-8">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          {page.badge && (
            <span className="badge-shine relative w-fit animate-[badge-pulse_1.6s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-red-600 to-pink-500 px-3 py-1 text-sm font-extrabold text-white">
              {page.badge}
            </span>
          )}
          <h1 className="text-3xl leading-tight font-extrabold tracking-tight md:text-5xl">{page.headline}</h1>
          {page.subheadline && <p className="text-base text-muted md:text-lg">{page.subheadline}</p>}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
            <span className="flex items-center gap-1 font-semibold">
              <Star className="size-4 fill-star text-star" aria-hidden="true" />
              {product.rating.toFixed(1)}
            </span>
            <span>{formatCompact(product.reviewCount)} đánh giá</span>
            <span>{formatCompact(product.soldCount)} đã bán</span>
          </p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-extrabold text-brand-700 tabular-nums">{formatPrice(product.price)}</span>
            {product.originalPrice > product.price && (
              <>
                <span className="pb-1 text-lg text-subtle line-through">{formatPrice(product.originalPrice)}</span>
                <span className="mb-1.5 rounded-md bg-danger-strong px-2 py-0.5 text-sm font-bold text-white">-{product.discount}%</span>
              </>
            )}
          </div>
          {left && (
            <p className="w-fit rounded-[12px] bg-ink px-4 py-2 font-mono text-sm font-bold text-white tabular-nums">
              Ưu đãi kết thúc sau {left}
            </p>
          )}
          <ProductGifts gifts={product.gifts} />
          {cta('hidden w-full sm:w-fit lg:inline-flex')}
        </div>
        <div className="order-1 lg:order-2">
          {page.heroMedia?.src ? (
            page.heroMedia.type === 'video' ? (
              <video src={page.heroMedia.src} autoPlay muted loop playsInline className="w-full rounded-card bg-ink object-cover" />
            ) : (
              <img src={page.heroMedia.src} alt="" className="w-full rounded-card object-cover" />
            )
          ) : (
            <ProductVideo product={product} />
          )}
        </div>
      </section>

      {/* why */}
      {page.bullets.length > 0 && (
        <section className="container-page py-6">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {page.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 rounded-card border border-line bg-surface p-4 text-sm font-medium">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-success-strong" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* proof */}
      {page.showKol && kol.length > 0 && (
        <section className="container-page py-6">
          <h2 className="mb-4 text-2xl font-extrabold">KOL nói gì về {product.name}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {kol.map((v) => (
              <KolReviewCard key={v.id} review={v} onOpen={() => setVideo(v)} />
            ))}
          </div>
        </section>
      )}
      {page.showReviews && reviews.length > 0 && (
        <section className="container-page py-6">
          <h2 className="mb-4 text-2xl font-extrabold">Khách đã mua đánh giá</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} colorName={product.colors.find((c) => c.id === r.colorId)?.name} />
            ))}
          </div>
        </section>
      )}

      {/* buy */}
      <section id="buy" className="container-page scroll-mt-4 py-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 rounded-[24px] border border-line bg-surface p-5 shadow-lift md:p-7">
          <div className="flex items-center gap-4">
            <img src={product.thumbnail} alt="" className="size-20 rounded-[14px] object-cover" />
            <div className="min-w-0">
              <p className="text-lg font-bold">{product.name}</p>
              <p className="text-2xl font-extrabold text-brand-700">{formatPrice(product.price)}</p>
            </div>
          </div>
          {product.colors.length > 1 && <ProductVariant colors={product.colors} value={colorId} onChange={setColor} />}
          {cta('w-full')}
          <ul className="grid gap-2 text-xs text-muted sm:grid-cols-3">
            <li className="flex items-center gap-1.5">
              <Truck className="size-4 text-brand-600" /> Giao hỏa tốc 4h
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-brand-600" /> Chính hãng, bảo hành 12 tháng
            </li>
            <li className="flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-brand-600" /> Đổi trả 30 ngày
            </li>
          </ul>
        </div>
      </section>

      {/* CTA always on screen (mobile / tablet) */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 p-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted">{product.name}</p>
            <p className="text-lg font-extrabold text-brand-700">{formatPrice(product.price)}</p>
          </div>
          {cta('ml-auto h-12 flex-1 text-sm')}
        </div>
      </div>
      <KolVideoViewer review={video} playlist={kol} onChange={setVideo} onClose={() => setVideo(null)} />
    </div>
  )
}

function useCountdown(endsAt?: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!endsAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [endsAt])
  if (!endsAt) return null
  const ms = new Date(endsAt).getTime() - now
  if (!(ms > 0)) return null
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d > 0 ? `${d} ngày ` : ''}${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}
