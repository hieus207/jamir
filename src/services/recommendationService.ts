import type { ProductSummary } from '@/types/domain'
import { get } from './client'
import { db } from './db'
import { toSummary } from './productService'

const byIds = (ids: string[]) =>
  ids
    .map((id) => db.products.find((p) => p.id === id))
    .filter((p) => !!p)
    .map(toSummary)

export function getRelatedProducts(productId: string): Promise<ProductSummary[]> {
  return get(`/products/${productId}/related`, () => byIds(db.recommendations.related[productId] ?? []))
}

export function getBoughtTogether(productId: string): Promise<ProductSummary[]> {
  return get(`/products/${productId}/bought-together`, () => byIds(db.recommendations.boughtTogether[productId] ?? []))
}

export function getRecommendedForYou(): Promise<ProductSummary[]> {
  return get('/recommendations/for-you', () => byIds(db.recommendations.forYou))
}
