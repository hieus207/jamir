import { Compass, House, Store, UsersRound } from 'lucide-react'
import { motion } from 'motion/react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

const ITEMS = [
  { to: '/', label: 'Trang chủ', icon: House, end: true },
  { to: '/shop', label: 'Cửa hàng', icon: Store },
  { to: '/explore', label: 'Khám phá', icon: Compass },
  { to: '/cong-dong', label: 'Cộng đồng', icon: UsersRound },
]

/** Mobile tab bar (< md), fixed on every page (product pages stack the buy bar above it). Yêu thích / Tôi live in the header. */
export function BottomNavigation({ dark }: { dark?: boolean }) {
  return (
    <nav
      aria-label="Điều hướng"
      className={cn('pb-safe fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl md:hidden', dark ? 'border-white/10 bg-black' : 'border-line/70 bg-surface')}
    >
      <ul className="grid h-16 grid-cols-4">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                  isActive ? (dark ? 'text-white' : 'text-brand-600') : dark ? 'text-white/55' : 'text-muted',
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
