import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { ArrowLeft, Newspaper, Search } from 'lucide-react'
import { Link } from 'react-router'
import { Logo } from '../brand/Logo'
import { useUiStore } from '@/stores/uiStore'
import { CartButton } from './Header'
import { SearchBox } from './SearchBox'

/** Mobile header (< md): logo, search, cart. */
export function MobileHeader() {
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/90 backdrop-blur-xl md:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <Logo className="[&_span]:text-xl [&_svg]:size-7" />
        <div className="ml-auto flex items-center">
          <Link to="/tin-tuc" aria-label="Tin tức" className="inline-flex size-11 items-center justify-center rounded-btn text-ink-soft hover:bg-line-soft">
            <Newspaper className="size-[22px]" />
          </Link>
          <button
            type="button"
            aria-label="Tìm kiếm"
            onClick={() => setSearchOpen(true)}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-btn text-ink-soft hover:bg-line-soft"
          >
            <Search className="size-[22px]" />
          </button>
          <CartButton />
        </div>
      </div>
      <MobileSearch />
    </header>
  )
}

function MobileSearch() {
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
