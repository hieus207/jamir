import { SectionHeading } from '@/components/jamir/layout/SectionHeading'
import { Skeleton } from '@/components/ui/skeleton'
import { useNews } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import { NewsCard } from './NewsCard'

/** "Tin tức mới về sản phẩm" — featured (priority 1, else newest) + 4 more. */
export function NewsSection({ className }: { className?: string }) {
  const { data, isPending } = useNews(5)
  if (!isPending && !data?.length) return null
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <SectionHeading title="Tin tức" accent="mới" description="Ra mắt, ưu đãi và hướng dẫn từ JAMIR" action={{ to: '/tin-tuc' }} />
      {isPending ? (
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-80 rounded-card md:row-span-2" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-card" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr] md:grid-rows-[repeat(2,minmax(230px,auto))] md:gap-4 lg:gap-5">
          {data!.map((a, i) => (
            <NewsCard key={a.id} article={a} featured={i === 0} />
          ))}
        </div>
      )}
    </section>
  )
}
