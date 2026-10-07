import type { ProductSummary } from '@/types/domain'
import { get } from './client'

export const getRelatedProducts = (productId: string) => get<ProductSummary[]>(`/products/${productId}/related`)

export const getBoughtTogether = (productId: string) => get<ProductSummary[]>(`/products/${productId}/bought-together`)

export const getRecommendedForYou = () => get<ProductSummary[]>('/recommendations/for-you')
