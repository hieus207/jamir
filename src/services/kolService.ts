import type { KolReview, User } from '@/types/domain'
import { get } from './client'
import { db, type KolReviewRecord } from './db'

const withKol = ({ userId, ...r }: KolReviewRecord): KolReview => ({
  ...r,
  kol: db.users.find((u) => u.id === userId) as User,
})

export function getKolReviews(productId: string): Promise<KolReview[]> {
  return get(`/products/${productId}/kol-reviews`, () =>
    db.kolReviews.filter((r) => r.productId === productId).map(withKol),
  )
}

/** Feed for the Explore page — every KOL video across products. */
export function getKolFeed(): Promise<KolReview[]> {
  return get('/kol-reviews', () => [...db.kolReviews].sort((a, b) => b.views - a.views).map(withKol))
}
