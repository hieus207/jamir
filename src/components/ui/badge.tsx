import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap font-semibold [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        brand: 'bg-brand-600 text-white',
        gradient: 'bg-brand-gradient text-white',
        soft: 'bg-brand-50 text-brand-700',
        outline: 'border border-line bg-surface text-ink-soft',
        neutral: 'bg-line-soft text-ink-soft',
        danger: 'bg-danger-strong text-white',
        'danger-soft': 'bg-danger-50 text-danger',
        success: 'bg-success-50 text-success-strong',
        warning: 'bg-warning-50 text-orange-700',
        glass: 'bg-black/45 text-white backdrop-blur-md',
        white: 'bg-white/95 text-ink shadow-sm',
      },
      size: {
        sm: 'h-5 rounded-md px-1.5 text-[11px]',
        md: 'h-6 rounded-lg px-2 text-xs',
        lg: 'h-8 rounded-[10px] px-3 text-sm',
      },
    },
    defaultVariants: { variant: 'soft', size: 'md' },
  },
)

export type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}
