import { ArrowDown, ChevronDown, Heart, Link2, MessageCircle, Music2, ShoppingCart, Star } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { KolMediaPlayer } from '@/components/jamir/review/KolMedia'
import { Avatar } from '@/components/ui/avatar'
import { toast } from '@/components/ui/toast'
import { usePurchaseActions } from '@/hooks/usePurchaseActions'
import { paths } from '@/lib/paths'
import { cn, formatCompact, formatPrice, formatRelative } from '@/lib/utils'
import { useSelectionStore } from '@/stores/selectionStore'
import { useIsWishlisted, useWishlistStore } from '@/stores/wishlistStore'
import type { LandingPayload } from '@/types/domain'
import { comic, StreetText, TrustRow, useStreetFonts } from './street'

const neon = 'bg-gradient-to-r from-[#ff2d78] via-[#ff7ad9] to-[#25f4ee] bg-clip-text text-transparent'

/**
 * Landing page, "feed" theme — scrolls like TikTok: every part fills the screen
 * and snaps (product video → KOL clips → comments as chat → swipe colours → buy).
 * Neon on black, side action rail, buy button always floating.
 */
export function LandingFeed({ data: { page, product, reviews, kol } }: { data: LandingPayload }) {
  useStreetFonts()
  const { buyNow, inStock } = usePurchaseActions(product)
  const colorId = useSelectionStore((s) => s.colorId)
  const setColor = useSelectionStore((s) => s.setColor)
  const saved = useIsWishlisted(product.id)
  const toggleWish = useWishlistStore((s) => s.toggle)
  const scroller = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const left = useCountdown(page.countdownEndsAt)
  const heroVideo = !product.video.embedUrl && product.video.src ? product.video.src : ''
  const heroImage = page.heroMedia?.src || product.gallery[0] || product.thumbnail
  const clips = kol.slice(0, 3)
  const steps = 1 + clips.length + (reviews.length ? 1 : 0) + (product.colors.length > 1 ? 1 : 0) + 1

  // which screen is in view (dots + autoplay)
  useEffect(() => {
    const root = scroller.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.step)
          const v = e.target.querySelector('video')
          if (e.isIntersecting) {
            setStep(i)
            void v?.play().catch(() => {})
          } else v?.pause()
        }
      },
      { root, threshold: 0.6 },
    )
    root.querySelectorAll('[data-step]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [steps])

  const go = (i: number) => scroller.current?.querySelector(`[data-step="${i}"]`)?.scrollIntoView({ behavior: 'smooth' })
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}${paths.landing(page.slug)}`)
      toast.success('Đã sao chép link', page.headline.replace(/[*[\]]/g, ''))
    } catch {
      /* clipboard blocked */
    }
  }

  let n = 0
  return (
    <div className="relative h-dvh bg-black text-white">
      <div ref={scroller} className="scrollbar-none h-full snap-y snap-mandatory overflow-y-auto">
        {/* 1. product video */}
        <Screen step={n++}>
          {heroVideo ? (
            <video src={heroVideo} poster={product.video.poster || heroImage} muted loop playsInline className="absolute inset-0 size-full object-cover" />
          ) : (
            <img src={heroImage} alt="" className="absolute inset-0 size-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/85" />
          <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 md:p-6">
            <Link to="/" className={cn(comic, 'text-2xl')}>
              JAMIR
            </Link>
            {page.badge && <span className="rounded-full border border-[#25f4ee] px-3 py-1 text-xs font-bold text-[#25f4ee] shadow-[0_0_14px_#25f4ee]">{page.badge}</span>}
          </header>
          <Rail
            items={[
              { icon: <Heart className={cn('size-7', saved ? 'fill-[#ff2d78] text-[#ff2d78]' : 'fill-white')} />, label: formatCompact(product.video.likes + (saved ? 1 : 0)), onClick: () => toggleWish(product.id) },
              { icon: <Star className="size-7 fill-[#ffd84d] text-[#ffd84d]" />, label: product.rating.toFixed(1), onClick: () => go(1 + clips.length) },
              { icon: <MessageCircle className="size-7 fill-white" />, label: formatCompact(product.reviewCount), onClick: () => go(1 + clips.length) },
              { icon: <Link2 className="size-7" />, label: 'Chia sẻ', onClick: copyLink },
            ]}
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 pr-20 pb-28 md:max-w-[640px] md:p-10 md:pb-32">
            <p className="text-sm font-semibold text-white/80">@jamir.official · {formatCompact(product.soldCount)} đã mua</p>
            <h1 className={cn(comic, 'text-5xl leading-[0.95] md:text-7xl')}>
              <span className={neon}>
                <StreetText text={page.headline.replace(/\[|\]/g, '')} />
              </span>
            </h1>
            {page.subheadline && <p className="max-w-md text-base text-white/85">{page.subheadline}</p>}
            <p className="flex items-center gap-2 overflow-hidden text-sm text-white/80">
              <Music2 className="size-4 shrink-0" />
              <span className="animate-[marquee_12s_linear_infinite] whitespace-nowrap">{page.sideNote || product.name} · âm thanh gốc · JAMIR</span>
            </p>
          </div>
          <button type="button" onClick={() => go(1)} className="absolute bottom-24 left-1/2 hidden -translate-x-1/2 animate-bounce cursor-pointer text-white/70 md:block" aria-label="Lướt xuống">
            <ChevronDown className="size-8" />
          </button>
        </Screen>

        {/* 2. KOL clips */}
        {clips.map((v) => (
          <Screen key={v.id} step={n++}>
            <img src={v.thumbnail} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl" />
            <div className="relative mx-auto flex h-full max-w-[min(100%,56dvh)] items-center">
              <KolMediaPlayer review={v} className="aspect-[9/16] max-h-full w-full md:rounded-[24px]" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5 pb-28 md:p-10 md:pb-32">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Avatar src={v.kol.avatar} name={v.kol.name} className="size-8 ring-2 ring-[#ff2d78]" /> @{v.kol.name.toLowerCase().replace(/\s+/g, '')}
                <span className="rounded bg-white/15 px-1.5 text-[11px] uppercase">{v.source === 'jamir' ? 'Local' : v.source}</span>
              </p>
              <p className="mt-2 max-w-lg text-lg font-semibold">{v.title}</p>
              <p className="text-sm text-white/70">{formatCompact(v.views)} lượt xem</p>
            </div>
          </Screen>
        ))}

        {/* 3. comments as chat */}
        {reviews.length > 0 && (
          <Screen step={n++} className="bg-[radial-gradient(circle_at_20%_20%,#3b0a2a,transparent_50%),radial-gradient(circle_at_80%_80%,#062a33,transparent_50%)]">
            <div className="mx-auto flex h-full max-w-[640px] flex-col justify-center gap-4 px-5 pb-24">
              <h2 className={cn(comic, 'text-5xl md:text-6xl')}>
                <span className={neon}>Mọi người nói gì</span>
              </h2>
              {reviews.slice(0, 3).map((r, i) => (
                <div key={r.id} className={cn('flex items-end gap-2', i % 2 && 'flex-row-reverse')}>
                  {r.anonymous ? <span className="size-9 shrink-0 rounded-full bg-white/20" /> : <Avatar src={r.user.avatar || undefined} name={r.user.name} className="size-9" />}
                  <div className={cn('max-w-[80%] rounded-[22px] px-4 py-3', i % 2 ? 'rounded-br-md bg-gradient-to-br from-[#ff2d78] to-[#a21caf]' : 'rounded-bl-md bg-white/12 backdrop-blur')}>
                    <p className="text-xs font-semibold text-white/75">
                      {r.user.name} · {'★'.repeat(r.rating)} · {formatRelative(r.createdAt)}
                    </p>
                    <p className="mt-0.5 text-[15px] leading-snug">{r.content}</p>
                  </div>
                </div>
              ))}
              <Link to={`${paths.product(product.slug)}#reviews`} className="self-center text-sm font-semibold text-[#25f4ee] hover:underline">
                Xem {product.reviewCount} cảm nhận →
              </Link>
            </div>
          </Screen>
        )}

        {/* 4. swipe colours */}
        {product.colors.length > 1 && (
          <Screen step={n++}>
            <div className="flex h-full flex-col justify-center gap-6 pb-24">
              <h2 className={cn(comic, 'px-5 text-center text-5xl md:text-6xl')}>
                <span className={neon}>Vuốt chọn màu</span>
              </h2>
              <div className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto px-[18vw] md:px-[35vw]">
                {product.colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={(e) => {
                      setColor(c.id)
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                    }}
                    className={cn('group w-[64vw] max-w-[320px] shrink-0 cursor-pointer snap-center transition-transform', colorId === c.id ? 'scale-100' : 'scale-90 opacity-60')}
                  >
                    <span className="relative block aspect-square overflow-hidden rounded-[28px] shadow-[0_0_40px_rgba(255,45,120,0.35)]" style={{ boxShadow: colorId === c.id ? `0 0 50px ${c.hex}` : undefined }}>
                      <img src={c.image} alt="" className="size-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 h-1/2 mix-blend-multiply" style={{ background: `linear-gradient(transparent, ${c.hex})` }} />
                    </span>
                    <span className={cn(comic, 'mt-3 block text-center text-3xl')}>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </Screen>
        )}

        {/* 5. buy */}
        <Screen step={n++} className="bg-[radial-gradient(circle_at_50%_30%,#3b0a2a,#000_60%)]">
          <div className="mx-auto flex h-full max-w-[560px] flex-col items-center justify-center gap-5 px-5 pb-28 text-center">
            <img src={product.thumbnail} alt="" className="size-40 rounded-[28px] object-cover shadow-[0_0_60px_rgba(37,244,238,0.4)] md:size-52" />
            <p className="text-lg font-semibold">{product.name}</p>
            {product.originalPrice > product.price && <p className="text-white/50 line-through">{formatPrice(product.originalPrice)}</p>}
            <p className={cn(comic, 'text-7xl md:text-8xl')}>
              <span className={neon}>{formatPrice(product.price)}</span>
            </p>
            {left && <p className="rounded-full border border-[#ff2d78] px-4 py-1.5 font-mono text-sm text-[#ff7ad9] tabular-nums">Ưu đãi còn {left}</p>}
            {product.gifts?.[0] && <p className="text-sm text-white/80">🎁 Tặng {product.gifts.map((g) => g.name).join(', ')}</p>}
            <TrustRow dark className="w-full" />
          </div>
        </Screen>
      </div>

      {/* position dots */}
      <div className="pointer-events-none absolute top-1/2 right-2 z-20 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        {Array.from({ length: steps }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`Đến phần ${i + 1}`}
            className={cn('pointer-events-auto w-1.5 cursor-pointer rounded-full transition-all', step === i ? 'h-6 bg-[#25f4ee]' : 'h-1.5 bg-white/40')}
          />
        ))}
      </div>

      {/* floating buy */}
      <div className="pb-safe pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center p-4">
        <button
          type="button"
          onClick={buyNow}
          disabled={!inStock}
          className={cn(
            comic,
            'pointer-events-auto flex items-center gap-3 rounded-full bg-gradient-to-r from-[#ff2d78] to-[#a21caf] px-8 py-3 text-2xl shadow-[0_0_30px_rgba(255,45,120,0.6)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50',
          )}
        >
          <ShoppingCart className="size-6" />
          {inStock ? `${page.ctaText || 'Mua ngay'} · ${formatPrice(product.price)}` : 'Tạm hết hàng'}
        </button>
        {step === 0 && <ArrowDown className="pointer-events-none absolute -top-2 right-6 size-5 animate-bounce text-white/60 md:hidden" />}
      </div>
    </div>
  )
}

function Screen({ step, className, children }: { step: number; className?: string; children: ReactNode }) {
  return (
    <section data-step={step} className={cn('relative h-dvh w-full snap-start overflow-hidden', className)}>
      {children}
    </section>
  )
}

function Rail({ items }: { items: { icon: ReactNode; label: string; onClick: () => void }[] }) {
  return (
    <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-5 md:right-8">
      {items.map((it) => (
        <button key={it.label} type="button" onClick={it.onClick} className="flex cursor-pointer flex-col items-center gap-1 text-xs font-bold drop-shadow">
          {it.icon}
          {it.label}
        </button>
      ))}
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
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${Math.floor(s / 86400) ? `${Math.floor(s / 86400)} ngày ` : ''}${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}
