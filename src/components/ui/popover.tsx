import { Popover as BasePopover } from '@base-ui/react/popover'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Popover = BasePopover.Root
export const PopoverTrigger = BasePopover.Trigger
export const PopoverClose = BasePopover.Close

export function PopoverContent({
  className,
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  initialFocus,
  ...props
}: ComponentProps<typeof BasePopover.Popup> &
  Pick<ComponentProps<typeof BasePopover.Positioner>, 'side' | 'align' | 'sideOffset'>) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner side={side} align={align} sideOffset={sideOffset} className="z-[60]">
        <BasePopover.Popup
          initialFocus={initialFocus}
          className={cn(
            'origin-(--transform-origin) rounded-card border border-line bg-surface p-4 shadow-lift outline-none transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          {...props}
        />
      </BasePopover.Positioner>
    </BasePopover.Portal>
  )
}
