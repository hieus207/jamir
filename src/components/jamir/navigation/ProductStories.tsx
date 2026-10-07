import { ChevronRight, Play } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrefetchProduct, useStories } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import type { Story } from '@/types/domain'

const storyHref = (s: Story) =>
  s.type === 'product' ? `/product/${s.target}` : s.type === 'category' ? `/shop?category=${s.target}` : '/explore'

/** "Jamir Stories" — horizontal strip of short-video entry points. */
export function ProductStories({ activeSlug, className }: { activeSlug?: string; className?: string }) {
  const { data: stories, isLoading } = useStories()
  const prefetch = usePrefetchProduct()
  const scroller = useRef<HTMLDivElement>(null)

  return (
    <section aria-labelledby="stories-title" className={cn('relative', className)}>
      <div className="mb-2.5 flex items-baseline gap-3">
        <h2 id="stories-title" className="text-lg font-bold tracking-tight">
          Jamir Stories
        </h2>
        <p className="hidden truncate text-xs text-muted sm:block">
          Khám phá sản phẩm qua video ngắn từ KOL, khách hàng và thương hiệu
        </p>
      </div>
      <div className="relative">
        <div
          ref={scroller}
          className="scrollbar-none -mx-4 flex snap-x gap-2.5 overflow-x-auto scroll-px-4 px-4 pb-1 md:mx-0 md:px-0"
        >
          <Link
            to="/explore"
            className="group flex w-[84px] shrink-0 snap-start flex-col gap-1.5 md:w-[92px]"
          >
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[12px] bg-ink">
              <img src="/media/kol/1.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-45 transition-transform duration-300 group-hover:scale-105" />
              <span className="relative flex size-9 items-center justify-center rounded-full border-2 border-white/90 text-white">
                <Play className="size-4 translate-x-px fill-white" aria-hidden="true" />
              </span>
            </div>
            <span className="truncate text-center text-xs font-medium text-ink-soft">Xem tất cả</span>
          </Link>
          {isLoading
            ? Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="flex w-[84px] shrink-0 flex-col gap-1.5 md:w-[92px]">
                  <Skeleton className="aspect-[4/3] rounded-[12px]" />
                  <Skeleton className="mx-auto h-3 w-14" />
                </div>
              ))
            : stories?.map((s) => {
                const active = s.type === 'product' && s.target === activeSlug
                return (
                  <Link
                    key={s.id}
                    to={storyHref(s)}
                    onPointerEnter={() => s.type === 'product' && prefetch(s.target)}
                    aria-current={active ? 'page' : undefined}
                    className="group flex w-[84px] shrink-0 snap-start flex-col gap-1.5 md:w-[92px]"
                  >
                    <div
                      className={cn(
                        'relative aspect-[4/3] overflow-hidden rounded-[12px] bg-line-soft ring-offset-2 ring-offset-canvas transition-shadow',
                        active ? 'ring-[2.5px] ring-accent-600' : 'ring-1 ring-line group-hover:ring-brand-300',
                      )}
                    >
                      <img
                        src={s.thumbnail}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {s.hot && (
                        <span className="absolute top-1 left-1 rounded-md bg-gradient-to-r from-pink-500 to-accent-600 px-1.5 py-px text-[10px] font-bold text-white">
                          Hot
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'truncate text-center text-xs font-medium',
                        active ? 'font-semibold text-accent-600' : 'text-ink-soft',
                      )}
                    >
                      {s.label}
                    </span>
                  </Link>
                )
              })}
        </div>
        <button
          type="button"
          aria-label="Xem thêm stories"
          onClick={() => scroller.current?.scrollBy({ left: 400, behavior: 'smooth' })}
          className="absolute top-[26px] -right-3 hidden size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink shadow-card transition-colors hover:text-brand-600 md:flex"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </section>
  )
}
