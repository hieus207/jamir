import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { elapsedNow, useStoryMode } from './storyMode'

/**
 * Progress of the playing story, drawn by a CSS animation (no per-frame React
 * renders — those starved the page transition on slower machines). Remounted
 * per story via `key`; pauses with `animation-play-state`.
 */
export function StoryProgressFill({ className }: { className?: string }) {
  const interval = useStoryMode((s) => s.interval)
  const running = useStoryMode((s) => s.active && s.pauseReason === null)
  // start offset is fixed at mount; later pauses are handled by play-state
  const [offset] = useState(() => elapsedNow(useStoryMode.getState()))
  return (
    <span
      className={cn('block h-full origin-left rounded-full', className)}
      style={{
        animation: `story-fill ${interval}ms linear forwards`,
        animationDelay: `-${Math.min(offset, interval)}ms`,
        animationPlayState: running ? 'running' : 'paused',
      }}
    />
  )
}

/** Key that changes whenever a new story starts (restart the fill). */
export const useStoryKey = () => useStoryMode((s) => `${s.queue.join('|')}#${s.pos}`)

/** "12s" until the next product — re-renders once per second only. */
export function SecondsLeft() {
  const [, force] = useState(0)
  const running = useStoryMode((s) => s.active && s.pauseReason === null)
  const key = useStoryKey()
  useEffect(() => {
    force((n) => n + 1)
    if (!running) return
    const t = setInterval(() => force((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [running, key])
  const s = useStoryMode.getState()
  return <>{Math.max(0, Math.ceil((s.interval - elapsedNow(s)) / 1000))}s</>
}
