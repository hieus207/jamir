import { ArrowRight, BadgeCheck, Eye, Play, ShoppingBag } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useKolFeed, useProducts } from '@/hooks/queries'
import { cn, formatCompact, formatDuration, formatPrice } from '@/lib/utils'
import type { KolReview, ProductSummary } from '@/types/domain'
import { isVertical, SourceBadge } from '../review/KolMedia'
import { KolVideoViewer } from '../review/KolVideoViewer'

/**
 * Home "Video hot từ KOL": dark band, top videos in one row of equal 9:16 frames.
 * Hover previews the clip; each card links straight to its product (video → product → buy).
 */
export function KolHotSection({ count = 5, className }: { count?: number; className?: string }) {
  const { data, isPending } = useKolFeed()
  const { data: products } = useProducts()
  const [active, setActive] = useState<KolReview | null>(null)
  const videos = data?.slice(0, count) ?? []

  return (
    <section aria-labelledby="kol-hot-title" className={cn('relative overflow-hidden rounded-[24px] bg-ink px-4 py-6 text-white md:px-8 md:py-8', className)}>
      <span aria-hidden="true" className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-brand-600/40 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -bottom-28 size-80 rounded-full bg-pink-600/30 blur-3xl" />

      <div className="relative mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 id="kol-hot-title" className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Video hot từ <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-indigo-300 bg-clip-text text-transparent">KOL</span>
          </h2>
          <p className="mt-1 text-sm text-white/60">Review thật, xem trước rồi mua ngay trong video</p>
        </div>
        <Link
          to="/explore"
          className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/20"
        >
          Xem tất cả <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <ul className="scrollbar-none relative -mx-4 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:overflow-visible md:px-0">
        {isPending
          ? Array.from({ length: count }, (_, i) => (
              <li key={i} className="w-[44%] shrink-0 sm:w-[30%] md:w-auto">
                <Skeleton className="aspect-[9/16] rounded-[18px] bg-white/10" />
              </li>
            ))
          : videos.map((v, i) => (
              <li key={v.id} className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-auto">
                <HotCard video={v} rank={i + 1} product={products?.find((p) => p.id === v.productId)} onOpen={() => setActive(v)} />
              </li>
            ))}
      </ul>

      <KolVideoViewer review={active} playlist={videos} onChange={setActive} onClose={() => setActive(null)} />
    </section>
  )
}

function HotCard({ video: v, rank, product, onOpen }: { video: KolReview; rank: number; product?: ProductSummary; onOpen: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [preview, setPreview] = useState(false)
  const canPreview = !!v.videoSrc && !v.embedUrl
  const vertical = isVertical(v.aspectRatio)
  const fit = vertical ? 'object-cover' : 'object-contain'

  return (
    <article
      className="group relative aspect-[9/16] overflow-hidden rounded-[18px] bg-black ring-1 ring-white/10 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-12px_rgb(236_72_153/0.55)] hover:ring-pink-400/60"
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse' || !canPreview) return
        setPreview(true)
        void ref.current?.play().catch(() => {})
      }}
      onPointerLeave={() => {
        setPreview(false)
        ref.current?.pause()
      }}
    >
      <button type="button" onClick={onOpen} className="absolute inset-0 cursor-pointer" aria-label={`Xem video: ${v.title}`}>
        {/* horizontal clips sit on a blurred fill so every card keeps the same 9:16 frame */}
        {!vertical && <img src={v.thumbnail} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-125 object-cover opacity-70 blur-xl" />}
        <img src={v.thumbnail} alt="" loading="lazy" className={cn('absolute inset-0 size-full transition-transform duration-700 group-hover:scale-105', fit)} />
        {canPreview && (
          <video
            ref={ref}
            src={v.videoSrc}
            muted
            loop
            playsInline
            preload="none"
            className={cn('absolute inset-0 size-full transition-opacity duration-300', fit, preview ? 'opacity-100' : 'opacity-0')}
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85" />
        <span className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-300', preview && 'opacity-0')}>
          <span className="flex size-12 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/50 backdrop-blur-md transition-transform duration-200 group-hover:scale-110">
            <Play className="size-5 translate-x-0.5 fill-white text-white" aria-hidden="true" />
          </span>
        </span>
      </button>

      <div className="pointer-events-none absolute inset-x-2 top-2 flex items-center gap-1.5">
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[11px] font-extrabold',
            rank === 1 ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white' : 'bg-white/90 text-ink',
          )}
        >
          #{rank}
        </span>
        <SourceBadge source={v.source} />
        <span className="ml-auto rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">{formatDuration(v.duration)}</span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-2.5 md:p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar src={v.kol.avatar} name={v.kol.name} className="size-7 ring-2 ring-white/80" />
          <p className="flex min-w-0 items-center gap-1 text-xs font-bold">
            <span className="truncate">{v.kol.name}</span>
            {v.kol.verified && <BadgeCheck className="size-3.5 shrink-0 fill-sky-500 text-white" aria-label="Đã xác minh" />}
          </p>
        </div>
        <h3 className="line-clamp-2 text-[13px] leading-snug font-semibold md:text-sm">{v.title}</h3>
        <p className="flex items-center gap-1 text-[11px] text-white/70">
          <Eye className="size-3.5" aria-hidden="true" />
          {formatCompact(v.views)} lượt xem
        </p>
        {product && (
          <Link
            to={`/product/${product.slug}`}
            className="pointer-events-auto flex items-center gap-2 rounded-[12px] bg-white/95 p-1.5 pr-2 text-ink shadow-lg transition-colors hover:bg-white"
          >
            <img src={product.thumbnail} alt="" className="size-8 shrink-0 rounded-[8px] object-cover" />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[11px] font-semibold">{product.name}</span>
              <span className="block text-xs font-extrabold text-brand-700">{formatPrice(product.price)}</span>
            </span>
            <ShoppingBag className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  )
}
