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
  titleAs: TitleTag = 'p',
  className,
}: {
  /** page-level states (404) use h1 */
  titleAs?: 'p' | 'h1' | 'h2'
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
        <TitleTag className="text-base font-bold text-ink">{title}</TitleTag>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** Inline error for a data section, with retry. */
export function SectionError({ onRetry, className }: { onRetry: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-2 rounded-[14px] bg-danger-50/60 px-4 py-6 text-center', className)}>
      <TriangleAlert className="size-6 text-danger" aria-hidden="true" />
      <p className="text-sm font-medium text-ink">Không tải được nội dung</p>
      <button type="button" onClick={onRetry} className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">
        Thử lại
      </button>
    </div>
  )
}
