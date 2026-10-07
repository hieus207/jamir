import type { Product, ProductNeighbors, ProductSummary } from '@/types/domain'
import { get } from './client'
import { db } from './db'

export function toSummary(p: Product): ProductSummary {
  const { id, slug, name, categoryId, price, originalPrice, discount, rating, reviewCount, soldCount, stock, thumbnail, highlight, position } = p
  const c = p.colors[0]!
  return {
    id, slug, name, categoryId, price, originalPrice, discount, rating, reviewCount, soldCount, stock, thumbnail, highlight, position,
    defaultColor: { id: c.id, name: c.name, hex: c.hex },
  }
}

const ordered = () => [...db.products].sort((a, b) => a.position - b.position)

export function getProducts(params: { categoryId?: string } = {}): Promise<ProductSummary[]> {
  return get(
    '/products',
    () =>
      ordered()
        .filter((p) => !params.categoryId || p.categoryId === params.categoryId)
        .map(toSummary),
    params,
  )
}

export function getProductBySlug(slug: string): Promise<Product> {
  return get(`/products/${encodeURIComponent(slug)}`, () => db.products.find((p) => p.slug === slug))
}

/** Previous / next product in the swipe feed (wraps around). */
export function getProductNeighbors(slug: string): Promise<ProductNeighbors> {
  return get(`/products/${encodeURIComponent(slug)}/neighbors`, () => {
    const list = ordered()
    const index = list.findIndex((p) => p.slug === slug)
    if (index === -1) return undefined
    const at = (i: number) => toSummary(list[(i + list.length) % list.length]!)
    return { prev: at(index - 1), next: at(index + 1), index, total: list.length }
  })
}
