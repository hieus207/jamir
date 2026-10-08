import { ChevronLeft, ChevronRight, Hand } from 'lucide-react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { usePrefetchProduct, useProductNeighbors } from '@/hooks/queries'
import { cn, formatPrice } from '@/lib/utils'
import { useSwipeStore } from '@/stores/swipeStore'
import type { ProductSummary } from '@/types/domain'

const IGNORE =
  '[data-swipe-ignore],[aria-roledescription="carousel"],[role="slider"],.overflow-x-auto,input,textarea,select,[role="dialog"]'
const THRESHOLD = 72

/**
 * JAMIR product swipe:
 *  - mobile: swipe left → next product, right → previous (live drag feedback)
 *  - desktop: side arrows with a preview card, Shift + ← / →
 * Navigation updates the URL client-side; neighbours are prefetched so the
 * next product renders instantly.
 */
export function ProductSwipeNavigator({ slug, children }: { slug: string; children: ReactNode }) {
  const navigate = useNavigate()
  const { data: nb } = useProductNeighbors(slug)
  const prefetch = usePrefetchProduct()
  const setDirection = useSwipeStore((s) => s.setDirection)
  const x = useMotionValue(0)
  const hintOpacity = useTransform(x, [-120, -30, 0, 30, 120], [1, 0.2, 0, 0.2, 1])

  useEffect(() => {
    if (nb?.next) prefetch(nb.next.slug)
    if (nb?.prev) prefetch(nb.prev.slug)
  }, [nb, prefetch])

  const go = useCallback(
    (dir: 1 | -1) => {
      const target = dir === 1 ? nb?.next : nb?.prev
      if (!target) return
      setDirection(dir)
      navigate(`/san-pham/${target.slug}`)
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    },
    [nb, navigate, setDirection],
  )

  // keyboard: Shift + ArrowLeft / ArrowRight
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return
      if ((e.target as HTMLElement).closest('input,textarea,[contenteditable]')) return
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  // touch swipe (horizontal only, ignores carousels / sliders / scrollers)
  const start = useRef<{ x: number; y: number; locked: 'x' | 'y' | null } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    if (!t || e.touches.length > 1 || (e.target as HTMLElement).closest(IGNORE)) return
    start.current = { x: t.clientX, y: t.clientY, locked: null }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const s = start.current
    const t = e.touches[0]
    if (!s || !t) return
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (!s.locked && Math.hypot(dx, dy) > 10) s.locked = Math.abs(dx) > Math.abs(dy) * 1.3 ? 'x' : 'y'
    if (s.locked === 'x') x.set(dx * 0.45)
  }
  const onTouchEnd = () => {
    const s = start.current
    start.current = null
    if (!s || s.locked !== 'x') return
    const dx = x.get() / 0.45
    if (dx <= -THRESHOLD) go(1)
    else if (dx >= THRESHOLD) go(-1)
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 })
  }

  return (
    <div className="relative" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      <motion.div style={{ x }}>{children}</motion.div>

      {/* mobile edge hints while dragging */}
      <motion.div style={{ opacity: hintOpacity }} className="pointer-events-none fixed inset-y-0 left-0 z-30 flex items-center lg:hidden">
        <EdgeHint product={nb?.prev} side="left" />
      </motion.div>
      <motion.div style={{ opacity: hintOpacity }} className="pointer-events-none fixed inset-y-0 right-0 z-30 flex items-center lg:hidden">
        <EdgeHint product={nb?.next} side="right" />
      </motion.div>

      {/* desktop arrows */}
      {nb && (
        <>
          <SideArrow product={nb.prev} side="left" onClick={() => go(-1)} />
          <SideArrow product={nb.next} side="right" onClick={() => go(1)} />
        </>
      )}
      {nb && <SwipeHint index={nb.index} total={nb.total} />}
    </div>
  )
}

function EdgeHint({ product, side }: { product?: ProductSummary | null; side: 'left' | 'right' }) {
  if (!product) return null
  return (
    <div className={cn('flex items-center gap-2 rounded-full bg-ink/85 py-1.5 text-xs font-semibold text-white shadow-lift', side === 'left' ? 'ml-2 pr-3 pl-1.5' : 'mr-2 flex-row-reverse pr-1.5 pl-3')}>
      <img src={product.thumbnail} alt="" className="size-7 rounded-full object-cover" />
      {product.name}
    </div>
  )
}

function SideArrow({ product, side, onClick }: { product: ProductSummary | null; side: 'left' | 'right'; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  if (!product) return null
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <div
      className={cn('fixed top-1/2 z-30 hidden -translate-y-1/2 items-center gap-2 lg:flex', side === 'left' ? 'left-2 xl:left-4' : 'right-2 flex-row-reverse xl:right-4')}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <button
        type="button"
        onClick={onClick}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        aria-label={`${side === 'left' ? 'Sản phẩm trước' : 'Sản phẩm tiếp theo'}: ${product.name}`}
        aria-keyshortcuts={side === 'left' ? 'Shift+ArrowLeft' : 'Shift+ArrowRight'}
        className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-surface/90 text-ink shadow-card backdrop-blur transition-[transform,color,box-shadow] hover:scale-105 hover:text-brand-600 hover:shadow-lift active:scale-95"
      >
        <Icon className="size-6" />
      </button>
      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, x: side === 'left' ? -6 : 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: side === 'left' ? -6 : 6 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none flex w-56 items-center gap-3 rounded-card border border-line bg-surface p-2.5 shadow-lift"
          >
            <img src={product.thumbnail} alt="" className="size-12 rounded-[10px] bg-canvas object-cover" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted">{side === 'left' ? 'Sản phẩm trước' : 'Tiếp theo'} · Shift {side === 'left' ? '←' : '→'}</p>
              <p className="truncate text-sm font-semibold">{product.name}</p>
              <p className="text-xs font-bold text-brand-700">{formatPrice(product.price)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const HINT_KEY = 'jamir-swipe-hint'

/** One-time mobile hint + position dots. */
function SwipeHint({ index, total }: { index: number; total: number }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try {
      if (!localStorage.getItem(HINT_KEY)) {
        setShow(true)
        localStorage.setItem(HINT_KEY, '1')
        const id = setTimeout(() => setShow(false), 3800)
        return () => clearTimeout(id)
      }
    } catch {
      /* storage unavailable */
    }
  }, [])
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[84px] z-30 flex justify-center lg:hidden" aria-hidden="true">
        <div className="flex items-center gap-1 rounded-full bg-ink/60 px-2 py-1.5 backdrop-blur">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/45')} />
          ))}
        </div>
      </div>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-none fixed inset-x-0 bottom-[118px] z-30 flex justify-center lg:hidden"
          >
            <p className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white shadow-lift">
              <motion.span animate={{ x: [0, -10, 10, 0] }} transition={{ duration: 1.4, repeat: 2 }}>
                <Hand className="size-4" aria-hidden="true" />
              </motion.span>
              Vuốt ngang để xem sản phẩm khác
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
