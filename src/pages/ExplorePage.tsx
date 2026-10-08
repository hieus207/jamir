import { BadgeCheck, Eye, Heart, Play } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { KolVideoViewer } from '@/components/jamir/review/KolVideoViewer'
import { isVertical } from '@/components/jamir/review/KolMedia'
import { comic, grunge, marker, Scribble, useStreetFonts } from '@/components/jamir/street/street'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useKolFeed, useProducts } from '@/hooks/queries'
import { useSeo } from '@/hooks/useSeo'
import { paths } from '@/lib/paths'
import { cn, formatCompact, formatDuration, formatPrice } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import { useIsWishlisted, useWishlistStore } from '@/stores/wishlistStore'
import type { KolReview, ProductSummary, VideoSource } from '@/types/domain'

/** Platform labels — "Local" = filmed and uploaded by JAMIR. */
const PLATFORM: Record<VideoSource, { label: string; className: string }> = {
  tiktok: { label: 'TikTok', className: 'bg-black text-white shadow-[2px_2px_0_#25f4ee,-2px_-2px_0_#fe2c55]' },
  youtube: { label: 'YouTube', className: 'bg-[#ff0000] text-white' },
  facebook: { label: 'Facebook', className: 'bg-[#1877f2] text-white' },
  jamir: { label: 'Local', className: 'bg-[#ffe52e] text-black' },
}
const FILTERS: ('all' | VideoSource)[] = ['all', 'tiktok', 'youtube', 'facebook', 'jamir']

/**
 * Khám phá: a dark video wall. Every clip in the same 9:16 frame, a platform
 * tag, and the product right under it so watching leads straight to buying.
 */
export default function ExplorePage() {
  useStreetFonts()
  const { data, isPending } = useKolFeed()
  const { data: products } = useProducts()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [active, setActive] = useState<KolReview | null>(null)
  useSeo({ title: 'Khám phá video review | JAMIR', description: 'Video thật từ TikTok, YouTube, Facebook và JAMIR: xem rồi mua ngay.', path: '/explore' })

  const videos = useMemo(() => (data ?? []).filter((v) => filter === 'all' || v.source === filter), [data, filter])
  const count = (f: (typeof FILTERS)[number]) => (data ?? []).filter((v) => f === 'all' || v.source === f).length

  return (
    <div className={cn('-mt-px pb-12 text-white', grunge)}>
      <div className="container-page flex flex-col gap-6 pt-8 md:pt-12">
        <header className="relative">
          <h1 className={cn(marker, '-rotate-2 text-5xl md:text-7xl')}>
            Khám phá <span className="text-[#ff2d3d]">video thật</span>
          </h1>
          <p className="mt-3 max-w-xl text-white/75 md:text-lg">Người thật, dùng thật, quay thật. Xem xong thấy hợp thì bấm mua ngay dưới video.</p>
          <div className="absolute -top-6 right-[6%] hidden flex-col items-center md:flex">
            <Scribble kind="crown" className="size-16 rotate-12 text-[#ffe52e]" />
            <span className={cn(comic, '-mt-1 -rotate-6 text-4xl text-white drop-shadow-[3px_3px_0_#ff2d3d] lg:text-5xl')}>
              JAMIR<sup className="text-base">®</sup>
            </span>
          </div>
        </header>

        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Nền tảng">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                comic,
                'shrink-0 cursor-pointer rounded-full border-2 px-4 py-1.5 text-lg transition-colors',
                filter === f ? 'border-[#ffe52e] bg-[#ffe52e] text-black' : 'border-white/25 text-white hover:border-white/60',
              )}
            >
              {f === 'all' ? 'Tất cả' : PLATFORM[f].label} <span className="text-sm opacity-70">{count(f)}</span>
            </button>
          ))}
        </div>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {isPending
            ? Array.from({ length: 10 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="aspect-[9/16] rounded-[18px] bg-white/10" />
                </li>
              ))
            : videos.map((v, i) => (
                <li key={v.id}>
                  <WallCard video={v} tilt={i % 3 === 1 ? 'md:rotate-1' : i % 3 === 2 ? 'md:-rotate-1' : ''} product={products?.find((p) => p.id === v.productId)} onOpen={() => setActive(v)} />
                </li>
              ))}
        </ul>
        {!isPending && !videos.length && <p className="py-16 text-center text-white/60">Chưa có video từ nền tảng này.</p>}
      </div>
      <KolVideoViewer review={active} playlist={videos} onChange={setActive} onClose={() => setActive(null)} />
    </div>
  )
}

function WallCard({ video: v, product, tilt, onOpen }: { video: KolReview; product?: ProductSummary; tilt: string; onOpen: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [preview, setPreview] = useState(false)
  const canPreview = !!v.videoSrc && !v.embedUrl
  const vertical = isVertical(v.aspectRatio)
  const fit = vertical ? 'object-cover' : 'object-contain'
  const tag = PLATFORM[v.source] ?? PLATFORM.jamir

  return (
    <article className={cn('flex flex-col gap-2.5 transition-transform duration-300 hover:rotate-0', tilt)}>
      <button
        type="button"
        onClick={onOpen}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse' || !canPreview) return
          setPreview(true)
          void ref.current?.play().catch(() => {})
        }}
        onPointerLeave={() => {
          setPreview(false)
          ref.current?.pause()
        }}
        aria-label={`Xem video: ${v.title}`}
        className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-[18px] border-[3px] border-white bg-black text-left shadow-[5px_6px_0_rgba(0,0,0,0.6)] transition-shadow hover:shadow-[6px_8px_0_#ff2d3d]"
      >
        {!vertical && <img src={v.thumbnail} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-125 object-cover opacity-60 blur-xl" />}
        <img src={v.thumbnail} alt="" loading="lazy" className={cn('absolute inset-0 size-full transition-transform duration-700 group-hover:scale-105', fit)} />
        {canPreview && (
          <video ref={ref} src={v.videoSrc} muted loop playsInline preload="none" className={cn('absolute inset-0 size-full transition-opacity duration-300', fit, preview ? 'opacity-100' : 'opacity-0')} />
        )}
        <span className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85" />
        <span className={cn(comic, 'absolute top-2.5 left-2.5 -rotate-3 rounded-md px-2 py-0.5 text-base', tag.className)}>{tag.label}</span>
        <span className="absolute top-2.5 right-2.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">{formatDuration(v.duration)}</span>
        <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity', preview && 'opacity-0')}>
          <span className="flex size-12 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/50 backdrop-blur-md">
            <Play className="size-5 translate-x-0.5 fill-white text-white" />
          </span>
        </span>
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3">
          <span className="flex items-center gap-1.5 text-xs font-bold">
            <Avatar src={v.kol.avatar} name={v.kol.name} className="size-6 ring-2 ring-white" />
            <span className="truncate">{v.kol.name}</span>
            {v.kol.verified && <BadgeCheck className="size-3.5 shrink-0 fill-sky-500 text-white" />}
          </span>
          <span className={cn(marker, 'line-clamp-2 text-xl')}>{v.title}</span>
          <span className="flex items-center gap-1 text-[11px] text-white/75">
            <Eye className="size-3.5" /> {formatCompact(v.views)} lượt xem
          </span>
        </span>
      </button>

      {/* the product, right under the video */}
      {product && (
        <Link
          to={paths.product(product.slug)}
          className="group/p flex items-center gap-2.5 rounded-[14px] bg-white p-2 pr-2.5 text-ink shadow-[3px_4px_0_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5"
        >
          <img src={product.thumbnail} alt="" className="size-11 shrink-0 rounded-[10px] object-cover" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-xs font-semibold">{product.name}</span>
            <span className="block text-sm font-extrabold text-[#ff2d3d]">{formatPrice(product.price)}</span>
          </span>
          <WishHeart productId={product.id} name={product.name} />
        </Link>
      )}
    </article>
  )
}

/** Save to Yêu thích without leaving the wall (the card itself opens the product). */
function WishHeart({ productId, name }: { productId: string; name: string }) {
  const saved = useIsWishlisted(productId)
  const toggle = useWishlistStore((s) => s.toggle)
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Bỏ ${name} khỏi Yêu thích` : `Thêm ${name} vào Yêu thích`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const added = toggle(productId)
        toast.success(added ? 'Đã thêm vào Yêu thích' : 'Đã bỏ khỏi Yêu thích', name)
      }}
      className={cn(
        'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-[background-color,transform] active:scale-90',
        saved ? 'bg-[#ff2d3d] text-white' : 'bg-line-soft text-ink-soft hover:bg-pink-50 hover:text-[#ff2d3d]',
      )}
    >
      <Heart className={cn('size-[18px]', saved && 'fill-white')} />
    </button>
  )
}
