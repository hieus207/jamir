import { ArrowRight, Music2, Play, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { KolVideoViewer } from '@/components/jamir/review/KolVideoViewer'
import { Avatar } from '@/components/ui/avatar'
import { usePurchaseActions } from '@/hooks/usePurchaseActions'
import { Icon } from '@/lib/icons'
import { paths } from '@/lib/paths'
import { cn, formatCompact, formatPrice, formatRelative } from '@/lib/utils'
import { useSelectionStore } from '@/stores/selectionStore'
import { useUiStore } from '@/stores/uiStore'
import type { KolReview, LandingPayload } from '@/types/domain'
import { BrushButton, comic, grunge, marker, Scribble, StreetText, Tape, TrustRow, useStreetFonts } from './street'

/**
 * Landing page, "poster" theme: the whole ad on one desktop screen (no scrolling) —
 * hero, hot on TikTok, real people, colours and the buy bar laid out as a collage.
 * Sizes scale with the viewport height; below lg it stacks and scrolls.
 */
export function LandingPoster({ data: { page, product, reviews, kol } }: { data: LandingPayload }) {
  useStreetFonts()
  const { buyNow, inStock } = usePurchaseActions(product)
  const colorId = useSelectionStore((s) => s.colorId)
  const setColor = useSelectionStore((s) => s.setColor)
  const openCart = useUiStore((s) => s.setCartOpen)
  const [video, setVideo] = useState<KolReview | null>(null)
  const hero = page.heroMedia?.src && page.heroMedia.type !== 'video' ? page.heroMedia.src : (product.gallery[0] ?? product.thumbnail)
  const tilt = ['-rotate-3', 'rotate-2', '-rotate-1']

  return (
    <div className={cn('flex min-h-dvh flex-col text-white lg:h-dvh lg:overflow-hidden', grunge)}>
      {/* header */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between px-4 lg:px-8">
        <Link to="/" className={cn(comic, 'text-3xl')}>
          JAMIR<sup className="text-xs">®</sup>
        </Link>
        <div className="flex items-center gap-5 text-sm font-semibold text-white/85">
          {page.badge && <Tape tone="red" className="hidden text-base sm:inline-block">{page.badge}</Tape>}
          <button type="button" onClick={() => openCart(true)} aria-label="Giỏ hàng" className="cursor-pointer hover:text-[#ffe52e]">
            <ShoppingCart className="size-6" />
          </button>
        </div>
      </header>

      {/* collage */}
      <main className="grid min-h-0 flex-1 gap-3 px-4 pb-3 lg:grid-cols-12 lg:grid-rows-[minmax(0,1.15fr)_minmax(0,1fr)] lg:px-8">
        {/* hero: copy over the photo */}
        <section className="relative min-h-[460px] overflow-hidden rounded-[18px] lg:col-span-12 lg:min-h-0">
          <img src={hero} alt="" className="absolute inset-0 size-full object-cover" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/5" />
          <div className="relative flex h-full flex-col justify-center gap-[1.6vh] p-5 lg:max-w-[52%] lg:p-[3vh_2.5vw]">
            <h1 className={cn(marker, 'relative -rotate-2 text-[clamp(2.4rem,6.4vh,4.6rem)] drop-shadow-[3px_4px_0_rgba(0,0,0,0.7)]')}>
              <StreetText text={page.headline} />
              <Scribble kind="crown" className="absolute -top-[4vh] right-[8%] size-[7vh] rotate-12 text-[#ffe52e]" />
            </h1>
            {page.subheadline && <p className="max-w-md text-[clamp(0.9rem,1.9vh,1.15rem)] text-white/90">{page.subheadline}</p>}
            <ul className="flex flex-wrap gap-5">
              {product.specs.slice(0, 3).map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-[clamp(0.75rem,1.5vh,0.9rem)] leading-tight">
                  <Icon name={f.icon} className="size-[3.4vh] min-h-6 min-w-6 text-[#ffe52e]" strokeWidth={1.8} />
                  <span>
                    {f.label}
                    <br />
                    <span className="font-semibold">{f.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {page.sideNote && (
            <p className={cn(marker, 'absolute top-[6%] right-[4%] hidden max-w-[220px] rotate-[-8deg] text-right text-[clamp(1.6rem,4.4vh,3rem)] lg:block')}>
              {page.sideNote}
              <Scribble kind="underline" className="ml-auto size-[8vh] text-[#ff2d3d]" />
            </p>
          )}
          {page.tagline && (
            <p className={cn(marker, 'absolute right-[4%] bottom-[6%] hidden max-w-[360px] -rotate-3 text-right text-[clamp(1.4rem,3.6vh,2.6rem)] text-[#ffe52e] drop-shadow-[2px_3px_0_rgba(0,0,0,0.8)] lg:block')}>
              <StreetText text={page.tagline} />
            </p>
          )}
        </section>

        {/* hot on tiktok */}
        {kol.length > 0 && (
          <section className="flex min-h-0 flex-col gap-2 lg:col-span-5">
            <div className="flex shrink-0 items-center gap-2">
              <Tape className="text-[clamp(1.1rem,2.6vh,1.6rem)]">HOT TRÊN TIKTOK</Tape>
              <Scribble kind="smile" className="size-[4vh] min-h-7 min-w-7" />
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 py-1">
              {kol.slice(0, 3).map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVideo(v)}
                  className={cn(
                    'group relative mx-auto aspect-[9/16] h-full max-h-[340px] min-h-[220px] cursor-pointer overflow-hidden rounded-[12px] border-[3px] border-white bg-black shadow-[4px_5px_0_rgba(0,0,0,0.6)] transition-transform hover:z-10 hover:scale-105 lg:min-h-0',
                    tilt[i % 3],
                  )}
                >
                  <img src={v.thumbnail} alt="" className="absolute inset-0 size-full object-cover" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />
                  <span className="absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded bg-black">
                    <Music2 className="size-3.5" />
                  </span>
                  <span className={cn(marker, 'absolute inset-x-1.5 bottom-6 line-clamp-3 -rotate-6 text-left text-[clamp(0.9rem,2.1vh,1.35rem)]')}>{v.title}</span>
                  <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[11px] font-bold">
                    <Play className="size-3 fill-white" /> {formatCompact(v.views)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* real people */}
        {reviews.length > 0 && (
          <section className="flex min-h-0 flex-col rounded-[14px] bg-[#f5f3ee] p-3 text-ink shadow-[4px_5px_0_rgba(0,0,0,0.5)] lg:col-span-4 lg:rotate-[0.6deg]">
            <h2 className={cn(marker, 'shrink-0 -rotate-2 text-[clamp(1.6rem,3.6vh,2.4rem)]')}>
              Người thật <span className="text-[#ff2d3d]">nói gì?</span>
            </h2>
            <div className="mt-1 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
              {reviews.slice(0, 2).map((r) => (
                <article key={r.id} className="flex min-h-0 gap-2 rounded-[10px] bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded bg-[#1877f2] text-[10px] font-bold text-white">f</span>
                      {!r.anonymous && <Avatar src={r.user.avatar || undefined} name={r.user.name} className="size-6" />}
                      <p className="truncate text-xs font-semibold">{r.user.name}</p>
                      <span className="shrink-0 text-[10px] text-muted">{formatRelative(r.createdAt)}</span>
                    </div>
                    <p className="line-clamp-3 text-[clamp(0.7rem,1.45vh,0.85rem)] leading-snug text-ink-soft">{r.content}</p>
                  </div>
                  {r.media[0] && <img src={r.media[0].thumbnail} alt="" className="aspect-square h-[clamp(56px,8vh,84px)] shrink-0 rounded-[8px] object-cover" />}
                </article>
              ))}
            </div>
            <Link to={`${paths.product(product.slug)}#reviews`} className={cn(comic, 'mt-1.5 inline-flex shrink-0 items-center gap-1 text-lg hover:text-[#ff2d3d]')}>
              Xem thêm đánh giá thật <ArrowRight className="size-4" />
            </Link>
          </section>
        )}

        {/* colours */}
        <section className="flex min-h-0 flex-col rounded-[14px] bg-[#f5f3ee] p-3 text-ink shadow-[4px_5px_0_rgba(0,0,0,0.5)] lg:col-span-3 lg:-rotate-[0.6deg]">
          <h2 className={cn(marker, 'shrink-0 -rotate-2 text-[clamp(1.4rem,3.2vh,2.1rem)]')}>
            Chọn màu <span className="text-[#ff2d3d]">bật chất riêng</span>
          </h2>
          <div className="mt-1 grid min-h-0 flex-1 grid-cols-3 content-center gap-x-2 gap-y-1">
            {product.colors.slice(0, 6).map((c) => (
              <button key={c.id} type="button" onClick={() => setColor(c.id)} aria-pressed={colorId === c.id} className="flex cursor-pointer flex-col items-center gap-1">
                <span
                  className={cn(
                    'relative block aspect-square w-full max-w-[min(84px,9.5vh)] overflow-hidden rounded-[12px] bg-white ring-[3px]',
                    colorId === c.id ? 'ring-[#ff2d3d]' : 'ring-transparent',
                  )}
                >
                  <img src={c.image} alt="" className="size-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 h-1/2 mix-blend-multiply" style={{ background: `linear-gradient(transparent, ${c.hex})` }} />
                </span>
                <span className="text-[11px] leading-tight font-semibold">{c.name}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* buy bar */}
      <footer className="pb-safe sticky bottom-0 z-30 shrink-0 bg-white text-ink">
        <div className="flex items-center gap-4 px-4 py-2 lg:px-8">
          <TrustRow className="hidden flex-1 lg:grid" />
          <div className="flex shrink-0 items-baseline gap-2 max-lg:flex-1 max-lg:flex-col max-lg:gap-0">
            {product.originalPrice > product.price && <span className="text-sm text-subtle line-through">{formatPrice(product.originalPrice)}</span>}
            <span className={cn(comic, 'text-3xl text-[#ff2d3d]')}>{formatPrice(product.price)}</span>
          </div>
          <BrushButton onClick={buyNow} disabled={!inStock} className="px-6 py-2 text-xl md:text-2xl">
            {inStock ? page.ctaText || 'Mua ngay' : 'Tạm hết hàng'}
          </BrushButton>
        </div>
      </footer>
      <KolVideoViewer review={video} playlist={kol} onChange={setVideo} onClose={() => setVideo(null)} />
    </div>
  )
}
