/**
 * JSON "repository" — the ONLY module that imports the mock data files.
 * Services read from here; components never import JSON directly.
 */
import categories from '@/data/categories.json'
import customerReviews from '@/data/customer-reviews.json'
import faqs from '@/data/faqs.json'
import kolReviews from '@/data/kol-reviews.json'
import orders from '@/data/orders.json'
import products from '@/data/products.json'
import recommendations from '@/data/recommendations.json'
import stories from '@/data/stories.json'
import users from '@/data/users.json'
import type { Category, Faq, Order, Product, Story, User } from '@/types/domain'

export interface KolReviewRecord {
  id: string
  productId: string
  userId: string
  title: string
  thumbnail: string
  videoSrc: string
  duration: number
  views: number
  likes: number
  publishedAt: string
}

export interface CustomerReviewRecord {
  id: string
  productId: string
  userId: string
  rating: number
  content: string
  colorId?: string
  verifiedPurchase: boolean
  featured: boolean
  helpfulCount: number
  commentCount: number
  media: { type: 'image' | 'video'; src: string; thumbnail: string }[]
  createdAt: string
}

export interface RecommendationRecord {
  related: Record<string, string[]>
  boughtTogether: Record<string, string[]>
  forYou: string[]
  trendingSearches: string[]
}

export const db = {
  products: products as Product[],
  categories: categories as Category[],
  stories: stories as Story[],
  users: users as User[],
  kolReviews: kolReviews as KolReviewRecord[],
  customerReviews: customerReviews as CustomerReviewRecord[],
  faqs: faqs as Faq[],
  orders: orders as Order[],
  recommendations: recommendations as RecommendationRecord,
}
