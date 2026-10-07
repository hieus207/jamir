import { Radio } from '@base-ui/react/radio'
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function RadioGroup({ className, ...props }: ComponentProps<typeof BaseRadioGroup>) {
  return <BaseRadioGroup className={cn('flex flex-col gap-2', className)} {...props} />
}

/** A full-width selectable card containing a radio. */
export function RadioCard({
  value,
  children,
  className,
  disabled,
}: {
  value: string
  children: ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-btn border border-line bg-surface p-3 transition-[border-color,background-color,box-shadow] hover:border-brand-200 has-[[data-checked]]:border-brand-500 has-[[data-checked]]:bg-brand-50/60 has-[[data-checked]]:ring-1 has-[[data-checked]]:ring-brand-500',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {children}
      <Radio.Root
        value={value}
        disabled={disabled}
        className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-line transition-colors data-[checked]:border-brand-600"
      >
        <Radio.Indicator className="size-2.5 rounded-full bg-brand-600 transition-transform data-[unchecked]:hidden" />
      </Radio.Root>
    </label>
  )
}
