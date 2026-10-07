import type { KolReview } from '@/types/domain'
import { get } from './client'

export const getKolReviews = (productId: string) => get<KolReview[]>(`/products/${productId}/kol-reviews`)

/** Feed for the Explore page — every KOL video across products. */
export const getKolFeed = () => get<KolReview[]>('/kol-reviews')
