import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  aside,
  as: Heading = 'h1',
  className,
}: {
  as?: 'h1' | 'h2'
  title: ReactNode
  description?: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <Heading className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</Heading>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {aside}
    </div>
  )
}
