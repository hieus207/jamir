import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Story } from '@/types/domain'

/** Equal tiles: 8 per row on desktop (incl. "Xem tất cả"), 6 on tablet, ~3.5 on phones. */
const TILE = 'w-[calc((100%-2.25rem)/3.5)] shrink-0 snap-start sm:w-[calc((100%-3.75rem)/5)] md:w-[calc((100%-4.375rem)/6)] lg:w-[calc((100%-6.125rem)/8)]'

/**
 * Story thumbnails (3:4, all the same size). The playing story shows its
 * progress; "Xem tất cả" = story mode through every product page.
 */
export function StoriesStrip({
  items,
  loading,
  activeId,
  progress = 0,
  autoplay,
  countdown,
  onSelect,
  onPlayAll,
  className,
}: {
  items: Story[]
  loading?: boolean
  activeId?: string
  progress?: number
  /** true while auto-advancing through all stories */
  autoplay?: boolean
  /** seconds until "Xem tất cả" starts by itself (home idle) */
  countdown?: number | null
  onSelect: (story: Story) => void
  onPlayAll: () => void
  className?: string
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) => {
    const el = scroller.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: 'smooth' })
  }

  // keep the playing story in view — scroll the strip only, never the page
  useEffect(() => {
    if (!autoplay || !activeId) return
    const el = scroller.current
    const tile = el?.querySelector<HTMLElement>(`[data-story="${CSS.escape(activeId)}"]`)
    if (!el || !tile) return
    const left = tile.offsetLeft - el.offsetLeft
    if (left < el.scrollLeft || left + tile.offsetWidth > el.scrollLeft + el.clientWidth)
      el.scrollTo({ left: left - el.clientWidth / 2 + tile.offsetWidth / 2, behavior: 'smooth' })
  }, [activeId, autoplay])

  return (
    <div className={cn('group/strip relative', className)}>
      <div ref={scroller} className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 py-1.5 md:mx-0 md:gap-3.5 md:px-0.5">
        <button
          type="button"
          onClick={onPlayAll}
          aria-pressed={autoplay}
          aria-label={countdown ? `Xem tất cả story — tự phát sau ${countdown} giây` : 'Xem tất cả story'}
          className={cn('group flex flex-col gap-1.5', TILE)}
        >
          {/* rotating gradient ring + pulsing glow */}
          <span className="relative block aspect-[3/4] w-full animate-glow overflow-hidden rounded-2xl p-[3px] motion-reduce:animate-none">
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 aspect-square w-[220%] -translate-x-1/2 -translate-y-1/2 motion-reduce:hidden"
            >
              <span className="block size-full animate-ring bg-[conic-gradient(from_0deg,#ec4899,#8b5cf6,#4f46e5,#f59e0b,#ec4899)]" />
            </span>
            <span className="relative flex size-full items-center justify-center overflow-hidden rounded-[13px] bg-ink">
              <img src={items[0]?.thumbnail} alt="" className="absolute inset-0 size-full object-cover opacity-45 transition-transform duration-500 group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-b from-brand-600/30 via-transparent to-pink-600/40" />
              <span className="relative flex size-12 items-center justify-center rounded-full bg-white text-brand-700 shadow-lg ring-4 ring-white/30 transition-transform duration-200 group-hover:scale-110 md:size-14">
                <span className="absolute inset-0 animate-ping rounded-full bg-white/50 motion-reduce:hidden" aria-hidden="true" />
                <Play className="relative size-6 translate-x-px fill-current" aria-hidden="true" />
              </span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-brand-700 shadow tabular-nums">
                {autoplay ? 'Đang phát' : countdown ? `Tự phát sau ${countdown}s` : 'Lướt story'}
              </span>
            </span>
          </span>
          <span className="truncate text-center text-xs font-extrabold md:text-sm">
            <span className="text-shine animate-text-shine motion-reduce:animate-none">Xem tất cả</span>
          </span>
        </button>

        {loading
          ? Array.from({ length: 7 }, (_, i) => (
              <div key={i} className={cn('flex flex-col gap-1.5', TILE)}>
                <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                <Skeleton className="mx-auto h-3 w-16" />
              </div>
            ))
          : items.map((s) => {
              const active = s.id === activeId
              return (
                <button
                  key={s.id}
                  type="button"
                  data-story={s.id}
                  onClick={() => onSelect(s)}
                  aria-current={active ? 'true' : undefined}
                  aria-label={`Xem story ${s.label}`}
                  className={cn('group flex flex-col gap-1.5', TILE)}
                >
                  <span
                    className={cn(
                      'relative block aspect-[3/4] w-full rounded-2xl p-[3px] transition-shadow duration-200',
                      active ? 'bg-gradient-to-br from-pink-500 via-accent-600 to-brand-600 shadow-brand' : s.hot ? 'bg-gradient-to-br from-pink-400 to-orange-400' : 'bg-line',
                    )}
                  >
                    <span className="relative block size-full overflow-hidden rounded-[13px] bg-line-soft ring-2 ring-surface">
                      <img src={s.thumbnail} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
                      {s.gift?.enabled && (
                        <span className="absolute top-1.5 right-1.5 rounded-md bg-white/95 px-1 py-px text-[11px] shadow" title={s.gift.text}>
                          🎁
                        </span>
                      )}
                      {s.hot && (
                        <span className="absolute top-1.5 left-1.5 rounded-md bg-gradient-to-r from-pink-500 to-accent-600 px-1.5 py-px text-[10px] font-bold text-white">
                          Hot
                        </span>
                      )}
                      {active && autoplay && (
                        <span className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-white/35" aria-hidden="true">
                          <span className="block h-full rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
                        </span>
                      )}
                    </span>
                  </span>
                  <span className={cn('truncate text-center text-xs md:text-[13px]', active ? 'font-semibold text-accent-600' : 'font-medium text-ink-soft')}>
                    {s.label}
                  </span>
                </button>
              )
            })}
      </div>
      <button
        type="button"
        aria-label="Cuộn trái"
        onClick={() => scroll(-1)}
        className="absolute top-[42%] -left-4 hidden size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink opacity-0 shadow-card transition-opacity group-hover/strip:opacity-100 hover:text-brand-600 md:flex"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Cuộn phải"
        onClick={() => scroll(1)}
        className="absolute top-[42%] -right-4 hidden size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink shadow-card transition-colors hover:text-brand-600 md:flex"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}
