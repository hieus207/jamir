import type { CustomerReview, Faq, RatingSummary, ReviewSort, User } from '@/types/domain'
import { get } from './client'
import { db } from './db'

const userById = (id: string) => db.users.find((u) => u.id === id) as User

export function getProductReviews(productId: string, sort: ReviewSort = 'featured'): Promise<CustomerReview[]> {
  return get(
    `/products/${productId}/reviews`,
    () => {
      let list = db.customerReviews.filter((r) => r.productId === productId)
      if (sort === 'media') list = list.filter((r) => r.media.length > 0)
      list = [...list].sort((a, b) =>
        sort === 'featured'
          ? Number(b.featured) - Number(a.featured) || b.helpfulCount - a.helpfulCount
          : b.createdAt.localeCompare(a.createdAt),
      )
      return list.map(({ userId, ...r }) => ({ ...r, user: userById(userId) }))
    },
    { sort },
  )
}

/**
 * Rating summary. The headline total/average come from the product record
 * (the mock only stores a sample of reviews); the distribution is scaled to it.
 */
export function getRatingSummary(productId: string): Promise<RatingSummary> {
  return get(`/products/${productId}/rating-summary`, () => {
    const product = db.products.find((p) => p.id === productId)
    if (!product) return undefined
    const sample = db.customerReviews.filter((r) => r.productId === productId)
    const total = product.reviewCount
    const five = Math.min(0.9, Math.max(0.55, (product.rating - 4) * 1.05))
    const rest = 1 - five
    const shares = [five, rest * 0.7, rest * 0.18, rest * 0.07, rest * 0.05]
    const distribution = shares.map((s, i) => ({ stars: 5 - i, count: Math.round(total * s) }))
    const withMedia = Math.round((sample.filter((r) => r.media.length).length / Math.max(sample.length, 1)) * total)
    return { average: product.rating, total, distribution, withMedia }
  })
}

/** Community feed: latest customer reviews that include photos/videos, across products. */
export function getCommunityFeed(): Promise<(CustomerReview & { productSlug: string; productName: string })[]> {
  return get('/community/feed', () =>
    db.customerReviews
      .filter((r) => r.media.length > 0)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ userId, ...r }) => {
        const p = db.products.find((x) => x.id === r.productId)!
        return { ...r, user: userById(userId), productSlug: p.slug, productName: p.name }
      }),
  )
}

export function getProductFaqs(productId: string): Promise<Faq[]> {
  return get(`/products/${productId}/faqs`, () => db.faqs.filter((f) => f.productId === productId))
}
