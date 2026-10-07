import type { Product, ProductNeighbors, ProductSummary } from '@/types/domain'
import { get } from './client'

export const getProducts = (params: { categoryId?: string } = {}) => get<ProductSummary[]>('/products', params)

export const getProductBySlug = (slug: string) => get<Product>(`/products/${encodeURIComponent(slug)}`)

export const getProductsByIds = (ids: string[]) =>
  ids.length ? get<ProductSummary[]>('/products', { ids: ids.join(',') }) : Promise.resolve([])

/** Previous / next product in the swipe feed (wraps around). */
export const getProductNeighbors = (slug: string) => get<ProductNeighbors>(`/products/${encodeURIComponent(slug)}/neighbors`)
