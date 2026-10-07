import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { currentStory, useStoryMode } from './storyMode'
import { SecondsLeft, StoryProgressFill, useStoryKey } from './StoryProgress'
import { useStoryNav } from './StoryModeController'

const PAUSE_TEXT = {
  user: 'Đã tạm dừng',
  scroll: 'Tạm dừng khi bạn đang xem chi tiết',
  dialog: 'Tạm dừng',
  hidden: 'Tạm dừng',
} as const

/**
 * Facebook-style story bar on product pages while "Xem tất cả" runs:
 * segmented progress, current story, prev / pause / next / exit.
 * Sticky under the header so the shopper always sees where they are.
 */
export function StoryModeBar() {
  const active = useStoryMode((s) => s.active)
  const queue = useStoryMode((s) => s.queue)
  const pos = useStoryMode((s) => s.pos)
  const storyKey = useStoryKey()
  const reason = useStoryMode((s) => s.pauseReason)
  const story = useStoryMode(currentStory)
  const { setUserPaused, stop } = useStoryMode.getState()
  const { next, prev } = useStoryNav()
  if (!active || !story) return null

  const resume = () => {
    if (reason === 'scroll') window.scrollTo({ top: 0, behavior: 'smooth' })
    setUserPaused(false)
  }

  return (
    <div className="sticky top-14 z-30 border-b border-line/70 bg-surface/90 backdrop-blur-xl md:top-[68px]" role="region" aria-label="Jamir Stories đang phát">
      <div className="container-page flex flex-col gap-2 py-2">
        <div className="flex gap-1" aria-hidden="true">
          {queue.map((slug, i) => (
            <span key={slug} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              {i < pos && <span className="block h-full rounded-full bg-brand-gradient" />}
              {i === pos && <StoryProgressFill key={storyKey} className="bg-brand-gradient" />}
            </span>
          ))}
        </div>
        {story.gift?.enabled && (story.gift.text || story.gift.image) && (
          <div className="flex items-center gap-2 rounded-[10px] bg-gradient-to-r from-pink-50 to-amber-50 px-2.5 py-1.5 text-xs font-semibold text-pink-700 ring-1 ring-pink-200">
            {story.gift.image ? <img src={story.gift.image} alt="" className="size-7 rounded-md object-cover" /> : <span aria-hidden="true">🎁</span>}
            <span className="min-w-0 flex-1 truncate">{story.gift.text || 'Quà tặng kèm khi mua hôm nay'}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <img src={story.thumbnail} alt="" className="size-8 shrink-0 rounded-full object-cover ring-2 ring-brand-500" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-bold">
              <span className="text-brand-gradient">Jamir Stories</span> · {story.label}
            </p>
            <p className={cn('truncate text-xs', reason ? 'text-orange-700' : 'text-muted')}>
              {pos + 1}/{queue.length} · {reason ? (
                PAUSE_TEXT[reason]
              ) : (
                <>
                  Sản phẩm tiếp theo sau <SecondsLeft />
                </>
              )}
            </p>
          </div>
          <BarButton label="Story trước" onClick={prev} disabled={pos === 0}>
            <ChevronLeft />
          </BarButton>
          {reason ? (
            <BarButton label="Tiếp tục" onClick={resume} primary>
              <Play className="fill-current" />
            </BarButton>
          ) : (
            <BarButton label="Tạm dừng" onClick={() => setUserPaused(true)}>
              <Pause className="fill-current" />
            </BarButton>
          )}
          <BarButton label="Story tiếp theo" onClick={next}>
            <ChevronRight />
          </BarButton>
          <BarButton label="Thoát Xem tất cả" onClick={stop}>
            <X />
          </BarButton>
        </div>
      </div>
    </div>
  )
}

function BarButton({
  label,
  onClick,
  disabled,
  primary,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-default disabled:opacity-40 [&_svg]:size-[18px]',
        primary ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-line-soft text-ink-soft hover:bg-line hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
