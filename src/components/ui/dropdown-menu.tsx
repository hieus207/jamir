import { Menu } from '@base-ui/react/menu'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger

export function DropdownMenuContent({
  className,
  side = 'bottom',
  align = 'end',
  sideOffset = 6,
  container,
  ...props
}: ComponentProps<typeof Menu.Popup> &
  Pick<ComponentProps<typeof Menu.Positioner>, 'side' | 'align' | 'sideOffset'> &
  Pick<ComponentProps<typeof Menu.Portal>, 'container'>) {
  return (
    <Menu.Portal container={container}>
      <Menu.Positioner side={side} align={align} sideOffset={sideOffset} className="z-[60] outline-none">
        <Menu.Popup
          className={cn(
            'min-w-44 origin-(--transform-origin) rounded-[14px] border border-line bg-surface p-1.5 shadow-lift outline-none transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  )
}

export function DropdownMenuItem({ className, ...props }: ComponentProps<typeof Menu.Item>) {
  return (
    <Menu.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-sm text-ink-soft outline-none data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-700 [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <Menu.Separator className={cn('mx-1.5 my-1 h-px bg-line', className)} />
}
