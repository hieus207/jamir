import { LoaderCircle, type LucideIcon, SearchX, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Đang tải trang">
      <LoaderCircle className="size-8 animate-spin text-brand-500" />
    </div>
  )
}

/** Shared empty / error block. */
export function StateBlock({
  icon: Icon = SearchX,
  title,
  description,
  action,
  tone = 'neutral',
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  tone?: 'neutral' | 'error'
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}>
      <span
        className={cn(
          'flex size-14 items-center justify-center rounded-2xl',
          tone === 'error' ? 'bg-danger-50 text-danger' : 'bg-brand-50 text-brand-600',
        )}
      >
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-base font-bold text-ink">{title}</p>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export const ErrorIcon = TriangleAlert
