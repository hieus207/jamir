import { Accordion as BaseAccordion } from '@base-ui/react/accordion'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Accordion = BaseAccordion.Root

export function AccordionItem({ className, ...props }: ComponentProps<typeof BaseAccordion.Item>) {
  return <BaseAccordion.Item className={cn('border-b border-line last:border-b-0', className)} {...props} />
}

export function AccordionTrigger({
  className,
  children,
  aside,
  ...props
}: ComponentProps<typeof BaseAccordion.Trigger> & { aside?: ReactNode }) {
  return (
    <BaseAccordion.Header>
      <BaseAccordion.Trigger
        className={cn(
          'group flex w-full cursor-pointer items-center gap-3 py-3.5 text-left text-sm font-semibold text-ink transition-colors hover:text-brand-700',
          className,
        )}
        {...props}
      >
        <span className="min-w-0 flex-1">{children}</span>
        {aside}
        <ChevronDown
          className="size-4 shrink-0 text-muted transition-transform duration-200 group-data-[panel-open]:rotate-180"
          aria-hidden="true"
        />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  )
}

export function AccordionPanel({ className, children, ...props }: ComponentProps<typeof BaseAccordion.Panel>) {
  return (
    <BaseAccordion.Panel
      className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-out-expo data-[ending-style]:h-0 data-[starting-style]:h-0"
      {...props}
    >
      <div className={cn('pb-4 text-sm leading-relaxed text-muted', className)}>{children}</div>
    </BaseAccordion.Panel>
  )
}
