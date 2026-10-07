import { create } from 'zustand'
import type { StoriesConfig, Story } from '@/types/domain'

/** One story per product: product stories only, first (highest priority) per product. */
export function productStories(items: Story[]) {
  const seen = new Set<string>()
  return items.filter((s) => {
    if (!s.productSlug || seen.has(s.productSlug)) return false
    seen.add(s.productSlug)
    return true
  })
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export type PauseReason = 'user' | 'scroll' | 'dialog' | 'hidden' | null

interface StoryModeState {
  active: boolean
  stories: Story[]
  /** product slugs in play order for the current cycle */
  queue: string[]
  pos: number
  /** ms spent on the current story before the last resume */
  elapsed: number
  /** Date.now() when the timer last resumed; null while paused */
  startedAt: number | null
  /** ms per story (stories.json → config.intervalSeconds) */
  interval: number
  order: StoriesConfig['order']
  userPaused: boolean
  /** why the timer is not running (set by the controller) */
  pauseReason: PauseReason

  start: (stories: Story[], startSlug: string, config?: StoriesConfig) => void
  stop: () => void
  /** advance; returns the slug to open */
  next: () => string | undefined
  prev: () => string | undefined
  /** jump to a product's story; the rest of the cycle continues after it */
  goTo: (slug: string) => void
  /** start / stop the clock (called by the controller) */
  run: (on: boolean) => void
  setUserPaused: (v: boolean) => void
  setPauseReason: (r: PauseReason) => void
}

/**
 * "Xem tất cả" story mode: each story is a product page. The controller
 * (StoryModeController) runs the timer and opens /product/:slug for each step.
 */
export const useStoryMode = create<StoryModeState>()((set, get) => {
  const arrange = (slugs: string[]) => (get().order === 'priority' ? slugs : shuffle(slugs))
  // new story: clock back to 0, keep running if it was running
  const reset = () => ({ elapsed: 0, startedAt: get().startedAt === null ? null : Date.now() })
  return {
    active: false,
    stories: [],
    queue: [],
    pos: 0,
    elapsed: 0,
    startedAt: null,
    interval: 20_000,
    order: 'random',
    userPaused: false,
    pauseReason: null,

    start: (stories, startSlug, config) => {
      const list = productStories(stories)
      const slugs = list.map((s) => s.productSlug!)
      set({ order: config?.order ?? 'random' })
      set({
        active: true,
        stories: list,
        queue: [startSlug, ...arrange(slugs.filter((x) => x !== startSlug))],
        pos: 0,
        interval: Math.max(3, config?.intervalSeconds ?? 20) * 1000,
        userPaused: false,
        elapsed: 0,
        startedAt: null,
      })
    },

    stop: () => set({ active: false, queue: [], pos: 0, userPaused: false, pauseReason: null, elapsed: 0, startedAt: null }),

    next: () => {
      const { queue, pos, stories } = get()
      if (!queue.length) return
      if (pos + 1 < queue.length) {
        set({ pos: pos + 1, ...reset() })
        return queue[pos + 1]
      }
      // cycle done → reshuffle, never repeat the last story right away
      const last = queue[queue.length - 1]
      let order = arrange(stories.map((s) => s.productSlug!))
      if (order[0] === last && order.length > 1) order = [...order.slice(1), order[0]!]
      set({ queue: order, pos: 0, ...reset() })
      return order[0]
    },

    prev: () => {
      const { queue, pos } = get()
      if (!queue.length) return
      const p = Math.max(0, pos - 1)
      set({ pos: p, ...reset() })
      return queue[p]
    },

    goTo: (slug) => {
      const { queue, pos } = get()
      if (queue[pos] === slug) return
      const seen = queue.slice(0, pos)
      const i = queue.indexOf(slug)
      if (i > pos) {
        // upcoming story: move it to the current slot
        const rest = queue.slice(pos).filter((x) => x !== slug)
        set({ queue: [...seen, slug, ...rest], pos, ...reset() })
      } else if (i >= 0) {
        set({ pos: i, ...reset() })
      }
    },

    run: (on) => {
      const { startedAt, elapsed } = get()
      if (on && startedAt === null) set({ startedAt: Date.now() })
      if (!on && startedAt !== null) set({ elapsed: elapsed + Date.now() - startedAt, startedAt: null })
    },
    setUserPaused: (userPaused) => set({ userPaused }),
    setPauseReason: (pauseReason) => set({ pauseReason }),
  }
})

export const currentStory = (s: Pick<StoryModeState, 'stories' | 'queue' | 'pos'>) =>
  s.stories.find((x) => x.productSlug === s.queue[s.pos])

/** ms spent on the current story right now. */
export const elapsedNow = (s: Pick<StoryModeState, 'elapsed' | 'startedAt'>) => s.elapsed + (s.startedAt === null ? 0 : Date.now() - s.startedAt)
