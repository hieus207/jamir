import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductColor } from '@/types/domain'

const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.299 * r + 0.587 * g + 0.114 * b > 186
}

/** Color selector — product image tile with a color chip, radio semantics. */
export function ProductVariant({
  colors,
  value,
  onChange,
  className,
}: {
  colors: ProductColor[]
  value: string
  onChange: (id: string) => void
  className?: string
}) {
  const current = colors.find((c) => c.id === value)
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4', className)}>
      <span id="color-label" className="w-20 shrink-0 text-sm font-medium text-ink-soft">
        Màu sắc: <span className="font-semibold text-ink sm:hidden">{current?.name}</span>
      </span>
      <RadioGroup
        aria-labelledby="color-label"
        value={value}
        onValueChange={(v) => onChange(v as string)}
        className="flex flex-wrap gap-2"
      >
        {colors.map((c) => (
          <Radio.Root
            key={c.id}
            value={c.id}
            aria-label={c.name}
            title={c.name}
            className="group relative size-12 cursor-pointer overflow-hidden rounded-[12px] border border-line bg-canvas transition-[border-color,box-shadow,transform] outline-none hover:border-brand-300 focus-visible:ring-4 focus-visible:ring-brand-100 active:scale-95 data-[checked]:border-brand-600 data-[checked]:ring-2 data-[checked]:ring-brand-600/25"
          >
            <span
              className="absolute inset-1.5 rounded-[9px] shadow-[inset_0_-6px_12px_rgb(0_0_0/0.12),inset_0_4px_8px_rgb(255_255_255/0.35)]"
              style={{ backgroundColor: c.hex }}
            />
            <Radio.Indicator className="absolute inset-0 flex items-center justify-center data-[unchecked]:hidden">
              <Check className={cn('size-4', isLight(c.hex) ? 'text-ink' : 'text-white')} strokeWidth={3} />
            </Radio.Indicator>
          </Radio.Root>
        ))}
      </RadioGroup>
      <span className="hidden text-sm text-muted sm:inline">{current?.name}</span>
    </div>
  )
}
