import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { useNews } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import { PageHeader } from '../layout/PageHeader'
import { NewsCard } from './NewsCard'

/** "Tin tức mới về sản phẩm" — featured (priority 1, else newest) + 4 more. */
export function NewsSection({ className }: { className?: string }) {
  const { data, isPending } = useNews(5)
  if (!isPending && !data?.length) return null
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <PageHeader
        as="h2"
        title={<span className="text-xl md:text-2xl">Tin tức mới về sản phẩm</span>}
        description="Ra mắt, ưu đãi và hướng dẫn từ JAMIR"
        aside={
          <Link to="/news" className="flex items-center gap-1 text-sm font-semibold text-brand-700">
            Xem tất cả <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      {isPending ? (
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-80 rounded-card md:row-span-2" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-card" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr] md:gap-4 lg:gap-5">
          {data!.map((a, i) => (
            <NewsCard key={a.id} article={a} featured={i === 0} />
          ))}
        </div>
      )}
    </section>
  )
}
