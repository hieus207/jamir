import type { CustomerReview, Customer, ReviewerDisplay } from '../../src/types/domain'

/** users.json record — never sent to clients as-is (see toCustomer). */
export interface CustomerRecord extends Customer {
  passwordHash?: string
  googleSub?: string
}

/** reviews.json record — author stored inline (admin can create comments freely). */
export interface ReviewRecord extends Omit<CustomerReview, 'user' | 'anonymous' | 'likedByMe'> {
  author: { name: string; nickname?: string; display?: ReviewerDisplay; avatar?: string }
  userId?: string
  /** account ids that liked it (one like per buyer) */
  likedBy?: string[]
  /** hidden reviews stay in the admin only */
  hidden?: boolean
  /** posted by the demo feeder — purgeable in one go */
  seeded?: boolean
}

export interface RecommendationsRecord {
  related: Record<string, string[]>
  boughtTogether: Record<string, string[]>
  forYou: string[]
  trendingSearches: string[]
}
