import { ArrowUpRight, Flame, LoaderCircle, Search, SearchX, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useCategories, usePrefetchProduct, useSearch, useTrendingSearches, useSettings } from '@/hooks/queries'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn, formatPrice } from '@/lib/utils'
import type { ProductSummary } from '@/types/domain'

type Option =
  | { kind: 'product'; product: ProductSummary }
  | { kind: 'query'; text: string }

/**
 * Header search with live suggestions (ARIA combobox pattern).
 * Enter → /search?q=…, arrow keys move through suggestions.
 */
export function SearchBox({
  className,
  autoFocus,
  onNavigate,
  variant = 'popover',
}: {
  className?: string
  autoFocus?: boolean
  onNavigate?: () => void
  /** popover: floating panel (desktop). inline: panel rendered below in flow (mobile sheet). */
  variant?: 'popover' | 'inline'
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const initialQ = location.pathname === '/search' ? (new URLSearchParams(location.search).get('q') ?? '') : ''
  const [value, setValue] = useState(initialQ)
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(-1)
  const q = useDebouncedValue(value, 180)
  const search = useSearch(q)
  const trending = useTrendingSearches()
  const { data: categories } = useCategories()
  const prefetch = usePrefetchProduct()

  useEffect(() => {
    setValue(initialQ)
  }, [initialQ])

  const hasQuery = value.trim().length > 0
  const options: Option[] = hasQuery
    ? (search.data?.products ?? []).slice(0, 5).map((product) => ({ kind: 'product', product }))
    : (trending.data ?? []).map((text) => ({ kind: 'query', text }))

  const open = variant === 'inline' || focused

  useEffect(() => setActive(-1), [value])

  useEffect(() => {
    if (!focused || variant === 'inline') return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [focused, variant])

  const go = (path: string) => {
    setFocused(false)
    inputRef.current?.blur()
    onNavigate?.()
    navigate(path)
  }
  const submit = (text: string) => {
    const t = text.trim()
    if (t) go(`/search?q=${encodeURIComponent(t)}`)
  }
  const choose = (o: Option) => (o.kind === 'product' ? go(`/san-pham/${o.product.slug}`) : submit(o.text))

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (options.length ? (i + 1) % options.length : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (options.length ? (i - 1 + options.length) % options.length : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const o = options[active]
      if (o) choose(o)
      else submit(value)
    } else if (e.key === 'Escape') {
      setFocused(false)
      inputRef.current?.blur()
    }
  }

  const optionId = (i: number) => `${listId}-opt-${i}`
  const categoryName = (id: string) => categories?.find((c) => c.id === id)?.name

  const panel = (
    <div className="py-2">
      {hasQuery ? (
        <>
          <div className="flex items-center justify-between px-4 pt-1 pb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            Sản phẩm
            {search.isFetching && <LoaderCircle className="size-3.5 animate-spin" aria-label="Đang tìm" />}
          </div>
          {search.data && search.data.products.length === 0 && !search.isFetching ? (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted">
              <SearchX className="size-6 text-subtle" aria-hidden="true" />
              Không tìm thấy “{value.trim()}”
            </div>
          ) : (
            <ul role="listbox" id={listId} aria-label="Gợi ý sản phẩm">
              {options.map((o, i) =>
                o.kind === 'product' ? (
                  <li
                    key={o.product.id}
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === active}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => choose(o)}
                    onPointerEnter={() => {
                      setActive(i)
                      prefetch(o.product.slug)
                    }}
                    className={cn('flex cursor-pointer items-center gap-3 px-4 py-2', i === active && 'bg-brand-50')}
                  >
                    <img src={o.product.thumbnail} alt="" className="size-11 rounded-[10px] bg-line-soft object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{o.product.name}</p>
                      <p className="text-xs text-muted">{categoryName(o.product.categoryId)}</p>
                    </div>
                    <span className="text-sm font-bold text-brand-700">{formatPrice(o.product.price)}</span>
                  </li>
                ) : null,
              )}
            </ul>
          )}
          <button
            type="button"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => submit(value)}
            className="mt-1 flex w-full cursor-pointer items-center gap-2 border-t border-line px-4 pt-3 pb-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            <Search className="size-4" aria-hidden="true" />
            Xem tất cả kết quả cho “{value.trim()}”
          </button>
        </>
      ) : (
        <>
          <p className="px-4 pt-1 pb-2 text-xs font-semibold tracking-wide text-muted uppercase">Tìm kiếm phổ biến</p>
          <ul role="listbox" id={listId} aria-label="Tìm kiếm phổ biến">
            {options.map((o, i) =>
              o.kind === 'query' ? (
                <li
                  key={o.text}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                  onPointerEnter={() => setActive(i)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-ink-soft',
                    i === active && 'bg-brand-50 text-brand-700',
                  )}
                >
                  <Flame className={cn('size-4', i < 3 ? 'text-orange-500' : 'text-subtle')} aria-hidden="true" />
                  <span className="flex-1">{o.text}</span>
                  <ArrowUpRight className="size-4 text-subtle" aria-hidden="true" />
                </li>
              ) : null,
            )}
          </ul>
        </>
      )}
    </div>
  )

  const placeholder = useSettings().data?.searchPlaceholder || 'AI tìm kiếm sản phẩm cho bạn…'
  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div className="relative">
        <Sparkles className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-accent-600" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          aria-label="Tìm kiếm sản phẩm"
          autoFocus={autoFocus}
          enterKeyHint="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="h-11 w-full rounded-btn border border-brand-100 bg-gradient-to-r from-brand-50 to-pink-50/60 pr-10 pl-10 text-sm text-ink transition-[background-color,border-color,box-shadow] placeholder:font-medium placeholder:text-brand-600/80 hover:border-brand-200 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-100 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label="Xóa tìm kiếm"
            onClick={() => {
              setValue('')
              inputRef.current?.focus()
            }}
            className="absolute top-1/2 right-2.5 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-subtle/30 text-ink-soft hover:bg-subtle/50"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {variant === 'inline' ? (
        <div className="mt-2">{panel}</div>
      ) : (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full right-0 left-0 z-50 mt-2 origin-top overflow-hidden rounded-card border border-line bg-surface shadow-lift"
            >
              {panel}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
