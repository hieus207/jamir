import { useEffect, useRef, useState } from 'react'
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

  const goTo = (i: number) => {
    const el = document.getElementById(PRODUCT_STEPS[i]?.id ?? "")
    const nav = navRef.current
    if (!el || !nav) return
    setActive(i)
    lockUntil.current = Date.now() + 700
    // use the stuck position (the nav may still be scrolling up towards it)
    const stuckBottom = (parseFloat(getComputedStyle(nav).top) || 0) + nav.offsetHeight
    const top = i === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY - stuckBottom - 12
    window.scrollTo({ top, behavior: 'smooth' })
  }

  if (storyActive) return null
  return (
    <nav
      ref={navRef}
      aria-label="Các bước xem sản phẩm"
      className={cn('sticky top-14 z-30 -mx-4 border-b border-line/70 bg-surface/92 backdrop-blur-xl md:top-[68px] md:-mx-6 lg:hidden', className)}
    >
      <div ref={stripRef} className="scrollbar-none relative flex gap-1 overflow-x-auto px-3 py-2 md:px-5">
        {PRODUCT_STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(i)}
            aria-current={i === active ? 'step' : undefined}
            className={cn(
              'flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors',
              i === active ? 'bg-ink text-white shadow-card' : 'text-ink-soft active:bg-canvas',
            )}
          >
            <span className={cn('text-[11px] tabular-nums', i === active ? 'text-white/60' : 'text-subtle')}>{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>
      <div className="h-0.5 bg-line/60" aria-hidden="true">
        <div className="h-full bg-gradient-to-r from-brand-600 to-accent-600 transition-[width] duration-300" style={{ width: `${((active + 1) / PRODUCT_STEPS.length) * 100}%` }} />
      </div>
    </nav>
  )
}
