import { Play } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { clamp, cn, formatDuration } from '@/lib/utils'
import type { VideoChapter } from '@/types/domain'

/** Chapter thumbnails under the player. Click → seek + play. Active chapter follows playback. */
export function VideoChapterList({
  chapters,
  currentTime,
  onSelect,
  moreCount,
  onMore,
  className,
}: {
  chapters: VideoChapter[]
  currentTime: number
  onSelect: (chapter: VideoChapter) => void
  moreCount?: number
  onMore?: () => void
  className?: string
}) {
  const activeIndex = chapters.findIndex((c) => currentTime >= c.start && currentTime < c.end)
  const listRef = useRef<HTMLOListElement>(null)

  // keep the active chapter in view on small screens
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    const list = listRef.current
    if (!el || !list || list.scrollWidth <= list.clientWidth) return
    const left = el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2
    list.scrollTo({ left, behavior: 'smooth' })
  }, [activeIndex])

  return (
    <nav aria-label="Chương video" className={className}>
      <ol ref={listRef} className="scrollbar-none -mx-4 flex snap-x gap-2.5 overflow-x-auto scroll-px-4 px-4 md:mx-0 md:px-0">
        {chapters.map((c, i) => {
          const active = i === activeIndex
          const progress = active ? clamp((currentTime - c.start) / (c.end - c.start), 0, 1) : 0
          return (
            <li key={c.id} className="w-[112px] shrink-0 snap-start md:w-auto md:min-w-0 md:flex-1">
              <button
                type="button"
                onClick={() => onSelect(c)}
                aria-current={active ? 'step' : undefined}
                className="group flex w-full cursor-pointer flex-col gap-1.5 text-left"
              >
                <div
                  className={cn(
                    'relative aspect-video w-full overflow-hidden rounded-[10px] bg-line-soft transition-shadow',
                    active ? 'ring-[2.5px] ring-accent-600 ring-offset-1' : 'ring-1 ring-line group-hover:ring-brand-300',
                  )}
                >
                  <img src={c.thumbnail} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  {active ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-accent-600/25">
                      <span className="flex size-7 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg">
                        <Play className="size-3.5 translate-x-px fill-white" aria-hidden="true" />
                      </span>
                    </span>
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-[opacity,background-color] group-hover:bg-black/20 group-hover:opacity-100">
                      <Play className="size-5 fill-white text-white" aria-hidden="true" />
                    </span>
                  )}
                  {active && (
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
                      <span className="block h-full bg-accent-500" style={{ width: `${progress * 100}%` }} />
                    </span>
                  )}
                </div>
                <span className="px-0.5">
                  <span className={cn('block truncate text-xs font-semibold', active ? 'text-accent-600' : 'text-ink')}>{c.title}</span>
                  <span className="block text-[11px] text-muted tabular-nums">
                    <span className="sr-only">thời lượng </span>
                    {formatDuration(c.end - c.start)}
                    <span className="sr-only">, bắt đầu tại {formatDuration(c.start)}</span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        {!!moreCount && onMore && (
          <li className="w-[112px] shrink-0 snap-start md:w-auto md:min-w-0 md:flex-[0.8]">
            <button
              type="button"
              onClick={onMore}
              className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-[10px] bg-ink text-white transition-colors hover:bg-ink-soft"
            >
              <span className="text-lg font-bold">+{moreCount}</span>
              <span className="text-[11px] text-white/70">video review</span>
            </button>
          </li>
        )}
      </ol>
    </nav>
  )
}
