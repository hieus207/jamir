import { useProduct } from '@/hooks/queries'
import { cn, formatPrice } from '@/lib/utils'
import type { SiteEvent } from '@/types/domain'
import { BrushButton, comic, marker, Scribble, TrustRow, useStreetFonts } from '../street/street'

/**
 * Poster-style promo popup (event style "poster"), composed like the 10.10 ad:
 * brand + kicker + huge highlight on a red stroke, big discount, model photo,
 * glowing product, slogan sticker, live price and colours, brush CTA, trust row.
 * Everything is sized in container units (cqw) so the admin preview matches.
 */
export function PosterPopup({ event, onGo }: { event: SiteEvent; onGo: () => void }) {
  useStreetFonts()
  const slug = event.target.type === 'product' ? event.target.value : ''
  const { data: product } = useProduct(slug, { enabled: !!slug })
  const p = product?.slug === slug ? product : undefined
  // "Giảm ngay 25%" → small "Giảm ngay" + huge "25%"
  const m = event.discountText?.match(/^(.*?)(\d+\s*%|\d+[kK])\s*$/)

  return (
    <div className="@container relative overflow-hidden rounded-[22px] bg-[#111] text-white shadow-2xl">
      <div className="relative aspect-[3/4]">
        {/* grunge + brush strokes */}
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_15%_20%,rgba(255,45,61,0.35),transparent_35%),radial-gradient(circle_at_85%_75%,rgba(232,255,46,0.18),transparent_35%),repeating-linear-gradient(120deg,rgba(255,255,255,0.04)_0_2px,transparent_2px_10px)]" />
        <span aria-hidden="true" className="absolute top-[8%] left-[-6%] h-[11%] w-[78%] -rotate-[8deg] bg-[#ff2d3d] [clip-path:polygon(0_30%,8%_0,100%_18%,96%_100%,4%_84%)]" />
        <span aria-hidden="true" className="absolute right-[-10%] bottom-[20%] h-[6%] w-[70%] rotate-[6deg] bg-[#e8ff2e] opacity-80 [clip-path:polygon(0_40%,10%_0,100%_25%,92%_100%,6%_80%)]" />

        {/* model photo (event image) */}
        {event.image && (
          <img
            src={event.image}
            alt=""
            className="absolute top-[21%] left-0 h-[42%] w-[50%] -rotate-2 border-[1.2cqw] border-white object-cover shadow-[1cqw_1.4cqw_0_rgba(0,0,0,0.6)] [clip-path:polygon(0_3%,96%_0,100%_95%,4%_100%)]"
          />
        )}

        {/* brand, kicker, highlight */}
        <span className={cn(comic, 'absolute top-[3.5%] left-[5%] -rotate-3 bg-white px-[2cqw] py-[0.5cqw] text-[6cqw] text-black shadow-[0.8cqw_0.8cqw_0_rgba(0,0,0,0.5)]')}>
          JAMIR<sup className="text-[2.4cqw]">®</sup>
        </span>
        <Scribble kind="crown" className="absolute top-[2%] left-[33%] size-[9cqw] rotate-12 text-[#ffe52e]" />
        {event.kicker && (
          <span className={cn(marker, 'absolute top-[11%] left-[5%] -rotate-[8deg] text-[8cqw] text-white drop-shadow-[0.6cqw_0.6cqw_0_rgba(0,0,0,0.6)]')}>{event.kicker}</span>
        )}
        <p className={cn(comic, 'absolute top-[5%] left-[34%] -rotate-[6deg] text-[21cqw] leading-none text-white drop-shadow-[1cqw_1cqw_0_#ff2d3d]')}>
          {event.highlight || event.title}
        </p>

        {/* discount */}
        <div className="absolute top-[17%] right-[4%] flex flex-col items-end text-right">
          {m ? (
            <>
              <span className={cn(marker, 'text-[6.5cqw] text-[#ff2d3d] drop-shadow-[0.4cqw_0.4cqw_0_white]')}>{m[1]!.trim()}</span>
              <span className={cn(comic, '-mt-[1cqw] -rotate-6 text-[22cqw] leading-none text-[#e8ff2e] drop-shadow-[1cqw_1cqw_0_rgba(0,0,0,0.75)]')}>{m[2]}</span>
            </>
          ) : (
            event.discountText && <span className={cn(marker, 'text-[9cqw] text-[#e8ff2e]')}>{event.discountText}</span>
          )}
          {event.note && (
            <span className={cn(comic, 'mt-[1cqw] rotate-3 bg-white px-[1.6cqw] py-[0.4cqw] text-[4.4cqw] text-black shadow-[0.6cqw_0.6cqw_0_rgba(0,0,0,0.5)]')}>{event.note}</span>
          )}
          
        </div>

        {/* glowing product */}
        {p && (
          <div className="absolute top-[45%] left-[44%] aspect-square w-[33%]">
            <span aria-hidden="true" className="absolute -inset-[4%] rounded-[30%] bg-[conic-gradient(from_0deg,#ff2d3d,#ffe52e,#25f4ee,#7c3aed,#ff2d3d)] opacity-90 blur-[2.5cqw]" />
            <img src={p.thumbnail} alt="" className="relative size-full rounded-[24%] border-[1cqw] border-white object-cover shadow-[1.2cqw_1.6cqw_0_rgba(0,0,0,0.6)]" />
          </div>
        )}

        {/* slogan sticker + side note */}
        {event.description && (
          <p className={cn(marker, 'absolute top-[53%] left-[3%] max-w-[40%] -rotate-[7deg] bg-white px-[2cqw] py-[1.2cqw] text-[4.4cqw] text-black shadow-[0.8cqw_0.8cqw_0_rgba(0,0,0,0.55)]')}>
            {event.description}
          </p>
        )}
        <Scribble kind="smile" className="absolute top-[47%] left-[40%] size-[7cqw] text-[#ffe52e]" />
        {event.sideNote && (
          <p className={cn(marker, 'absolute top-[50%] right-[2%] max-w-[20%] rotate-[-12deg] text-right text-[4.2cqw] text-white')}>
            {event.sideNote}
            <Scribble kind="underline" className="ml-auto size-[10cqw] text-[#ff2d3d]" />
          </p>
        )}

        {/* price + colours */}
        {p && (
          <div className="absolute bottom-[20%] left-[5%]">
            {p.originalPrice > p.price && <p className={cn(comic, 'text-[5.5cqw] text-white/70 line-through')}>{formatPrice(p.originalPrice)}</p>}
            <p className={cn(comic, '-rotate-3 text-[12cqw] leading-none text-[#ff2d3d] [text-shadow:0.7cqw_0.7cqw_0_#fff,-0.3cqw_-0.3cqw_0_#fff]')}>{formatPrice(p.price)}</p>
          </div>
        )}
        {p && p.colors.length > 1 && (
          <div className="absolute right-[4%] bottom-[21%] flex -space-x-[2cqw]">
            {p.colors.slice(0, 5).map((c) => (
              <span key={c.id} title={c.name} className="relative size-[10cqw] overflow-hidden rounded-[2cqw] border-[0.6cqw] border-white bg-white shadow">
                <img src={c.image} alt="" className="size-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 h-1/2 mix-blend-multiply" style={{ background: `linear-gradient(transparent, ${c.hex})` }} />
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="absolute inset-x-[5%] bottom-[5%]">
          <BrushButton onClick={onGo} className="w-full py-[2.5cqw] text-[7cqw] md:text-[7cqw] [&_svg]:size-[7cqw]">
            {event.ctaText || 'Săn deal ngay'}
          </BrushButton>
        </div>
      </div>
      <div className="relative bg-black px-[4cqw] py-[2.5cqw]">
        <TrustRow dark className="grid-cols-4 [&_li]:text-[2.6cqw] [&_svg]:size-[4.5cqw]" />
      </div>
    </div>
  )
}
