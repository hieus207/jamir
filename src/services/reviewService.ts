import type { CreateReviewInput, CustomerReview, Faq, RatingSummary, ReviewEligibility, ReviewSort } from '@/types/domain'
import { get, post } from './client'

export const getProductReviews = (productId: string, sort: ReviewSort = 'featured') =>
  get<CustomerReview[]>(`/products/${productId}/reviews`, { sort })

export const getRatingSummary = (productId: string) => get<RatingSummary>(`/products/${productId}/rating-summary`)

/** Community feed: latest customer reviews with photos/videos, across products. */
export const getCommunityFeed = () => get<(CustomerReview & { productSlug: string; productName: string })[]>('/community/feed')

export const getProductFaqs = (productId: string) => get<Faq[]>(`/products/${productId}/faqs`)

/** Buyers (or admins) can review and like; anyone signed in can ask. */
export const getReviewEligibility = (productId: string) => get<ReviewEligibility>(`/products/${productId}/review-eligibility`)

export const createReview = (productId: string, input: CreateReviewInput) => post<CustomerReview>(`/products/${productId}/reviews`, input)

/** Toggles the like; returns the updated review. */
export const likeReview = (reviewId: string) => post<CustomerReview>(`/reviews/${reviewId}/like`, {})

export const askQuestion = (productId: string, question: string) =>
  post<{ ok: true; message: string }>(`/products/${productId}/questions`, { question })
