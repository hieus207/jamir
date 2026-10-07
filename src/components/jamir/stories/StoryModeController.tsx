import { useCallback, useEffect } from 'react'
import { useMatch, useNavigate } from 'react-router'
import { usePrefetchProduct, useStories } from '@/hooks/queries'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useSwipeStore } from '@/stores/swipeStore'
import { useUiStore } from '@/stores/uiStore'
import { useAuthDialog } from '../auth/authStore'
import { elapsedNow, type PauseReason, useStoryMode } from './storyMode'

/** Story-mode navigation: update the playlist and open the product page. */
export function useStoryNav() {
  const navigate = useNavigate()
  const setDirection = useSwipeStore((s) => s.setDirection)
  const { data } = useStories()

  const open = useCallback(
    (slug: string | undefined, dir: 1 | -1 = 1) => {
      if (!slug) return
      setDirection(dir)
      // story steps always start at the top of the page (see ScrollRestoration in AppLayout)
      navigate(`/product/${slug}`, { state: { story: true } })
    },
    [navigate, setDirection],
  )

  return {
    /** start "Xem tất cả" at a product (default: story 01 = highest priority) */
    start: useCallback(
      (slug?: string) => {
        if (!data) return
        const first = slug ?? data.items.find((s) => s.productSlug)?.productSlug
        if (!first) return
        useStoryMode.getState().start(data.items, first, data.config)
        open(first)
      },
      [data, open],
    ),
    next: useCallback(() => open(useStoryMode.getState().next(), 1), [open]),
    prev: useCallback(() => open(useStoryMode.getState().prev(), -1), [open]),
    goTo: useCallback(
      (slug: string) => {
        const st = useStoryMode.getState()
        const dir = st.queue.indexOf(slug) < st.pos ? -1 : 1
        st.goTo(slug)
        st.setUserPaused(false)
        open(slug, dir)
      },
      [open],
    ),
  }
}

const SCROLL_PAUSE = 0.45 // × viewport height

/**
 * Runs story mode (mounted once in AppLayout): ticks the timer, opens the next
 * random product when time is up, pauses while the shopper reads (scrolled down),
 * has a dialog open or the tab is hidden, and exits when leaving product pages.
 */
export function StoryModeController() {
  const match = useMatch('/product/:slug')
  const slug = match?.params.slug
  const active = useStoryMode((s) => s.active)
  const userPaused = useStoryMode((s) => s.userPaused)
  const checkoutOpen = useCheckoutStore((s) => s.open)
  const cartOpen = useUiStore((s) => s.cartOpen)
  const authOpen = useAuthDialog((s) => s.mode !== null)
  const dialogOpen = checkoutOpen || cartOpen || authOpen
  const { next } = useStoryNav()

  // route → playlist: manual navigation to another story product continues from it, anything else exits
  useEffect(() => {
    const st = useStoryMode.getState()
    if (!st.active) return
    if (!slug || !st.stories.some((s) => s.productSlug === slug)) st.stop()
    else if (st.queue[st.pos] !== slug) st.goTo(slug)
  }, [slug])

  // pause reasons
  useEffect(() => {
    if (!active) return
    const update = () => {
      const reason: PauseReason = userPaused
        ? 'user'
        : dialogOpen
          ? 'dialog'
          : document.visibilityState !== 'visible'
            ? 'hidden'
            : window.scrollY > window.innerHeight * SCROLL_PAUSE
              ? 'scroll'
              : null
      if (useStoryMode.getState().pauseReason !== reason) useStoryMode.getState().setPauseReason(reason)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    document.addEventListener('visibilitychange', update)
    return () => {
      window.removeEventListener('scroll', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [active, userPaused, dialogOpen])

  // timer: a single timeout per story (no per-frame state updates — they made
  // page transitions lag on slower machines); progress bars animate in CSS
  const running = useStoryMode((s) => s.active && s.pauseReason === null)
  const storyKey = useStoryMode((s) => `${s.queue.join('|')}#${s.pos}`)
  useEffect(() => {
    useStoryMode.getState().run(running)
  }, [running])
  useEffect(() => {
    if (!running) return
    const st = useStoryMode.getState()
    const t = setTimeout(next, Math.max(0, st.interval - elapsedNow(st)))
    return () => clearTimeout(t)
  }, [running, storyKey, next])

  // warm the next product so the jump renders instantly
  const prefetch = usePrefetchProduct()
  useEffect(() => {
    const { active, queue, pos } = useStoryMode.getState()
    const upcoming = queue[pos + 1] ?? queue[0]
    if (active && upcoming) void prefetch(upcoming)
  }, [storyKey, prefetch])

  return null
}
