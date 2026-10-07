import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,box-shadow,color,transform,border-color] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand-gradient text-white shadow-brand hover:brightness-110',
        solid: 'bg-brand-600 text-white hover:bg-brand-700',
        secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
        outline: 'border border-line bg-surface text-ink hover:border-brand-300 hover:text-brand-700',
        ghost: 'text-ink-soft hover:bg-line-soft hover:text-ink',
        dark: 'bg-ink text-white hover:bg-ink-soft',
        glass: 'bg-black/35 text-white backdrop-blur-md hover:bg-black/50',
      },
      size: {
        sm: 'h-9 rounded-[10px] px-3 text-sm [&_svg]:size-4',
        md: 'h-11 rounded-btn px-4 text-sm [&_svg]:size-[18px]',
        lg: 'h-13 rounded-btn px-6 text-base [&_svg]:size-5',
        icon: 'size-11 rounded-btn [&_svg]:size-5',
        'icon-sm': 'size-9 rounded-[10px] [&_svg]:size-[18px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export function Button({ className, variant, size, loading, disabled, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
