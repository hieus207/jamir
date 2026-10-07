import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/jamir/layout/PageHeader'
import { CategoryNavigation } from '@/components/jamir/navigation/CategoryNavigation'
import { ProductGrid } from '@/components/jamir/recommendation/ProductGrid'
import { Select } from '@/components/ui/select'
import { useCategories, useProducts } from '@/hooks/queries'

const SORTS = [
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'price-asc', label: 'Giá thấp → cao' },
  { value: 'price-desc', label: 'Giá cao → thấp' },
  { value: 'rating', label: 'Đánh giá cao' },
]

export default function ShopPage() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category')
  const sort = params.get('sort') ?? 'popular'
  const { data, isPending } = useProducts(category ?? undefined)
  const { data: categories } = useCategories()
  const categoryName = categories?.find((c) => c.id === category)?.name

  useEffect(() => {
    document.title = `${categoryName ?? 'Cửa hàng'} — JAMIR`
  }, [categoryName])

  const products = useMemo(() => {
    const list = [...(data ?? [])]
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating)
    else list.sort((a, b) => b.soldCount - a.soldCount)
    return list
  }, [data, sort])

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <div className="container-page flex flex-col gap-5 pt-4 pb-10 md:pt-6">
      <PageHeader
        title={categoryName ?? 'Cửa hàng'}
        description={isPending ? 'Đang tải…' : `${products.length} sản phẩm`}
        aside={
          <Select aria-label="Sắp xếp" className="w-48" value={sort} onValueChange={(v) => update('sort', v === 'popular' ? null : v)} options={SORTS} />
        }
      />
      <CategoryNavigation value={category} onChange={(id) => update('category', id)} />
      <ProductGrid products={products} loading={isPending} />
    </div>
  )
}
