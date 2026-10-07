import { Compass, Heart, House, Store, UserRound } from 'lucide-react'
import { motion } from 'motion/react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { useWishlistStore } from '@/stores/wishlistStore'

const ITEMS = [
  { to: '/', label: 'Trang chủ', icon: House, end: true },
  { to: '/shop', label: 'Cửa hàng', icon: Store },
  { to: '/explore', label: 'Khám phá', icon: Compass },
  { to: '/wishlist', label: 'Yêu thích', icon: Heart },
  { to: '/account', label: 'Tôi', icon: UserRound },
]

/** Mobile tab bar (< md). Hidden on product pages, where the purchase CTA takes its place. */
export function BottomNavigation() {
  const wishCount = useWishlistStore((s) => s.ids.length)
  return (
    <nav
      aria-label="Điều hướng"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-surface/92 backdrop-blur-xl md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-brand-600' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="bottom-nav-pill"
                      className="absolute top-0 h-[3px] w-8 rounded-b-full bg-brand-gradient"
                      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                    />
                  )}
                  <span className="relative">
                    <Icon className="size-[22px]" strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
                    {to === '/wishlist' && wishCount > 0 && (
                      <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                        {wishCount}
                      </span>
                    )}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
