import { useQueryClient } from '@tanstack/react-query'
import { Play, ShoppingCart, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { qk } from '@/hooks/queries'
import { usePurchaseActions } from '@/hooks/usePurchaseActions'
import { paths } from '@/lib/paths'
import { cn, formatPrice } from '@/lib/utils'
import { normalizeEmbedUrl, parseVideoUrl } from '@/lib/video'
import { getProductBySlug } from '@/services'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useUiStore } from '@/stores/uiStore'
import type { KolReview, LandingHotspot, LandingPayload, Product, VideoSource } from '@/types/domain'

/** Platform from a pasted link (direct files fall through). */
function sourceOf(url: string): VideoSource | null {
  if (/youtu\.?be/.test(url)) return 'youtube'
  if (/tiktok\.com/.test(url)) return 'tiktok'
  if (/facebook\.com|fb\.watch/.test(url)) return 'facebook'
  return null
}

const lineFor = (p: Product, colorId?: string) => {
  const c = p.colors.find((x) => x.id === colorId) ?? p.colors[0]!
  return {
    product: { id: p.id, slug: p.slug, name: p.name, thumbnail: p.thumbnail, price: p.price, originalPrice: p.originalPrice, stock: p.stock, gifts: p.gifts?.filter((g) => !g.hidden).map((g) => g.name) },
    colorId: c.id,
    colorName: c.name,
    colorHex: c.hex,
    quantity: 1,
  }
}

/**
 * Landing page, "design" theme: the finished ad image shown as-is, with areas
 * drawn in the admin. Video areas show a play button and open the configured
 * clip in a popup; buy areas glow and open checkout for the chosen product.
 */
export function LandingDesign({ data: { page, product, kol } }: { data: LandingPayload }) {
  const { buyNow, inStock } = usePurchaseActions(product)
  const setColor = useSelectionStore((s) => s.setColor)
  const openBuyNow = useCheckoutStore((s) => s.openBuyNow)
  const openCart = useUiStore((s) => s.setCartOpen)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [clip, setClip] = useState<Clip | null>(null)
  const [buyVisible, setBuyVisible] = useState(false)
  const buyRef = useRef<HTMLButtonElement | null>(null)
  const preview = typeof window !== 'undefined' && window.location.pathname.startsWith('/preview')
  const spots = page.hotspots ?? []
  const image = page.designImage || page.heroMedia?.src || product.thumbnail

  // floating buy button hides while the image's own buy area is on screen
  useEffect(() => {
    const el = buyRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setBuyVisible(!!e?.isIntersecting), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [spots.length])

  const buy = async (slug?: string) => {
    if (!slug || slug === product.slug) return buyNow()
    try {
      const p = await qc.fetchQuery({ queryKey: qk.product(slug), queryFn: () => getProductBySlug(slug), staleTime: 60_000 })
      if (p.stock <= 0) return toast.info('Sản phẩm tạm hết hàng', p.name)
      openBuyNow(lineFor(p))
    } catch {
      toast.error('Không mở được sản phẩm')
    }
  }

  const run = (h: LandingHotspot) => {
    switch (h.action) {
      case 'buy':
        return void buy(h.productSlug)
      case 'cart':
        return openCart(true)
      case 'video': {
        if (h.videoUrl) return setClip({ url: h.videoUrl, title: h.label || page.headline })
        const v = kol.find((x) => x.id === h.value) ?? kol[Number(h.value) || 0]
        return v ? setClip(clipOf(v)) : undefined
      }
      case 'color': {
        const c = product.colors.find((x) => x.id === h.value)
        if (!c) return buyNow()
        setColor(c.id)
        return toast.success(`Đã chọn màu ${c.name}`, 'Bấm Mua ngay để đặt hàng')
      }
      case 'reviews':
        return navigate(`${paths.product(product.slug)}#reviews`)
      case 'product':
        return navigate(paths.product(h.productSlug || product.slug))
      case 'link':
        if (!h.value) return
        return /^https?:\/\//.test(h.value) ? window.open(h.value, '_blank', 'noopener') : navigate(h.value)
    }
  }
  const firstBuy = spots.findIndex((h) => h.action === 'buy')

  return (
    <div className="min-h-dvh bg-[#0b0b0d] pb-24 md:pb-10">
      <div className="relative mx-auto w-full" style={{ maxWidth: page.designWidth || 900 }}>
        <img src={image} alt={page.headline.replace(/[*[\]]/g, '')} className="block h-auto w-full select-none" draggable={false} />
        {spots.map((h, i) => {
          const isBuy = h.action === 'buy'
          const isVideo = h.action === 'video'
          return (
            <button
              key={i}
              ref={i === firstBuy ? buyRef : undefined}
              type="button"
              onClick={() => run(h)}
              aria-label={h.label || h.action}
              title={h.label}
              className={cn(
                'group absolute cursor-pointer rounded-[12px] transition-[transform,background-color,box-shadow] focus-visible:shadow-[0_0_0_3px_#ffe52e] focus-visible:outline-none',
                isBuy ? 'hover:scale-[1.03] active:scale-[0.98]' : 'hover:bg-white/10 hover:shadow-[0_0_0_3px_rgba(255,229,46,0.85)]',
                isBuy && h.pulse !== false && 'animate-[buy-glow_1.8s_ease-in-out_infinite] motion-reduce:animate-none',
                preview && 'shadow-[0_0_0_2px_rgba(255,229,46,0.9)]',
              )}
              style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
            >
              {isVideo && h.play !== false && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="relative flex size-[min(64px,38%)] min-h-10 min-w-10 items-center justify-center rounded-full bg-white/90 text-[#ff2d3d] shadow-[0_6px_24px_rgba(0,0,0,0.45)] transition-transform group-hover:scale-110">
                    <span className="absolute inset-0 animate-ping rounded-full bg-white/60 motion-reduce:hidden" />
                    <Play className="relative size-1/2 translate-x-[6%] fill-current" />
                  </span>
                </span>
              )}
              {isBuy && h.pulse !== false && (
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px]">
                  <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] animate-[shine-sweep_2.4s_ease-in-out_infinite] bg-white/45 motion-reduce:hidden" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* floating buy while the image's own button is off screen */}
      <div
        className={cn(
          'pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 transition-[opacity,transform] duration-300',
          buyVisible ? 'translate-y-6 opacity-0' : 'opacity-100',
        )}
      >
        <button
          type="button"
          onClick={() => void buy(spots[firstBuy]?.productSlug)}
          disabled={!inStock}
          className="pointer-events-auto flex animate-[buy-glow_1.8s_ease-in-out_infinite] items-center gap-2.5 rounded-full bg-[#ff2d3d] px-7 py-3 text-lg font-extrabold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 motion-reduce:animate-none"
        >
          <ShoppingCart className="size-5" />
          {inStock ? `${page.ctaText || 'Mua ngay'} · ${formatPrice(product.price)}` : 'Tạm hết hàng'}
        </button>
      </div>

      <ClipDialog
        clip={clip}
        onClose={() => setClip(null)}
        onBuy={() => {
          setClip(null)
          void buy(spots[firstBuy]?.productSlug)
        }}
      />
    </div>
  )
}

interface Clip {
  /** pasted link or direct file */
  url?: string
  /** ready-made player URL (KOL video embed) */
  embedUrl?: string
  poster?: string
  title: string
  vertical?: boolean
}

/** A KOL video as a single clip (no playlist). */
const clipOf = (v: KolReview): Clip => ({
  url: v.embedUrl ? undefined : v.videoSrc,
  embedUrl: v.embedUrl ? normalizeEmbedUrl(v.embedUrl) : undefined,
  poster: v.thumbnail,
  title: v.title,
  vertical: v.aspectRatio === '9:16' || v.aspectRatio === '4:5',
})

/** Player URLs start on their own (the click that opened the popup allows sound). */
const withAutoplay = (u: string) => {
  const sep = u.includes('?') ? '&' : '?'
  if (/youtube\.com\/embed/.test(u)) return `${u}${sep}autoplay=1&mute=0`
  if (/tiktok\.com\/player/.test(u)) return `${u}${sep}autoplay=1`
  if (/facebook\.com\/plugins\/video/.test(u)) return u.replace('autoplay=false', 'autoplay=true')
  return u
}

/** Popup that plays exactly one clip right away: KOL video, pasted link or uploaded file. */
function ClipDialog({ clip, onClose, onBuy }: { clip: Clip | null; onClose: () => void; onBuy: () => void }) {
  const src = clip?.url ? sourceOf(clip.url) : null
  const parsed = clip?.url && src ? parseVideoUrl(src, clip.url) : null
  const embed = clip?.embedUrl ?? (parsed?.embedUrl ? normalizeEmbedUrl(parsed.embedUrl) : undefined)
  const vertical = clip?.vertical ?? (parsed?.aspect === '9:16' || src === 'tiktok')
  return (
    <Dialog open={!!clip} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn('overflow-hidden bg-black p-0', vertical ? 'max-w-[min(420px,100%)]' : 'max-w-[min(960px,100%)]')} showClose={false}>
        <DialogTitle className="sr-only">{clip?.title ?? 'Video'}</DialogTitle>
        <button type="button" onClick={onClose} aria-label="Đóng video" className="absolute top-3 right-3 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
          <X className="size-5" />
        </button>
        {clip &&
          (embed ? (
            <iframe
              key={embed}
              src={withAutoplay(embed)}
              title={clip.title}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              className={cn('w-full border-0', vertical ? 'aspect-[9/16] max-h-[80dvh]' : 'aspect-video')}
            />
          ) : (
            <video key={clip.url} src={clip.url} poster={clip.poster} controls autoPlay playsInline className={cn('w-full bg-black', vertical ? 'aspect-[9/16] max-h-[80dvh] object-contain' : 'max-h-[80dvh]')} />
          ))}
        <div className="flex items-center gap-3 bg-black px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white/90">{clip?.title}</p>
          <button type="button" onClick={onBuy} className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-[#ff2d3d] px-5 py-2.5 font-extrabold text-white hover:brightness-110">
            <ShoppingCart className="size-4" /> Mua ngay
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
