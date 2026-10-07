import {
  Bookmark,
  Eye,
  Heart,
  LoaderCircle,
  Maximize,
  MessageCircle,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Settings,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { VideoController } from '@/hooks/useVideoController'
import { clamp, cn, formatCompact, formatDuration } from '@/lib/utils'
import type { ProductVideo, VideoChapter } from '@/types/domain'

export interface VideoActions {
  liked: boolean
  saved: boolean
  onLike: () => void
  onComment: () => void
  onShare: () => void
  onSave: () => void
}

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

/** Native HTML5 video with JAMIR chrome: chapter-aware scrubber, side action rail, auto-hiding controls. */
export function VideoPlayer({
  video,
  chapters,
  controller,
  actions,
  title,
  className,
}: {
  video: ProductVideo
  chapters: VideoChapter[]
  controller: VideoController
  actions: VideoActions
  title: string
  className?: string
}) {
  const { videoRef, containerRef, state, toggle, seek, seekBy, setMuted, setRate, toggleFullscreen, togglePip } = controller
  const [chromeVisible, setChromeVisible] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const poke = () => {
    setChromeVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setChromeVisible(false), 2600)
  }
  useEffect(() => {
    if (!state.playing) {
      clearTimeout(hideTimer.current)
      setChromeVisible(true)
    } else poke()
    return () => clearTimeout(hideTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.playing])

  // Autoplay (muted) while at least half visible, pause when scrolled away.
  useEffect(() => {
    const el = containerRef.current
    const v = videoRef.current
    if (!el || !v) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.intersectionRatio >= 0.5) {
          if (v.dataset.userPaused !== '1' && !v.ended) v.play().catch(() => {})
        } else if (!v.paused) v.pause()
      },
      { threshold: [0, 0.5] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [containerRef, videoRef, video.src])

  const userToggle = () => {
    const v = videoRef.current
    if (v) v.dataset.userPaused = v.paused ? '0' : '1'
    if (state.ended) seek(0, true)
    else toggle()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('[role="slider"],[role="menu"]')) return
    const keys: Record<string, () => void> = {
      ' ': userToggle,
      k: userToggle,
      ArrowLeft: () => seekBy(-5),
      ArrowRight: () => seekBy(5),
      m: () => setMuted(!state.muted),
      f: toggleFullscreen,
    }
    const fn = keys[e.key]
    if (fn && !(e.target instanceof HTMLButtonElement && e.key === ' ')) {
      e.preventDefault()
      fn()
      poke()
    }
  }

  const showChrome = chromeVisible || !state.playing

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label={`Video ${title}`}
      onKeyDown={onKeyDown}
      onPointerMove={poke}
      className={cn(
        'group/player relative aspect-video w-full overflow-hidden bg-ink outline-none select-none focus-visible:ring-4 focus-visible:ring-brand-300 [&:fullscreen]:rounded-none',
        !showChrome && 'cursor-none',
        className,
      )}
    >
      <video
        ref={videoRef}
        key={video.src}
        src={video.src}
        poster={video.poster}
        muted
        playsInline
        preload="metadata"
        onClick={userToggle}
        className="absolute inset-0 size-full object-cover"
      />

      {/* top scrim + meta */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 md:top-4 md:left-4">
        <span className="rounded-lg bg-white/95 px-2 py-1 text-xs font-bold text-ink shadow-sm">{video.episode}</span>
        <span className="flex items-center gap-1.5 rounded-lg bg-black/40 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
          <Eye className="size-3.5" aria-hidden="true" />
          {formatCompact(video.views)} lượt xem
        </span>
      </div>

      {/* side action rail */}
      <div className="absolute top-2.5 right-2 flex flex-col gap-0.5 rounded-2xl bg-black/25 p-0.5 backdrop-blur-md md:top-1/2 md:right-3 md:-translate-y-1/2 md:gap-2 md:p-1.5">
        <RailButton label={actions.liked ? 'Bỏ thích' : 'Thích'} count={formatCompact(video.likes + (actions.liked ? 1 : 0))} onClick={actions.onLike} pressed={actions.liked}>
          <motion.span key={String(actions.liked)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 15 }}>
            <Heart className={cn('size-5 md:size-6', actions.liked ? 'fill-danger text-danger' : 'fill-danger/90 text-danger/90')} />
          </motion.span>
        </RailButton>
        <RailButton label="Bình luận" count={formatCompact(video.comments)} onClick={actions.onComment}>
          <MessageCircle className="size-5 fill-white/90 text-white/90 md:size-6" />
        </RailButton>
        <RailButton label="Chia sẻ" count="Chia sẻ" onClick={actions.onShare}>
          <Share2 className="size-5 md:size-6" />
        </RailButton>
        <RailButton className="hidden md:flex" label={actions.saved ? 'Bỏ lưu' : 'Lưu'} count={actions.saved ? 'Đã lưu' : 'Lưu'} onClick={actions.onSave} pressed={actions.saved}>
          <Bookmark className={cn('size-5 md:size-6', actions.saved && 'fill-white')} />
        </RailButton>
      </div>

      {/* center state */}
      <AnimatePresence>
        {(!state.playing || state.waiting) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            {state.waiting && state.playing ? (
              <LoaderCircle className="size-12 animate-spin text-white/90" aria-label="Đang tải video" />
            ) : state.error ? (
              <p className="rounded-xl bg-black/60 px-4 py-2 text-sm text-white">Không tải được video</p>
            ) : (
              <button
                type="button"
                onClick={userToggle}
                aria-label={state.ended ? 'Xem lại' : 'Phát video'}
                className="pointer-events-auto flex size-16 cursor-pointer items-center justify-center rounded-full border-2 border-white/80 bg-black/30 text-white backdrop-blur-md transition-transform hover:scale-105 active:scale-95 md:size-20"
              >
                {state.ended ? <RotateCcw className="size-8" /> : <Play className="size-8 translate-x-0.5 fill-white md:size-9" />}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* bottom controls */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pt-10 pb-2 transition-opacity duration-300 md:px-4 md:pb-3',
          showChrome ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div className="flex items-center gap-2 text-white md:gap-3">
          <ControlButton label={state.playing ? 'Tạm dừng' : 'Phát'} onClick={userToggle}>
            {state.playing ? <Pause className="size-5 fill-white" /> : <Play className="size-5 fill-white" />}
          </ControlButton>
          <span className="shrink-0 text-xs font-medium tabular-nums md:text-[13px]">
            {formatDuration(state.currentTime)} <span className="text-white/60">/ {formatDuration(state.duration)}</span>
          </span>
          <Scrubber
            current={state.currentTime}
            duration={state.duration || video.duration}
            buffered={state.buffered}
            chapters={chapters}
            onSeek={(t) => seek(t)}
          />
          <ControlButton label={state.muted ? 'Bật tiếng' : 'Tắt tiếng'} onClick={() => setMuted(!state.muted)}>
            {state.muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </ControlButton>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Tốc độ phát"
              className="hidden size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-white/15 sm:inline-flex"
            >
              <Settings className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" container={containerRef}>
              <p className="px-2.5 pt-1 pb-1.5 text-xs font-semibold text-muted">Tốc độ phát</p>
              {RATES.map((r) => (
                <DropdownMenuItem key={r} onClick={() => setRate(r)} className={cn(r === state.rate && 'font-semibold text-brand-700')}>
                  {r === 1 ? 'Bình thường' : `${r}x`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="hidden rounded-md border border-white/70 px-1 text-[10px] leading-4 font-bold sm:inline">HD</span>
          <ControlButton label="Hình trong hình" onClick={togglePip} className="hidden sm:inline-flex">
            <PictureInPicture2 className="size-5" />
          </ControlButton>
          <ControlButton label="Toàn màn hình" onClick={toggleFullscreen}>
            <Maximize className="size-5" />
          </ControlButton>
        </div>
      </div>
    </div>
  )
}

function RailButton({
  label,
  count,
  onClick,
  pressed,
  className,
  children,
}: {
  className?: string
  label: string
  count: string
  onClick: () => void
  pressed?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn('flex w-11 cursor-pointer flex-col items-center gap-0.5 rounded-xl py-1 text-white transition-[background-color,transform] hover:bg-white/10 active:scale-95 md:w-14 md:py-1.5', className)}
    >
      {children}
      <span className="sr-only">{label}: </span>
      <span className="text-[10px] font-semibold drop-shadow md:text-[11px]">{count}</span>
    </button>
  )
}

function ControlButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn('inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-white/15', className)}
    >
      {children}
    </button>
  )
}

/** Accessible seek bar with chapter gaps and a hover preview label. */
function Scrubber({
  current,
  duration,
  buffered,
  chapters,
  onSeek,
}: {
  current: number
  duration: number
  buffered: number
  chapters: VideoChapter[]
  onSeek: (t: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const d = duration || 1

  const timeAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect()
    return clamp((clientX - rect.left) / rect.width, 0, 1) * d
  }
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    onSeek(timeAt(e.clientX))
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const t = timeAt(e.clientX)
    setHover(t)
    if (dragging) onSeek(t)
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 5
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onSeek(current + step)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onSeek(current - step)
    else if (e.key === 'Home') onSeek(0)
    else if (e.key === 'End') onSeek(d)
    else return
    e.preventDefault()
  }
  const hoverChapter = hover === null ? undefined : chapters.find((c) => hover >= c.start && hover < c.end)
  const pct = (t: number) => `${clamp((t / d) * 100, 0, 100)}%`

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Tua video"
      aria-valuemin={0}
      aria-valuemax={Math.round(d)}
      aria-valuenow={Math.round(current)}
      aria-valuetext={`${formatDuration(current)} trên ${formatDuration(d)}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => !dragging && setHover(null)}
      onKeyDown={onKey}
      className="group/scrub relative flex h-6 min-w-0 flex-1 cursor-pointer touch-none items-center outline-none"
    >
      {/* chapter segments */}
      <div className="relative flex h-1 w-full gap-[3px] transition-[height] group-hover/scrub:h-1.5">
        {chapters.map((c) => {
          const w = ((c.end - c.start) / d) * 100
          const filled = clamp((current - c.start) / (c.end - c.start), 0, 1)
          const loaded = clamp((buffered - c.start) / (c.end - c.start), 0, 1)
          return (
            <div key={c.id} className="relative h-full overflow-hidden rounded-full bg-white/30" style={{ width: `${w}%` }}>
              <div className="absolute inset-y-0 left-0 bg-white/35" style={{ width: `${loaded * 100}%` }} />
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${filled * 100}%` }} />
            </div>
          )
        })}
      </div>
      <div
        className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500 shadow ring-2 ring-white transition-transform group-hover/scrub:scale-110 group-focus-visible/scrub:scale-125"
        style={{ left: pct(current) }}
      />
      {hover !== null && (
        <div
          className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded-lg bg-black/80 px-2 py-1 text-center text-[11px] whitespace-nowrap text-white"
          style={{ left: pct(hover) }}
        >
          {hoverChapter && <span className="block font-semibold">{hoverChapter.title}</span>}
          {formatDuration(hover)}
        </div>
      )}
    </div>
  )
}
