import { Compass, LayoutDashboard, LogOut, ShoppingCart, UserRound, UsersRound } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { NavLink, useNavigate } from 'react-router'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { selectCartCount, useCartStore } from '@/stores/cartStore'
import { useUiStore } from '@/stores/uiStore'
import { Logo } from '../brand/Logo'
import { useAuthDialog, useSession } from '../auth/authStore'
import { SearchBox } from './SearchBox'

const NAV = [
  { to: '/explore', label: 'Khám phá', icon: Compass },
  { to: '/community', label: 'Cộng đồng', icon: UsersRound },
]

/** Desktop / tablet header (≥ md). */
export function Header() {
  const openAuth = useAuthDialog((s) => s.show)
  const user = useSession((s) => s.user)

  return (
    <header className="sticky top-0 z-40 hidden border-b border-line/70 bg-surface/85 backdrop-blur-xl md:block">
      <div className="container-page flex h-[68px] items-center gap-6">
        <Logo />
        <SearchBox className="max-w-[400px] min-w-0 flex-1" />
        <nav aria-label="Điều hướng chính" className="ml-auto flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'relative hidden items-center gap-2 rounded-[10px] px-2.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors lg:inline-flex',
                  isActive ? 'text-brand-700' : 'text-ink-soft hover:bg-line-soft hover:text-ink',
                )
              }
            >
              <Icon className="size-[18px]" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          <CartButton />
        </nav>
        {user ? (
          <UserMenu />
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" className="px-4" onClick={() => openAuth('login')}>
              Đăng nhập
            </Button>
            <Button variant="solid" size="md" className="px-4" onClick={() => openAuth('register')}>
              Đăng ký
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}

function UserMenu() {
  const { user, logout } = useSession()
  const navigate = useNavigate()
  if (!user) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-line-soft">
        <Avatar src={user.avatar} name={user.name} className="size-9" />
        <span className="hidden max-w-28 truncate text-sm font-semibold xl:inline">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email ?? user.phone}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/account')}>
          <UserRound />
          Tài khoản & đơn hàng
        </DropdownMenuItem>
        {user.role === 'admin' && (
          <DropdownMenuItem onClick={() => navigate('/admin')}>
            <LayoutDashboard />
            Trang quản trị
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout()
            toast.info('Đã đăng xuất')
          }}
        >
          <LogOut />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
            className="absolute top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-strong px-1 text-[11px] font-bold text-white ring-2 ring-surface"
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
