import { ChevronUp, Heart, MessageCircle, Search, Share2, ShoppingCart } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from '@/components/ui/toast'
import { usePrefetchProduct, useProduct, useProducts } from '@/hooks/queries'
import { paths } from '@/lib/paths'
import { cn, formatCompact, formatPrice } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'
import { useIsWishlisted, useWishlistStore } from '@/stores/wishlistStore'
import { LogoMark } from '../brand/Logo'
import { shareProduct } from '../product/ProductVideo'
import { MobileSearch } from '../navigation/MobileHeader'

// survives product page → back, for the whole SPA session
let lastIndex = 0
const SWIPE = 56

/**
 * Mobile home (< md) = step 1 "Video sản phẩm" of the 7-step flow:
 *   swipe ← →  : previous / next product (or tap the strip)
 *   swipe ↑    : go deeper into this product (step 2 KOL Review on the product page)
 */
export function MobileFeed() {
  const navigate = useNavigate()
  const { data: list = [] } = useProducts()
  const [index, setIndex] = useState(lastIndex)
  const [dir, setDir] = useState<1 | -1>(1)
  const i = list.length ? ((index % list.length) + list.length) % list.length : 0
  const cur = list[i]
  const { data: product } = useProduct(cur?.slug ?? '', { enabled: !!cur })
  const full = product?.slug === cur?.slug ? product : undefined
  const prefetch = usePrefetchProduct()
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)
  const liked = useIsWishlisted(cur?.id ?? '')
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const stripRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    lastIndex = i
    if (!list.length) return
    prefetch(list[(i + 1) % list.length]!.slug)
    prefetch(list[(i - 1 + list.length) % list.length]!.slug)
    const strip = stripRef.current
    const el = strip?.children[i] as HTMLElement | undefined
    if (strip && el) strip.scrollTo({ left: el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' })
  }, [i, list, prefetch])

  const go = (d: 1 | -1) => {
    setDir(d)
    setIndex(i + d)
  }
  const pick = (n: number) => {
    if (n === i) return openStep('kol-reviews')
    setDir(n > i ? 1 : -1)
    setIndex(n)
  }
  const openStep = (step: string) => cur && navigate(paths.product(cur.slug), { state: { step } })

  // gestures (the strip scrolls natively and is excluded)
  const start = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    if (!t || e.touches.length > 1 || (e.target as HTMLElement).closest('[data-feed-ignore]')) return
    start.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = start.current
    const t = e.changedTouches[0]
    start.current = null
    if (!s || !t) return
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > SWIPE) go(dx < 0 ? 1 : -1)
    else if (dy < -SWIPE && Math.abs(dy) > Math.abs(dx)) openStep('kol-reviews')
  }

  const video = full?.video
  const playable = video?.src && !video.embedUrl
  const poster = video?.poster || cur?.thumbnail

  return (
    <section
      aria-label="Video sản phẩm"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative isolate h-[calc(100dvh-4rem-env(safe-area-inset-bottom,0px))] min-h-[520px] touch-none overflow-hidden bg-black text-white select-none"
    >
      {/* media */}
      <AnimatePresence initial={false} custom={dir}>
        {cur && (
          <motion.div
            key={cur.id}
            custom={dir}
            initial={{ x: `${dir * 100}%` }}
            animate={{ x: 0 }}
            exit={{ x: `${dir * -100}%` }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 -z-10"
          >
            {playable ? (
              <video key={video!.src} src={video!.src} poster={poster} autoPlay muted loop playsInline preload="metadata" className="size-full object-cover" />
            ) : (
              poster && <img src={poster} alt="" className="size-full object-cover" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[62%] bg-gradient-to-t from-black via-black/70 to-transparent" />

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex h-14 items-center gap-2 px-4">
        <Link to="/" aria-label="Jamir — Trang chủ" className="flex items-center gap-1.5">
          <LogoMark className="size-7" />
          <span className="text-lg font-extrabold tracking-tight min-[360px]:text-xl">Jamir</span>
        </Link>
        <nav aria-label="Nguồn video" className="ml-auto flex items-center gap-3 text-[13px] font-semibold whitespace-nowrap min-[360px]:gap-4">
          <span aria-current="page" className="relative text-white after:absolute after:inset-x-1 after:-bottom-1.5 after:h-0.5 after:rounded-full after:bg-white">
            Đang follow
          </span>
          <Link to="/explore" className="text-white/65">
            Khám phá
          </Link>
        </nav>
        <button type="button" aria-label="Tìm kiếm" onClick={() => setSearchOpen(true)} className="-mr-2 inline-flex size-11 cursor-pointer items-center justify-center">
          <Search className="size-[22px]" />
        </button>
      </div>
      <MobileSearch />

      {/* tagline + badge */}
      {cur && (
        <div className="absolute top-16 left-4 max-w-[70%]">
          {cur.highlight && <span className="rounded-md bg-gradient-to-r from-pink-500 to-orange-500 px-2 py-0.5 text-[11px] font-extrabold uppercase">• Hot</span>}
          {video?.tagline && <p className="mt-3 text-[26px] leading-tight font-extrabold italic drop-shadow-lg">{video.tagline}</p>}
        </div>
      )}

      {/* right rail */}
      {cur && (
        <div className="absolute right-2 bottom-[208px] flex flex-col items-center gap-4">
          <Rail
            label={liked ? 'Bỏ khỏi Yêu thích' : 'Thêm vào Yêu thích'}
            count={video ? formatCompact(video.likes + (liked ? 1 : 0)) : ''}
            pressed={liked}
            onClick={() => {
              const added = toggleWishlist(cur.id)
              toast.success(added ? 'Đã thêm vào Yêu thích' : 'Đã bỏ khỏi Yêu thích')
            }}
          >
            <Heart className={cn('size-8 drop-shadow', liked ? 'fill-red-500 text-red-500' : 'fill-white text-white')} />
          </Rail>
          <Rail label="Xem đánh giá" count={formatCompact(cur.reviewCount)} onClick={() => openStep('reviews')}>
            <MessageCircle className="size-8 fill-white text-white drop-shadow" />
          </Rail>
          <Rail label="Chia sẻ" count="Chia sẻ" onClick={() => void shareProduct(cur.name, cur.slug)}>
            <Share2 className="size-7 drop-shadow" />
          </Rail>
          <Rail label="Mua ngay" count="Mua" onClick={() => openStep('dat-hang')}>
            <ShoppingCart className="size-7 drop-shadow" />
          </Rail>
        </div>
      )}

      {/* product info */}
      {cur && (
        <div className="absolute right-20 bottom-[150px] left-4">
          <h2 className="truncate text-xl font-extrabold drop-shadow">{cur.name}</h2>
          <p className="mt-1 flex items-center gap-2">
            <span className="text-[26px] leading-none font-extrabold text-brand-300 tabular-nums">{formatPrice(cur.price)}</span>
            {cur.originalPrice > cur.price && <span className="text-sm text-white/60 line-through">{formatPrice(cur.originalPrice)}</span>}
            {cur.discount > 0 && <span className="rounded-md bg-danger-strong px-1.5 py-0.5 text-xs font-bold">-{cur.discount}%</span>}
          </p>
        </div>
      )}

      {/* swipe-up cue */}
      <button
        type="button"
        onClick={() => openStep('kol-reviews')}
        className="absolute bottom-[112px] left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center text-[11px] font-semibold text-white/80"
      >
        <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
          <ChevronUp className="size-5" aria-hidden="true" />
        </motion.span>
        Vuốt lên xem chi tiết
      </button>

      {/* product strip (swipe ← → or tap) */}
      <div data-feed-ignore className="absolute inset-x-0 bottom-0 touch-pan-x pb-2">
        <ul ref={stripRef} className="scrollbar-none relative flex gap-2 overflow-x-auto px-3 pt-1" aria-label="Sản phẩm">
          {list.map((p, n) => (
            <li key={p.id} className="w-[68px] shrink-0">
              <button
                type="button"
                onClick={() => pick(n)}
                aria-current={n === i ? 'true' : undefined}
                aria-label={n === i ? `${p.name} — xem chi tiết` : p.name}
                className="flex w-full cursor-pointer flex-col items-center gap-1"
              >
                <span className={cn('block size-[64px] overflow-hidden rounded-[12px] border-2 bg-white/10 transition', n === i ? 'scale-105 border-brand-400 shadow-[0_0_0_3px_rgb(124_58_237/0.35)]' : 'border-transparent opacity-80')}>
                  <img src={p.thumbnail} alt="" className="size-full object-cover" />
                </span>
                <span className={cn('w-full truncate text-center text-[11px]', n === i ? 'font-bold text-white' : 'text-white/70')}>{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
        {list.length > 1 && (
          <div className="mt-1 flex justify-center gap-1" aria-hidden="true">
            {list.slice(0, 9).map((p, n) => (
              <span key={p.id} className={cn('h-1 rounded-full transition-all', n === Math.min(i, 8) ? 'w-3 bg-white' : 'w-1 bg-white/40')} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Rail({ label, count, pressed, onClick, children }: { label: string; count: string; pressed?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} aria-pressed={pressed} onClick={onClick} className="flex cursor-pointer flex-col items-center gap-0.5 transition-transform active:scale-90">
      {children}
      <span className="text-[11px] font-semibold drop-shadow">{count}</span>
    </button>
  )
}
