import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuantitySelector({
  value,
  onChange,
  max = 99,
  size = 'md',
  className,
  label = 'Số lượng',
}: {
  value: number
  onChange: (n: number) => void
  max?: number
  size?: 'sm' | 'md'
  className?: string
  label?: string
}) {
  const btn = cn(
    'inline-flex cursor-pointer items-center justify-center text-ink-soft transition-colors hover:bg-line-soft hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent',
    size === 'md' ? 'size-10' : 'size-8',
  )
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex items-center overflow-hidden rounded-btn border border-line bg-surface', className)}
    >
      <button type="button" aria-label="Giảm" className={btn} disabled={value <= 1} onClick={() => onChange(Math.max(1, value - 1))}>
        <Minus className="size-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ''), 10)
          onChange(Number.isNaN(n) ? 1 : Math.min(Math.max(1, n), max))
        }}
        className={cn(
          'h-full border-x border-line bg-transparent text-center font-semibold text-ink tabular-nums outline-none focus:bg-brand-50',
          size === 'md' ? 'w-12 text-[15px]' : 'w-9 text-sm',
        )}
      />
      <button type="button" aria-label="Tăng" className={btn} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus className="size-4" />
      </button>
    </div>
  )
}
