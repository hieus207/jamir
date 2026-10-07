import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Checkbox({ className, ...props }: ComponentProps<typeof BaseCheckbox.Root>) {
  return (
    <BaseCheckbox.Root
      className={cn(
        'flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 border-line bg-surface transition-colors data-[checked]:border-brand-600 data-[checked]:bg-brand-600',
        className,
      )}
      {...props}
    >
      <BaseCheckbox.Indicator className="text-white data-[unchecked]:hidden">
        <Check className="size-3.5" strokeWidth={3} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  )
}
