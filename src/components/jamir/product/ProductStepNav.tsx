import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { useStoryMode } from '../stories/storyMode'

/** Mobile funnel, in visual order: swipe ↑ = go deeper into the same product. */
export const PRODUCT_STEPS = [
  { id: 'tong-quan', label: 'Tổng quan' },
  { id: 'kol-reviews', label: 'KOL Review' },
  { id: 'reviews', label: 'Đánh giá' },
  { id: 'thong-so', label: 'Thông số' },
  { id: 'phu-hop', label: 'Phù hợp' },
  { id: 'dat-hang', label: 'Đặt hàng' },
] as const

/**
 * Sticky step tabs under the mobile header (< lg): scroll-spy highlights the
 * step being read, tapping a tab scrolls to it. Hidden while story mode runs
 * (the story bar owns that slot).
 */
export function ProductStepNav({ productId, className }: { productId: string; className?: string }) {
  const storyActive = useStoryMode((s) => s.active)
  const navRef = useRef<HTMLElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const lockUntil = useRef(0)
  const [active, setActive] = useState(0)
  const location = useLocation()
  const step = (location.state as { step?: string } | null)?.step
  const fromFeed = (location.state as { from?: string } | null)?.from === 'feed'

  // scroll-spy
  useEffect(() => {
    setActive(0)
    let raf = 0
    const update = () => {
      raf = 0
      const nav = navRef.current
      if (!nav || nav.offsetParent === null || Date.now() < lockUntil.current) return
      const line = nav.getBoundingClientRect().bottom + 32
      let current = 0
      PRODUCT_STEPS.forEach((s, i) => {
        const el = document.getElementById(s.id)
        if (el && el.offsetParent !== null && el.getBoundingClientRect().top <= line) current = i
      })
      setActive(current)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [productId, storyActive])

  // keep the active tab centred in the strip (never scrolls the page)
  useEffect(() => {
    const strip = stripRef.current
    const btn = strip?.children[active] as HTMLElement | undefined
    if (strip && btn) strip.scrollTo({ left: btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2, behavior: 'smooth' })
  }, [active])

  const goTo = (i: number, behavior: ScrollBehavior = 'smooth') => {
    const el = document.getElementById(PRODUCT_STEPS[i]?.id ?? "")
    const nav = navRef.current
    if (!el || !nav) return
    setActive(i)
    lockUntil.current = Date.now() + 700
    // use the stuck position (the nav may still be scrolling up towards it)
    const stuckBottom = (parseFloat(getComputedStyle(nav).top) || 0) + nav.offsetHeight
    const top = i === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY - stuckBottom - 12
    window.scrollTo({ top, behavior })
  }

  // arriving from the home feed: swipe ↑ = KOL Review, comment = Đánh giá, Mua = Đặt hàng
  useEffect(() => {
    const n = PRODUCT_STEPS.findIndex((s) => s.id === step)
    if (n <= 0) return
    // slow devices may still be laying out: jump, then re-check and settle instantly
    const target = () => document.getElementById(PRODUCT_STEPS[n]?.id ?? '')
    const off = () => {
      const nav = navRef.current
      const el = target()
      return nav && el ? el.getBoundingClientRect().top - ((parseFloat(getComputedStyle(nav).top) || 0) + nav.offsetHeight + 12) : 0
    }
    const ids = [
      setTimeout(() => goTo(n, fromFeed ? ('instant' as ScrollBehavior) : 'smooth'), fromFeed ? 30 : 380),
      ...(fromFeed ? [setTimeout(() => goTo(n, 'instant' as ScrollBehavior), 360)] : []),
      ...[1100, 1800].map((ms) =>
        setTimeout(() => {
          const d = off()
          if (Math.abs(d) > 24) {
            lockUntil.current = Date.now() + 300
            setActive(n)
            window.scrollBy({ top: d, behavior: 'instant' as ScrollBehavior })
          }
        }, ms),
      ),
    ]
    return () => ids.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, step])

  if (storyActive) return null
  return (
    <nav
      ref={navRef}
      aria-label="Các bước xem sản phẩm"
      className={cn('sticky top-14 z-30 -mx-4 border-b border-line/70 bg-surface md:top-[68px] md:-mx-6 lg:hidden', className)}
    >
      <div ref={stripRef} className="scrollbar-none relative flex overflow-x-auto px-2 md:px-4">
        {PRODUCT_STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(i)}
            aria-current={i === active ? 'step' : undefined}
            className={cn(
              'relative flex h-11 shrink-0 cursor-pointer items-center px-3 text-[14px] font-semibold whitespace-nowrap transition-colors',
              i === active ? 'text-brand-600' : 'text-muted active:text-ink',
            )}
          >
            {s.label}
            <span className={cn('absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-brand-gradient transition-opacity', i === active ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
          </button>
        ))}
      </div>
    </nav>
  )
}
