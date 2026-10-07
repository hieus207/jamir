import { Select as BaseSelect } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Chọn',
  className,
  'aria-label': ariaLabel,
}: {
  value: string | null
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  'aria-label'?: string
}) {
  return (
    <BaseSelect.Root
      items={options}
      value={value}
      onValueChange={(v) => v != null && onValueChange(v as string)}
    >
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        className={cn(
          'flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-btn border border-line bg-surface px-3.5 text-left text-sm text-ink transition-colors hover:border-brand-200 data-[popup-open]:border-brand-500',
          className,
        )}
      >
        <BaseSelect.Value placeholder={placeholder} className="truncate data-[placeholder]:text-subtle" />
        <BaseSelect.Icon>
          <ChevronDown className="size-4 text-muted" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-[70] outline-none">
          <BaseSelect.Popup className="max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-[14px] border border-line bg-surface p-1.5 shadow-lift transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <BaseSelect.List>
              {options.map((o) => (
                <BaseSelect.Item
                  key={o.value}
                  value={o.value}
                  className="flex cursor-pointer select-none items-center justify-between gap-2 rounded-[10px] px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-brand-50 data-[selected]:font-semibold data-[selected]:text-brand-700"
                >
                  <BaseSelect.ItemText>{o.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator>
                    <Check className="size-4" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
