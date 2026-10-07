import { Compass, Heart, ShoppingCart, UsersRound } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { NavLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { selectCartCount, useCartStore } from '@/stores/cartStore'
import { useUiStore } from '@/stores/uiStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { Logo } from '../brand/Logo'
import { useAuthDialog } from '../auth/AuthDialog'
import { SearchBox } from './SearchBox'

const NAV = [
  { to: '/explore', label: 'Khám phá', icon: Compass },
  { to: '/wishlist', label: 'Yêu thích', icon: Heart },
  { to: '/community', label: 'Cộng đồng', icon: UsersRound },
]

/** Desktop / tablet header (≥ md). */
export function Header() {
  const wishCount = useWishlistStore((s) => s.ids.length)
  const openAuth = useAuthDialog((s) => s.show)

  return (
    <header className="sticky top-0 z-40 hidden border-b border-line/70 bg-surface/85 backdrop-blur-xl md:block">
      <div className="container-page flex h-[68px] items-center gap-6">
        <Logo />
        <SearchBox className="max-w-[440px] flex-1" />
        <nav aria-label="Điều hướng chính" className="ml-auto flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'relative hidden items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold transition-colors lg:inline-flex',
                  isActive ? 'text-brand-700' : 'text-ink-soft hover:bg-line-soft hover:text-ink',
                )
              }
            >
              <Icon className="size-[18px]" aria-hidden="true" />
              {label}
              {to === '/wishlist' && wishCount > 0 && (
                <span className="absolute top-1 left-6 size-2 rounded-full bg-danger ring-2 ring-surface" aria-hidden="true" />
              )}
            </NavLink>
          ))}
          <CartButton />
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" className="px-5" onClick={() => openAuth('login')}>
            Đăng nhập
          </Button>
          <Button variant="solid" size="md" className="px-5" onClick={() => openAuth('register')}>
            Đăng ký
          </Button>
        </div>
      </div>
    </header>
  )
}

export function CartButton({ className }: { className?: string }) {
  const count = useCartStore(selectCartCount)
  const setCartOpen = useUiStore((s) => s.setCartOpen)
  return (
    <button
      type="button"
      onClick={() => setCartOpen(true)}
      aria-label={`Giỏ hàng, ${count} sản phẩm`}
      className={cn(
        'relative inline-flex size-11 cursor-pointer items-center justify-center rounded-btn text-ink-soft transition-colors hover:bg-line-soft hover:text-ink',
        className,
      )}
    >
      <ShoppingCart className="size-[22px]" aria-hidden="true" />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 22 }}
            className="absolute top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white ring-2 ring-surface"
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
