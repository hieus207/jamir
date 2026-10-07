import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Tabs = BaseTabs.Root
export const TabsPanel = BaseTabs.Panel

/** Pill-style segmented tabs with a sliding indicator. */
export function TabsList({ className, children, ...props }: ComponentProps<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List
      className={cn('relative z-0 inline-flex items-center gap-1 rounded-btn bg-line-soft p-1', className)}
      {...props}
    >
      {children}
      <BaseTabs.Indicator className="absolute top-1/2 left-0 -z-1 h-[calc(100%-8px)] w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-1/2 rounded-[9px] bg-brand-600 shadow-sm transition-[translate,width] duration-200 ease-out-expo" />
    </BaseTabs.List>
  )
}

export function TabsTab({ className, ...props }: ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      className={cn(
        'inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[9px] px-3 text-sm font-semibold text-muted transition-colors duration-150 hover:text-ink data-[active]:text-white [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}
