import { Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useStories } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useUiStore } from '@/stores/uiStore'
import { useAuthDialog } from '../auth/authStore'
import { StoriesStrip } from './StoriesStrip'
import { productStories } from './storyMode'
import { useStoryNav } from './StoryModeController'

/**
 * Home: Jamir Stories, one story per product. "Xem tất cả" opens story 01's
 * product page and story mode moves to a random product every `intervalSeconds`.
 * If the visitor does nothing for `idleSeconds` (no click / scroll / key / touch),
 * "Xem tất cả" starts by itself.
 */
export function StoriesHero({ className }: { className?: string }) {
  const { data, isPending } = useStories()
  const items = useMemo(() => productStories(data?.items ?? []), [data])
  const { start } = useStoryNav()
  const idle = data ? (data.config.idleSeconds ?? 10) : 0
  const [countdown, setCountdown] = useState<number | null>(null)
  const busy = useCheckoutStore((s) => s.open)
  const cartOpen = useUiStore((s) => s.cartOpen)
  const authOpen = useAuthDialog((s) => s.mode !== null)
  const blocked = busy || cartOpen || authOpen

  // any interaction cancels the auto start for this visit
  useEffect(() => {
    if (!idle || !items.length) return
    setCountdown(idle)
    const cancel = () => setCountdown(null)
    const onScroll = () => window.scrollY > 40 && cancel()
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, cancel, { passive: true }))
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      events.forEach((e) => window.removeEventListener(e, cancel))
      window.removeEventListener('scroll', onScroll)
    }
  }, [idle, items.length])

  useEffect(() => {
    if (countdown === null || blocked) return
    if (countdown <= 0) {
      setCountdown(null)
      start()
      return
    }
    const t = setTimeout(() => {
      if (document.visibilityState === 'visible') setCountdown((c) => (c === null ? null : c - 1))
    }, 1000)
    return () => clearTimeout(t)
  }, [countdown, blocked, start])

  return (
    <section aria-labelledby="stories-hero-title" className={cn('flex flex-col gap-3 md:gap-4', className)}>
      <div>
        <h2 id="stories-hero-title" className="flex items-center gap-2 text-xl font-extrabold tracking-tight md:text-2xl">
          <span className="text-brand-gradient">Jamir Stories</span>
          <Sparkles className="size-5 text-accent-500" aria-hidden="true" />
        </h2>
        <p className="text-xs text-muted md:text-sm">Bấm "Xem tất cả" để lướt qua từng sản phẩm như xem story</p>
      </div>
      <StoriesStrip
        items={items}
        loading={isPending}
        countdown={countdown}
        onSelect={(s) => start(s.productSlug)}
        onPlayAll={() => start()}
      />
    </section>
  )
}
