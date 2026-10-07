import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = BaseDialog.Root
export const DialogTrigger = BaseDialog.Trigger
export const DialogClose = BaseDialog.Close

export function DialogBackdrop({ className, ...props }: ComponentProps<typeof BaseDialog.Backdrop>) {
  return (
    <BaseDialog.Backdrop
      className={cn(
        'fixed inset-0 z-50 bg-ink/55 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

/** Centered dialog with fade + scale. */
export function DialogContent({
  className,
  children,
  showClose = true,
  closeClassName,
  ...props
}: ComponentProps<typeof BaseDialog.Popup> & { showClose?: boolean; closeClassName?: string }) {
  return (
    <BaseDialog.Portal>
      <DialogBackdrop />
      <BaseDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        <BaseDialog.Popup
          className={cn(
            'relative max-h-full w-full max-w-lg overflow-hidden rounded-sheet bg-surface shadow-lift outline-none transition-[opacity,scale] duration-200 ease-out-expo data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0',
            className,
          )}
          {...props}
        >
          {children}
          {showClose && (
            <BaseDialog.Close
              aria-label="Đóng"
              className={cn(
                'absolute top-3 right-3 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60',
                closeClassName,
              )}
            >
              <X className="size-5" />
            </BaseDialog.Close>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  )
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return <BaseDialog.Title className={cn('text-lg font-bold text-ink', className)} {...props} />
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof BaseDialog.Description>) {
  return <BaseDialog.Description className={cn('text-sm text-muted', className)} {...props} />
}
