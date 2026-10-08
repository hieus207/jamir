import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

/**
 * One heading style for every home section: title with a gradient accent word,
 * a short line under it, and the same "Xem tất cả" pill on the right.
 */
export function SectionHeading({
  id,
  title,
  accent,
  description,
  action,
  icon,
  tone = 'light',
  className,
}: {
  id?: string
  title: string
  /** highlighted word(s) after the title */
  accent?: string
  description?: string
  action?: { to: string; label?: string }
  icon?: ReactNode
  tone?: 'light' | 'dark'
  className?: string
}) {
  const dark = tone === 'dark'
  return (
    <div className={cn('flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 id={id} className={cn('flex items-center gap-2 text-[22px] leading-tight font-extrabold tracking-tight md:text-[28px]', dark ? 'text-white' : 'text-ink')}>
          <span>
            {title}
            {accent && (
              <>
                {' '}
                <span className={cn('bg-clip-text text-transparent', dark ? 'bg-gradient-to-r from-pink-300 via-fuchsia-300 to-indigo-200' : 'bg-gradient-to-r from-brand-600 via-accent-600 to-pink-500')}>
                  {accent}
                </span>
              </>
            )}
          </span>
          {icon}
        </h2>
        {description && <p className={cn('mt-1 text-sm', dark ? 'text-white/65' : 'text-muted')}>{description}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className={cn(
            'group flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
            dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-brand-50 text-brand-700 hover:bg-brand-100',
          )}
        >
          {action.label ?? 'Xem tất cả'}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
