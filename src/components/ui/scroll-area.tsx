import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function ScrollArea({
  className,
  viewportClassName,
  orientation = 'vertical',
  children,
  ...props
}: ComponentProps<typeof BaseScrollArea.Root> & {
  viewportClassName?: string
  orientation?: 'vertical' | 'horizontal'
}) {
  return (
    <BaseScrollArea.Root className={cn('relative min-h-0', className)} {...props}>
      <BaseScrollArea.Viewport className={cn('size-full overscroll-contain outline-none', viewportClassName)}>
        {children}
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar
        orientation={orientation}
        className={cn(
          'flex touch-none select-none rounded-full p-0.5 opacity-0 transition-opacity delay-200 data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[scrolling]:opacity-100 data-[scrolling]:delay-0',
          orientation === 'vertical' ? 'w-2' : 'h-2 flex-col',
        )}
      >
        <BaseScrollArea.Thumb className="flex-1 rounded-full bg-ink/20" />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  )
}
