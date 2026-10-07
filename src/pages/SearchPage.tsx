import { Flame, SearchX } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '@/components/jamir/layout/PageHeader'
import { StateBlock } from '@/components/jamir/layout/PageStates'
import { ProductGrid } from '@/components/jamir/recommendation/ProductGrid'
import { RecommendationSection } from '@/components/jamir/recommendation/RecommendationSection'
import { useRecommendedForYou, useSearch, useTrendingSearches } from '@/hooks/queries'
import { Icon } from '@/lib/icons'

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const { data, isPending, isFetching } = useSearch(q)
  const trending = useTrendingSearches()
  const forYou = useRecommendedForYou()

  useEffect(() => {
    document.title = q ? `“${q}” — Tìm kiếm JAMIR` : 'Tìm kiếm — JAMIR'
  }, [q])

  const empty = !!q && !isFetching && data && data.products.length === 0

  return (
    <div className="container-page flex flex-col gap-5 pt-4 pb-10 md:pt-6">
      <PageHeader
        title={q ? <>Kết quả cho “{q}”</> : 'Tìm kiếm'}
        description={q && data ? `${data.products.length} sản phẩm` : undefined}
      />
      {data && data.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.categories.map((c) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.id}`}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm font-semibold text-ink-soft hover:border-brand-300 hover:text-brand-700"
            >
              <Icon name={c.icon} className="size-4" />
              Danh mục: {c.name}
            </Link>
          ))}
        </div>
      )}
      {!q ? null : empty ? (
        <StateBlock
          icon={SearchX}
          title={`Không tìm thấy “${q}”`}
          description="Thử từ khóa khác, kiểm tra chính tả hoặc xem các tìm kiếm phổ biến bên dưới."
        />
      ) : (
        <ProductGrid products={data?.products} loading={isPending} />
      )}
      {(!q || empty) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Tìm kiếm phổ biến</h2>
          <div className="flex flex-wrap gap-2">
            {trending.data?.map((t, i) => (
              <Link
                key={t}
                to={`/search?q=${encodeURIComponent(t)}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm font-medium text-ink-soft ring-1 ring-line hover:text-brand-700 hover:ring-brand-300"
              >
                <Flame className={i < 3 ? 'size-4 text-orange-500' : 'size-4 text-subtle'} aria-hidden="true" />
                {t}
              </Link>
            ))}
          </div>
        </section>
      )}
      {(!q || empty) && <RecommendationSection title="Có thể bạn sẽ thích" products={forYou.data} loading={forYou.isPending} className="mt-4" />}
    </div>
  )
}
