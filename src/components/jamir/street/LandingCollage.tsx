import { ArrowRight, Music2, Play, ShoppingCart, ThumbsUp } from 'lucide-react'
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
import { BrushButton, comic, marker, Scribble, StreetText, Tape, TornEdge, TrustRow, useStreetFonts } from './street'

const PAPER = '#f5f3ee'
/** yellow spray stroke behind text / along edges */
const spray = 'bg-[#ffe52e] [clip-path:polygon(0_35%,6%_5%,40%_20%,72%_0,100%_30%,95%_80%,60%_100%,25%_85%,3%_100%)]'

/**
 * Landing page, "collage" theme — built to match the reference street ad:
 *   ┌ hero: headline left, photo right, "Play anytime anywhere" ┐
 *   ├ HOT TRÊN TIKTOK (3 tilted clips)      │ NGƯỜI THẬT NÓI GÌ? ┤
 *   ├ lifestyle line ─────────────┐         │ closing photo      │
 *   │ CHỌN MÀU BẬT CHẤT RIÊNG (one row)     │ "Âm nhạc…"         │
 *   └ trust row ───────────────────────────────── Mua ngay ──────┘
 * Laid out as a poster column (max ~1000px) on dark spray-painted wall.
 */
export function LandingCollage({ data: { page, product, reviews, kol } }: { data: LandingPayload }) {
  useStreetFonts()
  const { buyNow, inStock } = usePurchaseActions(product)
  const colorId = useSelectionStore((s) => s.colorId)
  const setColor = useSelectionStore((s) => s.setColor)
  const openCart = useUiStore((s) => s.setCartOpen)
  const [video, setVideo] = useState<KolReview | null>(null)
  const hero = page.heroMedia?.src && page.heroMedia.type !== 'video' ? page.heroMedia.src : (product.gallery[0] ?? product.thumbnail)
  const lifestyle = product.gallery[1] ?? product.thumbnail
  const outro = product.gallery[2] ?? product.thumbnail
  const clips = kol.slice(0, 3)

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#0b0b0d] pb-24 text-white [background-image:repeating-linear-gradient(115deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px)]">
      <div className="relative mx-auto max-w-[1000px] bg-[#111113] shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        {/* ── hero ─────────────────────────────────────────── */}
        <section className="relative h-[560px] overflow-hidden md:h-[520px]">
          <img src={hero} alt="" className="absolute inset-0 size-full object-cover object-[70%_center]" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/10" />

          <header className="relative z-10 flex h-14 items-center justify-between px-5 md:px-7">
            <Link to="/" className={cn(comic, 'text-[26px] tracking-wider')}>
              JAMIR<sup className="text-[10px]">®</sup>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-white/90">
              <Link to={paths.product(product.slug)} className="hidden hover:text-[#ffe52e] sm:inline">
                Sản phẩm
              </Link>
              <a href="#video" className="hidden hover:text-[#ffe52e] sm:inline">
                Video
              </a>
              <a href="#danh-gia" className="hidden hover:text-[#ffe52e] sm:inline">
                Đánh giá
              </a>
              <button type="button" onClick={() => openCart(true)} aria-label="Giỏ hàng" className="cursor-pointer hover:text-[#ffe52e]">
                <ShoppingCart className="size-5" />
              </button>
            </nav>
          </header>

          <div className="relative flex max-w-[460px] flex-col gap-4 px-5 pt-2 md:px-7">
            <h1 className={cn(marker, 'relative -rotate-[4deg] text-[54px] drop-shadow-[3px_4px_0_rgba(0,0,0,0.85)] md:text-[64px]')}>
              <StreetText text={page.headline} big />
              <Scribble kind="crown" className="absolute top-0 right-[6%] size-12 rotate-12 text-[#ffe52e]" />
              <Scribble kind="underline" className="absolute -bottom-6 left-[38%] size-24 text-[#ff2d3d]" />
            </h1>
            {page.subheadline && <p className="mt-2 max-w-[270px] text-[15px] leading-snug text-white/90">{page.subheadline}</p>}
            <ul className="flex flex-wrap gap-5">
              {product.specs.slice(0, 3).map((f) => (
                <li key={f.label} className="flex items-center gap-1.5 text-xs leading-tight">
                  <Icon name={f.icon} className="size-7 text-white" strokeWidth={1.5} />
                  <span>
                    {f.label}
                    <br />
                    {f.value}
                  </span>
                </li>
              ))}
            </ul>
            <Scribble kind="arrow" className="absolute top-[56%] right-[-30px] hidden size-20 -rotate-[30deg] text-[#ffe52e] md:block" />
          </div>

          {page.sideNote && (
            <div className="absolute top-[30%] right-[3%] hidden w-[150px] rotate-[-14deg] text-center md:block">
              <Scribble kind="crown" className="mx-auto size-10 text-white" />
              <p className={cn(marker, 'text-[30px] leading-[0.95]')}>{page.sideNote}</p>
              <Scribble kind="underline" className="mx-auto -mt-4 size-20 text-[#ff2d3d]" />
            </div>
          )}
          <Scribble kind="sparks" className="absolute top-[18%] left-[44%] hidden size-14 rotate-[-20deg] text-white md:block" />
          <TornEdge color="#111113" flip className="absolute inset-x-0 bottom-0" />
        </section>

        {/* ── HOT TRÊN TIKTOK │ NGƯỜI THẬT NÓI GÌ? ─────────── */}
        <section className="relative grid gap-6 px-4 pt-3 pb-6 md:grid-cols-[1.55fr_1fr] md:gap-3 md:px-5">
          <span aria-hidden="true" className={cn(spray, 'absolute top-[35%] -left-8 h-16 w-40 -rotate-12 opacity-90')} />
          {clips.length > 0 && (
            <div id="video" className="relative scroll-mt-4">
              <div className="relative z-10 mb-1 flex items-center gap-2 pl-[36%]">
                <Tape className="text-xl md:text-2xl">HOT TRÊN TIKTOK</Tape>
                <Scribble kind="smile" className="size-10 text-white" />
                <Scribble kind="arrow" className="absolute top-8 right-[16%] size-10 rotate-[60deg] text-[#ffe52e]" />
              </div>
              <div className="grid grid-cols-[1.1fr_1fr_1fr] items-end gap-2 md:gap-3">
                {clips.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVideo(v)}
                    className={cn(
                      'group relative cursor-pointer overflow-hidden rounded-[10px] border-[4px] border-white bg-black shadow-[5px_7px_0_rgba(0,0,0,0.65)] transition-transform hover:z-10 hover:scale-105',
                      i === 0 ? 'aspect-[3/5] -rotate-[5deg]' : i === 1 ? 'aspect-[9/16] rotate-[2deg]' : 'aspect-[9/16] -rotate-[1deg]',
                    )}
                  >
                    <img src={v.thumbnail} alt="" className="absolute inset-0 size-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {i === 0 && (
                      <span className="absolute top-2 left-2 flex size-9 items-center justify-center rounded-[9px] bg-black text-white shadow-[2px_2px_0_#25f4ee,-2px_-2px_0_#fe2c55]">
                        <Music2 className="size-5" />
                      </span>
                    )}
                    <span className={cn(marker, 'absolute inset-x-2 bottom-8 line-clamp-3 -rotate-[10deg] text-left text-[22px] leading-[0.95] text-white md:text-[26px]')}>{v.title}</span>
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] font-bold">
                      <Play className="size-3 fill-white" /> {formatCompact(v.views)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {page.showReviews && reviews.length > 0 && (
            <div id="danh-gia" className="relative scroll-mt-4 self-start pt-4 text-ink">
              <ThumbsUp className="absolute -top-1 right-0 z-10 size-16 -rotate-12 text-[#ff2d3d]" strokeWidth={1.4} />
              <TornEdge color={PAPER} />
              <div className="px-4 pt-1 pb-3" style={{ background: PAPER }}>
                <h2 className={cn(marker, 'mb-3 -rotate-[4deg] text-[38px] leading-[0.9]')}>
                  Người thật
                  <br />
                  <span className="relative text-[#ff2d3d]">
                    nói gì?
                    <Scribble kind="underline" className="absolute -bottom-7 left-0 size-20 text-[#ff2d3d]" />
                  </span>
                </h2>
                <div className="flex flex-col gap-2.5">
                  {reviews.slice(0, 2).map((r) => (
                    <article key={r.id} className="flex gap-2">
                      <div className="min-w-0 flex-1 rounded-[10px] bg-white p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                        <div className="mb-1 flex items-center gap-1.5">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-xs font-bold text-white">f</span>
                          {!r.anonymous && <Avatar src={r.user.avatar || undefined} name={r.user.name} className="size-6" />}
                          <div className="min-w-0 leading-tight">
                            <p className="truncate text-[13px] font-semibold">{r.user.name}</p>
                            <p className="text-[10px] text-muted">{formatRelative(r.createdAt)}</p>
                          </div>
                        </div>
                        <p className="line-clamp-4 text-[13px] leading-snug text-ink-soft">{r.content}</p>
                      </div>
                      {r.media[0] && <img src={r.media[0].thumbnail} alt="" className="w-24 shrink-0 self-stretch rounded-[10px] object-cover" />}
                    </article>
                  ))}
                </div>
              </div>
              <TornEdge color={PAPER} flip />
              <div className="relative mt-1 flex items-center justify-end">
                <ThumbsUp className="absolute -top-2 left-[-6px] size-14 -rotate-[20deg] fill-white text-ink" strokeWidth={1.5} />
                <Link to={`${paths.product(product.slug)}#reviews`} className="flex items-center gap-1.5 text-sm font-bold text-[#ffe52e] hover:text-white">
                  Xem thêm đánh giá thật <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ── lifestyle + colours │ closing photo ─────────── */}
        <section className="relative grid gap-3 px-4 pb-5 md:grid-cols-[2fr_1fr] md:px-5">
          <div className="flex flex-col">
            <div className="relative h-[230px] overflow-hidden rounded-t-[12px]">
              <img src={lifestyle} alt="" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
              <span aria-hidden="true" className={cn(spray, 'absolute top-[44%] left-[-4%] h-20 w-[46%] -rotate-6 opacity-95')} />
              {page.tagline && (
                <p className={cn(marker, 'absolute top-6 left-4 max-w-[260px] -rotate-[8deg] text-[30px] leading-[0.95] text-white drop-shadow-[2px_3px_0_rgba(0,0,0,0.9)]')}>
                  <StreetText text={page.tagline} />
                </p>
              )}
              <Scribble kind="crown" className="absolute top-5 left-[46%] size-10 text-white" />
            </div>
            {product.colors.length > 1 && (
              <div id="mau" className="relative -mt-8 scroll-mt-4 text-ink">
                <TornEdge color={PAPER} />
                <div className="px-4 pt-0 pb-4" style={{ background: PAPER }}>
                  <h2 className={cn(marker, 'relative mx-auto mb-3 w-fit -rotate-[4deg] text-center text-[34px] leading-[0.9]')}>
                    Chọn màu
                    <br />
                    <span className="text-[#ff2d3d]">bật chất riêng</span>
                    <Scribble kind="sparks" className="absolute -top-2 -left-12 size-10 text-[#ffe52e]" />
                  </h2>
                  {/* one row, like the poster */}
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(product.colors.length, 6)}, minmax(0,1fr))` }}>
                    {product.colors.slice(0, 6).map((c) => (
                      <button key={c.id} type="button" onClick={() => setColor(c.id)} aria-pressed={colorId === c.id} className="flex cursor-pointer flex-col items-center gap-1">
                        <span
                          className={cn(
                            'relative block aspect-square w-full overflow-hidden rounded-[12px] bg-white ring-[3px] transition-transform hover:-translate-y-1',
                            colorId === c.id ? 'ring-[#ff2d3d]' : 'ring-transparent',
                          )}
                        >
                          <img src={c.image} alt="" className="size-full object-cover" />
                          <span className="absolute inset-x-0 bottom-0 h-1/2 mix-blend-multiply" style={{ background: `linear-gradient(transparent, ${c.hex})` }} />
                        </span>
                        <span className="size-3 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
                        <span className="text-[12px] leading-tight">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative min-h-[300px] overflow-hidden rounded-[12px]">
            <img src={outro} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/10 to-black/30" />
            <Scribble kind="crown" className="absolute top-6 right-6 size-11 text-white" />
            <p className={cn(marker, 'absolute top-[24%] left-4 max-w-[200px] -rotate-[10deg] text-[30px] leading-[0.95] text-white drop-shadow-[2px_3px_0_rgba(0,0,0,0.9)]')}>
              {page.outroLine || 'Âm nhạc không giới hạn'}
            </p>
            <Scribble kind="smile" className="absolute top-[42%] left-[52%] size-9 text-white" />
          </div>
        </section>

        {/* ── bottom bar (sticky) ─────────────────────────── */}
        <div className="pb-safe sticky bottom-0 z-40 bg-white text-ink shadow-[0_-10px_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-4 px-4 py-2 md:px-5">
            <TrustRow className="hidden flex-1 md:grid" />
            <div className="min-w-0 flex-1 md:hidden">
              <p className="truncate text-xs text-muted">{product.name}</p>
              <p className={cn(comic, 'text-2xl text-[#ff2d3d]')}>{formatPrice(product.price)}</p>
            </div>
            <BrushButton onClick={buyNow} disabled={!inStock} className="px-7 py-2.5 text-2xl md:text-3xl">
              {inStock ? page.ctaText || 'Mua ngay' : 'Tạm hết hàng'}
            </BrushButton>
          </div>
        </div>
      </div>
      <KolVideoViewer review={video} playlist={kol} onChange={setVideo} onClose={() => setVideo(null)} />
    </div>
  )
}
