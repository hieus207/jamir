import { Drawer as BaseDrawer } from '@base-ui/react/drawer'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Bottom sheet with swipe-to-dismiss (Base UI Drawer).
 * Uses the iOS-like spring curve; the popup bleeds below the viewport so the
 * overshoot never reveals a gap.
 */
export const Drawer = BaseDrawer.Root
export const DrawerTrigger = BaseDrawer.Trigger
export const DrawerClose = BaseDrawer.Close
export const DrawerTitle = BaseDrawer.Title
export const DrawerDescription = BaseDrawer.Description

export function DrawerContent({
  className,
  children,
  contentClassName,
  ...props
}: ComponentProps<typeof BaseDrawer.Popup> & { contentClassName?: string }) {
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-ink opacity-[calc(0.55*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-sheet data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[swiping]:duration-0 data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]" />
      <BaseDrawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
        <BaseDrawer.Popup
          className={cn(
            '-mb-12 flex max-h-[calc(94dvh+3rem)] w-full flex-col rounded-t-sheet bg-surface pb-12 shadow-lift outline-none [transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-[450ms] ease-sheet will-change-transform data-[swiping]:select-none data-[ending-style]:[transform:translateY(calc(100%-3rem+2px))] data-[starting-style]:[transform:translateY(calc(100%-3rem+2px))] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]',
            className,
          )}
          {...props}
        >
          <div className="flex shrink-0 justify-center pt-2.5 pb-1" aria-hidden="true">
            <div className="h-1.5 w-11 rounded-full bg-line" />
          </div>
          <BaseDrawer.Content className={cn('flex min-h-0 flex-1 flex-col', contentClassName)}>{children}</BaseDrawer.Content>
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  )
}
