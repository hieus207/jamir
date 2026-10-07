import { Drawer as BaseDrawer } from '@base-ui/react/drawer'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Side sheet (desktop cart, mobile menu). Swipe right to dismiss. */
export function Sheet(props: ComponentProps<typeof BaseDrawer.Root>) {
  return <BaseDrawer.Root swipeDirection="right" {...props} />
}
export const SheetTrigger = BaseDrawer.Trigger
export const SheetClose = BaseDrawer.Close

export function SheetContent({
  className,
  children,
  title,
  ...props
}: ComponentProps<typeof BaseDrawer.Popup> & { title: string }) {
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-ink opacity-[calc(0.5*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[400ms] ease-sheet data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[swiping]:duration-0" />
      <BaseDrawer.Viewport className="fixed inset-0 z-50 flex items-stretch justify-end">
        <BaseDrawer.Popup
          className={cn(
            'flex h-full w-[min(26rem,100vw)] flex-col rounded-l-sheet bg-surface shadow-lift outline-none [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[400ms] ease-sheet data-[ending-style]:[transform:translateX(100%)] data-[starting-style]:[transform:translateX(100%)] data-[swiping]:select-none',
            className,
          )}
          {...props}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
            <BaseDrawer.Title className="text-lg font-bold">{title}</BaseDrawer.Title>
            <BaseDrawer.Close
              aria-label="Đóng"
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-line-soft hover:text-ink"
            >
              <X className="size-5" />
            </BaseDrawer.Close>
          </div>
          <BaseDrawer.Content className="flex min-h-0 flex-1 flex-col">{children}</BaseDrawer.Content>
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  )
}
