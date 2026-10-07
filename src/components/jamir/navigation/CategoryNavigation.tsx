import { LayoutGrid } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '@/hooks/queries'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

/** Horizontal category chips. `value` = category id or null for "Tất cả". */
export function CategoryNavigation({
  value,
  onChange,
  className,
}: {
  value: string | null
  onChange: (id: string | null) => void
  className?: string
}) {
  const { data: categories, isPending } = useCategories()
  const chip = (active: boolean) =>
    cn(
      'inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors',
      active ? 'border-brand-600 bg-brand-600 text-white shadow-brand' : 'border-line bg-surface text-ink-soft hover:border-brand-300 hover:text-brand-700',
    )
  return (
    <nav aria-label="Danh mục" className={cn('scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0', className)}>
      <button type="button" aria-pressed={value === null} onClick={() => onChange(null)} className={chip(value === null)}>
        <LayoutGrid className="size-4" aria-hidden="true" />
        Tất cả
      </button>
      {isPending
        ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-full" />)
        : categories?.map((c) => (
            <button key={c.id} type="button" aria-pressed={value === c.id} onClick={() => onChange(c.id)} className={chip(value === c.id)}>
              <Icon name={c.icon} className="size-4" />
              {c.name}
            </button>
          ))}
    </nav>
  )
}
