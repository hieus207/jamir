import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { ArrowLeft, ChevronLeft, Heart, Search, UserRound } from 'lucide-react'
import { Link, useMatch, useNavigate } from 'react-router'
import { Logo } from '../brand/Logo'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { CartButton } from './Header'
import { SearchBox } from './SearchBox'

/** Mobile header (< md): logo, search, cart. Product pages: ‹ back · product name · cart. */
export function MobileHeader() {
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)
  const productMatch = useMatch('/san-pham/:slug')
  if (productMatch) return <ProductBar />
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/90 backdrop-blur-xl md:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <Logo className="[&_span]:text-xl [&_svg]:size-7" />
        <HeaderIcons onSearch={() => setSearchOpen(true)} />
      </div>
      <MobileSearch />
    </header>
  )
}

/** Right-hand icons of the mobile header (also used over the dark home feed). */
export function HeaderIcons({ onSearch, dark }: { onSearch?: () => void; dark?: boolean }) {
  const wishCount = useWishlistStore((s) => s.ids.length)
  const btn = cn(
    'relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-btn transition-colors',
    dark ? 'text-white hover:bg-white/10' : 'text-ink-soft hover:bg-line-soft hover:text-ink',
  )
  return (
    <div className="ml-auto flex items-center">
      {onSearch && (
        <button type="button" aria-label="Tìm kiếm" onClick={onSearch} className={btn}>
          <Search className="size-[22px]" />
        </button>
      )}
      <Link to="/wishlist" aria-label={`Yêu thích, ${wishCount} sản phẩm`} className={btn}>
        <Heart className="size-[22px]" />
        {wishCount > 0 && (
          <span className="absolute top-0.5 right-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-strong px-1 text-[11px] font-bold text-white">
            {wishCount > 99 ? '99+' : wishCount}
          </span>
        )}
      </Link>
      <Link to="/account" aria-label="Tài khoản" className={btn}>
        <UserRound className="size-[22px]" />
      </Link>
      <CartButton className={cn('size-10', dark && 'text-white hover:bg-white/10 hover:text-white [&>span]:ring-black')} />
    </div>
  )
}

function ProductBar() {
  const navigate = useNavigate()
  const title = useUiStore((s) => s.productTitle)
  const back = () => ((window.history.state as { idx?: number } | null)?.idx ? navigate(-1) : navigate('/'))
  return (
    <header className="sticky top-0 z-40 bg-surface md:hidden">
      <div className="flex h-14 items-center gap-1 px-2">
        <button type="button" aria-label="Quay lại" onClick={back} className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-btn text-ink hover:bg-line-soft">
          <ChevronLeft className="size-6" />
        </button>
        <p className="min-w-0 flex-1 truncate pl-1 text-[16px] font-bold text-ink">{title}</p>
        <HeaderIcons />
      </div>
    </header>
  )
}

export function MobileSearch() {
  const open = useUiStore((s) => s.searchOpen)
  const setOpen = useUiStore((s) => s.setSearchOpen)
  return (
    <BaseDialog.Root open={open} onOpenChange={setOpen}>
      <BaseDialog.Portal>
        <BaseDialog.Popup className="fixed inset-0 z-50 flex flex-col bg-surface transition-[opacity,translate] duration-200 ease-out-expo data-[ending-style]:translate-y-3 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-3 data-[starting-style]:opacity-0">
          <BaseDialog.Title className="sr-only">Tìm kiếm</BaseDialog.Title>
          <div className="flex items-start gap-1 overflow-y-auto px-3 pt-2.5 pb-6">
            <BaseDialog.Close
              aria-label="Quay lại"
              className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-btn text-ink-soft hover:bg-line-soft"
            >
              <ArrowLeft className="size-5" />
            </BaseDialog.Close>
            <SearchBox variant="inline" autoFocus className="flex-1" onNavigate={() => setOpen(false)} />
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}
