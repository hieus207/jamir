import { Field } from '@base-ui/react/field'
import { Input as BaseInput } from '@base-ui/react/input'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const inputClass =
  'h-11 w-full rounded-btn border border-line bg-surface px-3.5 text-sm text-ink transition-[border-color,box-shadow] placeholder:text-subtle hover:border-brand-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger-50 data-[invalid]:border-danger'

export function Input({ className, ...props }: ComponentProps<typeof BaseInput>) {
  return <BaseInput className={cn(inputClass, className)} {...props} />
}

/** Label + control + error, wired for a11y by Base UI Field. */
export function FormField({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <Field.Root invalid={!!error} className={cn('flex flex-col gap-1.5', className)}>
      <Field.Label className="text-xs font-semibold text-ink-soft">{label}</Field.Label>
      {children}
      {error && <Field.Error match className="text-xs font-medium text-danger">{error}</Field.Error>}
    </Field.Root>
  )
}
