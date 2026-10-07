import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-lg bg-[linear-gradient(90deg,#eef1f6_25%,#f8fafc_50%,#eef1f6_75%)] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  )
}
