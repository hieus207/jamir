import { Newspaper } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/jamir/layout/PageHeader'
import { StateBlock } from '@/components/jamir/layout/PageStates'
import { NewsCard } from '@/components/jamir/news/NewsCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useNews } from '@/hooks/queries'
import { cn } from '@/lib/utils'

export default function NewsPage() {
  const { data, isPending } = useNews()
  const [tag, setTag] = useState<string | null>(null)
  useEffect(() => {
    document.title = 'Tin tức — JAMIR'
  }, [])
  const tags = useMemo(() => [...new Set(data?.flatMap((n) => n.tags) ?? [])], [data])
  const list = data?.filter((n) => !tag || n.tags.includes(tag))

  return (
    <div className="container-page flex flex-col gap-5 pt-4 pb-10 md:pt-6">
      <PageHeader title="Tin tức" description="Tin sản phẩm, ưu đãi và hướng dẫn sử dụng" />
      {tags.length > 0 && (
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {[null, ...tags].map((t) => (
            <button
              key={t ?? 'all'}
              type="button"
              aria-pressed={tag === t}
              onClick={() => setTag(t)}
              className={cn(
                'h-9 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-semibold transition-colors',
                tag === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface text-ink-soft hover:border-brand-300',
              )}
            >
              {t ?? 'Tất cả'}
            </button>
          ))}
        </div>
      )}
      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-card" />
          ))}
        </div>
      ) : !list?.length ? (
        <StateBlock icon={Newspaper} title="Chưa có bài viết" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <NewsCard key={a.id} article={a} className="sm:flex-col" />
          ))}
        </div>
      )}
    </div>
  )
}
