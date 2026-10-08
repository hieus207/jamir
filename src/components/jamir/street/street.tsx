import { ArrowRight, Headset, PackageCheck, ShieldCheck, ShoppingCart, Truck } from 'lucide-react'
import { Fragment, type ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * "Street / graffiti" kit for ad landing pages and poster popups:
 * marker fonts with Vietnamese glyphs, torn paper, tape labels, scribbles,
 * brush-stroke CTA. Fonts load only where the kit is used.
 */

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Bangers&family=Sedgwick+Ave+Display&display=swap'
export function useStreetFonts() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = FONT_HREF
    document.head.appendChild(l)
  }, [])
}

/** Graffiti marker (headlines, captions) and comic bold (labels). */
export const marker = "font-['Sedgwick_Ave_Display',cursive] leading-[0.95]"
export const comic = "font-['Bangers',system-ui] tracking-wide"

/** "Nhỏ vậy thôi nhưng *chất* [không nhỏ]" → *red marker word*, [yellow tape]. Line breaks kept. */
export function StreetText({ text, className, big }: { text: string; className?: string; /** bigger *red* words (hero headlines) */ big?: boolean }) {
  const parts = text.split(/(\*[^*]+\*|\[[^\]]+\])/g).filter(Boolean)
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.startsWith('*') ? (
          <span key={i} className={cn('inline-block -rotate-3 text-[#ff2d3d] drop-shadow-[3px_3px_0_rgba(0,0,0,0.6)]', big ? 'text-[1.75em] leading-[0.85]' : 'text-[1.35em]')}>
            {p.slice(1, -1)}
          </span>
        ) : p.startsWith('[') ? (
          <Tape key={i} className="mx-1 text-[0.5em] align-middle">
            {p.slice(1, -1)}
          </Tape>
        ) : (
          <Fragment key={i}>
            {p.split('\n').map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </Fragment>
        ),
      )}
    </span>
  )
}

/** Yellow (or red) tape label. */
export function Tape({ children, tone = 'yellow', className }: { children: ReactNode; tone?: 'yellow' | 'red' | 'white'; className?: string }) {
  return (
    <span
      className={cn(
        comic,
        'inline-block -rotate-2 px-3 py-1 text-black shadow-[2px_3px_0_rgba(0,0,0,0.45)] [clip-path:polygon(2%_8%,100%_0,97%_92%,0_100%)]',
        tone === 'yellow' && 'bg-[#ffe52e]',
        tone === 'red' && 'bg-[#ff2d3d] text-white',
        tone === 'white' && 'bg-white',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Jagged paper edge (put it at the top or bottom of a section). */
export function TornEdge({ color = '#f5f3ee', flip, className }: { color?: string; flip?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true" className={cn('block h-5 w-full md:h-8', flip && 'rotate-180', className)}>
      <path
        fill={color}
        d="M0 40V18l38 9 27-14 41 12 33-17 29 15 46-11 24 13 52-16 31 12 44-9 23 14 48-18 36 15 29-10 47 13 26-15 39 11 44-12 28 16 51-14 22 10 45-17 34 15 40-9 27 13 49-16 31 12 38-11 26 14 43-10 30 16 47-15 25 11 42-13 33 15V40Z"
      />
    </svg>
  )
}

/** Hand-drawn scribbles. */
export function Scribble({ kind, className }: { kind: 'crown' | 'arrow' | 'smile' | 'bolt' | 'underline' | 'sparks'; className?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      {kind === 'crown' && <path {...common} d="M12 72 18 30l20 22 12-30 13 30 19-22 6 42Z M14 82h72" />}
      {kind === 'arrow' && <path {...common} d="M10 20c10 30 40 52 72 54 M62 58l20 16-24 10" />}
      {kind === 'smile' && (
        <>
          <circle {...common} cx="50" cy="50" r="36" />
          <path {...common} d="M36 40v6 M64 40v6 M32 60c10 14 26 14 36 0" />
        </>
      )}
      {kind === 'bolt' && <path {...common} d="M58 8 28 56h22L40 92l34-50H52Z" />}
      {kind === 'underline' && <path {...common} d="M4 60c30-10 60-12 92-6 M10 76c26-6 52-8 80-2" />}
      {kind === 'sparks' && <path {...common} d="M50 6v22 M20 20l14 14 M80 20 66 34 M8 54h20 M72 54h20" />}
    </svg>
  )
}

/** Red brush-stroke call to action. */
export function BrushButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        comic,
        'group relative inline-flex cursor-pointer items-center justify-center gap-3 bg-[#ff2d3d] px-8 py-3 text-2xl text-white shadow-[4px_5px_0_rgba(0,0,0,0.55)] transition-transform [clip-path:polygon(3%_10%,30%_2%,62%_8%,97%_0,100%_42%,96%_92%,64%_100%,28%_93%,0_100%,2%_52%)] hover:-rotate-1 hover:scale-[1.03] active:scale-95 disabled:opacity-50 md:text-3xl',
        className,
      )}
    >
      <ShoppingCart className="size-7 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      {children}
      <ArrowRight className="size-6 shrink-0 transition-transform group-hover:translate-x-1" strokeWidth={3} aria-hidden="true" />
    </button>
  )
}

/** Trust row (free shipping, warranty, check before paying, 24/7). */
export function TrustRow({ className, dark }: { className?: string; dark?: boolean }) {
  const items = [
    { icon: Truck, text: 'Miễn phí vận chuyển' },
    { icon: ShieldCheck, text: 'Bảo hành 12 tháng' },
    { icon: PackageCheck, text: 'Kiểm tra hàng trước khi thanh toán' },
    { icon: Headset, text: 'Hỗ trợ 24/7' },
  ]
  return (
    <ul className={cn('grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4', className)}>
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className={cn('flex items-center gap-2 text-xs leading-tight', dark ? 'text-white/80' : 'text-ink-soft')}>
          <Icon className="size-6 shrink-0" strokeWidth={1.6} aria-hidden="true" />
          {text}
        </li>
      ))}
    </ul>
  )
}

/** Subtle grain + spray texture for dark sections. */
export const grunge =
  'bg-[#0e0e10] [background-image:radial-gradient(circle_at_20%_10%,rgba(255,45,61,0.18),transparent_40%),radial-gradient(circle_at_85%_60%,rgba(255,229,46,0.10),transparent_38%),repeating-linear-gradient(115deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px)]'
