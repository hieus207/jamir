import { type RefObject, useEffect, useState } from 'react'

/**
 * Sticky sidebar that may be taller than the viewport: sticks at `offset`
 * when it fits, otherwise sticks with its bottom 16px above the viewport
 * bottom (it scrolls with the page until fully revealed).
 */
export function useStickyTop(ref: RefObject<HTMLElement | null>, offset = 88) {
  const [top, setTop] = useState(offset)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setTop(Math.min(offset, window.innerHeight - el.offsetHeight - 16))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [ref, offset])
  return top
}
