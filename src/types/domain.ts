/**
 * Domain models shared by the UI and the data layer.
 * These mirror the future REST/Spring Boot DTOs — keep them backend-agnostic.
 */

export type ID = string

/** Key into the Lucide icon mapper (see lib/icons.tsx). */
export type IconName = string

export interface ProductColor {
  id: ID
  name: string
  hex: string
  image: string
}

export interface ProductSpec {
  icon: IconName
  label: string
  value: string
  note?: string
}

export interface UseCase {
  id: ID
  icon: IconName
  title: string
  description: string
  image: string
}

export interface VideoChapter {
  id: ID
  title: string
  /** seconds */
  start: number
  end: number
  thumbnail: string
}

export interface ProductVideo {
  src: string
  poster: string
  duration: number
  episode: string
  views: number
  likes: number
  comments: number
  shares: number
  tagline?: string
}

export interface ShippingInfo {
  icon: IconName
  title: string
  description: string
}

export interface Guarantee {
  icon: IconName
  title: string
  description: string
}

export interface Product {
  id: ID
  slug: string
  name: string
  brand: string
  categoryId: ID
  position: number
  shortDescription: string
  price: number
  originalPrice: number
  discount: number
  rating: number
  reviewCount: number
  soldCount: number
  stock: number
  highlight?: string
  featureTags: string[]
  colors: ProductColor[]
  specs: ProductSpec[]
  useCases: UseCase[]
  video: ProductVideo
  chapters: VideoChapter[]
  faqCount: number
  thumbnail: string
  gallery: string[]
  shipping: ShippingInfo
  guarantees: Guarantee[]
}

/** Lightweight shape used by cards, stories and search results. */
export type ProductSummary = Pick<
  Product,
  | 'id'
  | 'slug'
  | 'name'
  | 'categoryId'
  | 'price'
  | 'originalPrice'
  | 'discount'
  | 'rating'
  | 'reviewCount'
  | 'soldCount'
  | 'stock'
  | 'thumbnail'
  | 'highlight'
  | 'position'
> & { defaultColor: Pick<ProductColor, 'id' | 'name' | 'hex'> }

export interface Category {
  id: ID
  slug: string
  name: string
  icon: IconName
}

export interface Story {
  id: ID
  label: string
  type: 'product' | 'category' | 'explore'
  target: string
  thumbnail: string
  hot?: boolean
}

export interface Address {
  id: ID
  label: string
  recipient: string
  phone: string
  line: string
  district: string
  city: string
  isDefault: boolean
}

export interface User {
  id: ID
  name: string
  avatar: string
  role: 'kol' | 'customer'
  verified: boolean
  followers?: number
  title?: string
  phone?: string
  addresses?: Address[]
}

export type VideoAspect = '16:9' | '9:16' | '1:1' | '4:5'
export type VideoSource = 'tiktok' | 'youtube' | 'jamir'

export interface KolReview {
  id: ID
  productId: ID
  title: string
  thumbnail: string
  /** direct video file (mp4/HLS); used when no embedUrl */
  videoSrc: string
  /** native frame — TikTok/Reels clips are 9:16 */
  aspectRatio: VideoAspect
  source: VideoSource
  /** optional platform embed (e.g. https://www.tiktok.com/embed/v2/<id>) — takes precedence over videoSrc */
  embedUrl?: string
  duration: number
  views: number
  likes: number
  publishedAt: string
  kol: User
}

export interface ReviewMedia {
  type: 'image' | 'video'
  src: string
  thumbnail: string
}

export interface CustomerReview {
  id: ID
  productId: ID
  rating: number
  content: string
  colorId?: ID
  verifiedPurchase: boolean
  featured: boolean
  helpfulCount: number
  commentCount: number
  media: ReviewMedia[]
  createdAt: string
  user: User
}

export type ReviewSort = 'featured' | 'newest' | 'media'

export interface RatingSummary {
  average: number
  total: number
  /** count per star, index 0 = 5 stars */
  distribution: { stars: number; count: number }[]
  withMedia: number
}

export interface Faq {
  id: ID
  productId: ID
  question: string
  answer: string
  answerCount: number
}

export type ShippingMethodId = 'express' | 'standard' | 'economy'
export type PaymentMethodId = 'cod' | 'ewallet' | 'card' | 'applepay'

export interface ShippingMethod {
  id: ShippingMethodId
  name: string
  description: string
  fee: number
  eta: string
}

export interface PaymentMethod {
  id: PaymentMethodId
  name: string
  description: string
  icon: IconName
}

export interface OrderItem {
  productId: ID
  colorId: ID
  quantity: number
  unitPrice: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'

export interface Order {
  id: ID
  userId: ID
  items: OrderItem[]
  addressId: ID
  shippingMethod: ShippingMethodId
  paymentMethod: PaymentMethodId
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  status: OrderStatus
  createdAt: string
  note?: string
}

export interface CreateOrderInput {
  items: OrderItem[]
  address: Omit<Address, 'id' | 'isDefault' | 'label'> & { id?: ID }
  shippingMethod: ShippingMethodId
  paymentMethod: PaymentMethodId
  note?: string
}

export interface ProductNeighbors {
  prev: ProductSummary | null
  next: ProductSummary | null
  index: number
  total: number
}

export interface SearchResult {
  products: ProductSummary[]
  categories: Category[]
}
