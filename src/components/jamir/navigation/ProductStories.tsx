import { useMemo } from 'react'
import { usePrefetchProduct, useStories } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import { StoriesStrip } from '../stories/StoriesStrip'
import { productStories, useStoryMode } from '../stories/storyMode'
import { useStoryNav } from '../stories/StoryModeController'
import { StoryProgressFill, useStoryKey } from '../stories/StoryProgress'

/** Stories strip on product pages: highlights the playing story; tapping one jumps there. */
export function ProductStories({ activeSlug, className }: { activeSlug?: string; className?: string }) {
  const { data, isPending } = useStories()
  const items = useMemo(() => productStories(data?.items ?? []), [data])
  const mode = useStoryMode((s) => s.active)
  const running = useStoryMode((s) => s.active && s.pauseReason === null)
  const storyKey = useStoryKey()
  const { start, goTo } = useStoryNav()
  const prefetch = usePrefetchProduct()
  const active = items.find((s) => s.productSlug === activeSlug)

  return (
    <section aria-labelledby="stories-title" className={cn('relative', className)}>
      <div className="mb-2 flex items-baseline gap-3">
        <h2 id="stories-title" className="text-lg font-extrabold tracking-tight">
          <span className="text-brand-gradient">Jamir Stories</span>
        </h2>
        <p className="hidden truncate text-xs text-muted sm:block">Lướt qua từng sản phẩm như xem story</p>
      </div>
      <StoriesStrip
        items={items}
        loading={isPending}
        activeId={active?.id}
        progressFill={mode ? <StoryProgressFill key={storyKey} className="bg-white" /> : undefined}
        autoplay={running}
        onPreload={(s) => s.productSlug && void prefetch(s.productSlug)}
        onSelect={(s) => (mode ? goTo(s.productSlug!) : start(s.productSlug))}
        onPlayAll={() => {
          const st = useStoryMode.getState()
          if (!st.active) start()
          else if (st.pauseReason === null) st.setUserPaused(true)
          else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            st.setUserPaused(false)
          }
        }}
      />
    </section>
  )
}
