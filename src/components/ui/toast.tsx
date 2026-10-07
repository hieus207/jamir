import { Toast } from '@base-ui/react/toast'
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Global manager so stores/handlers can toast without hooks. */
export const toastManager = Toast.createToastManager()

type ToastType = 'success' | 'error' | 'info'

export const toast = {
  success: (title: string, description?: string) => toastManager.add({ title, description, type: 'success' }),
  error: (title: string, description?: string) => toastManager.add({ title, description, type: 'error' }),
  info: (title: string, description?: string) => toastManager.add({ title, description, type: 'info' }),
}

const ICON: Record<ToastType, ReactNode> = {
  success: <CircleCheck className="size-5 text-success" />,
  error: <TriangleAlert className="size-5 text-danger" />,
  info: <Info className="size-5 text-brand-600" />,
}

export function Toaster({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager} timeout={3200} limit={3}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed top-3 left-1/2 z-[100] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 md:top-auto md:right-6 md:bottom-6 md:left-auto md:translate-x-0">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

function ToastList() {
  const { toasts } = Toast.useToastManager()
  return toasts.map((t) => (
    <Toast.Root
      key={t.id}
      toast={t}
      swipeDirection={['up', 'right']}
      className={cn(
        '[--gap:0.6rem] [--offset-y:calc(var(--toast-offset-y)+(var(--toast-index)*var(--gap))+var(--toast-swipe-movement-y))] absolute top-0 right-0 left-0 z-[calc(1000-var(--toast-index))] flex items-start gap-3 rounded-card border border-line bg-surface p-3.5 pr-10 shadow-lift select-none',
        '[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-index)*8px+var(--toast-swipe-movement-y)))_scale(calc(1-var(--toast-index)*0.05))]',
        'data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]',
        'md:top-auto md:bottom-0 md:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-index)*-8px+var(--toast-swipe-movement-y)))_scale(calc(1-var(--toast-index)*0.05))]',
        'md:data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--offset-y)*-1))]',
        'transition-[transform,opacity] duration-400 ease-out-expo data-[ending-style]:opacity-0 data-[limited]:opacity-0 data-[starting-style]:opacity-0 data-[starting-style]:[transform:translateY(-60%)] md:data-[starting-style]:[transform:translateY(60%)]',
        'after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full',
      )}
    >
      <span className="mt-px shrink-0">{ICON[(t.type as ToastType) ?? 'info'] ?? ICON.info}</span>
      <div className="min-w-0 flex-1">
        <Toast.Title className="text-sm font-semibold text-ink" />
        <Toast.Description className="mt-0.5 text-sm text-muted" />
      </div>
      <Toast.Close
        aria-label="Đóng thông báo"
        className="absolute top-3 right-3 inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-line-soft hover:text-ink"
      >
        <X className="size-4" />
      </Toast.Close>
    </Toast.Root>
  ))
}
