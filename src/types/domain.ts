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
  /** platform player (YouTube / TikTok / Facebook) — replaces `src` when set */
  embedUrl?: string
  source?: VideoSource
  /** link pasted in the admin */
  sourceUrl?: string
  aspectRatio?: VideoAspect
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

/** Free gift shipped with the product (optional). */
export interface ProductGift {
  id: ID
  name: string
  image: string
  /** retail value shown as "Trị giá …" */
  value: number
  /** hidden gifts stay in the admin but are not shown or shipped */
  hidden?: boolean
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
  /** hidden when empty */
  gifts?: ProductGift[]
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

export type StoryMediaType = 'video' | 'image'

/** A Jamir Story — short media that links to a product (or any URL). */
export interface Story {
  id: ID
  label: string
  /** product slug the story promotes (optional) */
  productSlug?: string
  /** explicit link, used when there is no product (e.g. /explore, /news/...) */
  link?: string
  thumbnail: string
  media: { type: StoryMediaType; src: string; poster?: string; aspectRatio: VideoAspect }
  caption?: string
  /** higher shows first */
  priority: number
  active: boolean
  hot?: boolean
  createdAt: string
  /** optional gift promo shown while this story plays (text and/or image) */
  gift?: StoryGift
}

export interface StoryGift {
  enabled: boolean
  text: string
  image?: string
}

/** stories.json → { config, items } */
export interface StoriesConfig {
  /** seconds each story plays before auto-advancing */
  intervalSeconds: number
  /** 'random' = shuffle each cycle, 'priority' = priority order */
  order: 'random' | 'priority'
  /** start in "Xem tất cả" autoplay mode on first visit */
  autoplay: boolean
  /** home: start "Xem tất cả" after this many idle seconds (0 = off, default 10) */
  idleSeconds?: number
}

export interface StoriesFeed {
  config: StoriesConfig
  items: Story[]
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

/** Public display identity (KOL or review author). */
export interface User {
  id: ID
  name: string
  avatar: string
  verified: boolean
  followers?: number
  title?: string
}

export type AuthProvider = 'password' | 'google' | 'guest'
export type Role = 'customer' | 'admin'

/** A customer account as returned to its owner / to admins (never includes secrets). */
export interface Customer {
  id: ID
  name: string
  email?: string
  phone?: string
  avatar?: string
  provider: AuthProvider
  role: Role
  addresses: Address[]
  createdAt: string
  lastLoginAt?: string
}

export interface AuthSession {
  token: string
  user: Customer
}

/** Admin view: customer + order stats */
export interface AdminCustomer extends Customer {
  orderCount: number
  totalSpent: number
  lastOrderAt?: string
  orders: Order[]
}

export type NewsLabel = 'popular' | 'trending' | 'hot' | 'new' | 'deal' | 'guide'

export interface NewsArticle {
  id: ID
  slug: string
  title: string
  excerpt: string
  cover: string
  /** paragraphs separated by blank lines */
  content: string
  productSlug?: string
  tags: string[]
  author: string
  publishedAt: string
  published: boolean
  /** 1 = featured first; empty = ordered by date */
  priority?: number
  labels?: NewsLabel[]
}

export type PromotionType = 'percent' | 'fixed' | 'freeship'

export interface Promotion {
  id: ID
  code: string
  description: string
  type: PromotionType
  /** percent (0-100) or VND amount; ignored for freeship */
  value: number
  minOrder: number
  maxDiscount?: number
  startsAt?: string
  endsAt?: string
  usageLimit?: number
  used: number
  active: boolean
  /** limit to these products (empty = whole order) */
  productIds?: string[]
  /** show as a voucher chip on product pages / checkout */
  public?: boolean
}

/** Public voucher info (no usage stats). */
export type Voucher = Pick<Promotion, 'id' | 'code' | 'description' | 'type' | 'value' | 'minOrder' | 'maxDiscount' | 'endsAt' | 'productIds'> & {
  /** uses left when the code has a usage limit */
  remaining?: number
}

export interface PromotionCheck {
  code: string
  valid: boolean
  message: string
  discount: number
  freeShipping: boolean
}

export interface SiteSettings {
  hotline: string
  zalo: string
  email: string
  kolContact: string
  community: { zaloGroup: string; facebook: string; tiktok?: string }
  address: string
  /** anti-spam: at most `max` orders per phone / account / IP in `windowHours` (then blocked for windowHours) */
  orderLimit?: { max: number; windowHours: number }
}

/** Ad landing page for one product (/lp/:slug). */
export interface LandingPage {
  id: ID
  slug: string
  productId: ID
  active: boolean
  headline: string
  subheadline?: string
  /** hero: product video by default, or this image / video */
  heroMedia?: { type: 'image' | 'video'; src: string }
  bullets: string[]
  ctaText: string
  badge?: string
  /** optional sale countdown */
  countdownEndsAt?: string
  showKol: boolean
  showReviews: boolean
}

export interface LandingPayload {
  page: LandingPage
  product: Product
  reviews: CustomerReview[]
  kol: KolReview[]
}

export type EventTargetType = 'product' | 'news' | 'video' | 'url'

/** Home hero slider (admin → Banner trang chủ). */
export interface HomeBanner {
  id: ID
  image: string
  /** optional portrait image for phones */
  mobileImage?: string
  eyebrow?: string
  /** line breaks are kept */
  title?: string
  subtitle?: string
  ctaText?: string
  target: { type: EventTargetType; value: string }
  /** darken the left side so white text stays readable (default on) */
  overlay?: boolean
  active: boolean
  /** higher shows first */
  priority: number
  startsAt?: string
  endsAt?: string
}

/** Promo popup shown between startsAt and endsAt. */
export interface SiteEvent {
  id: ID
  title: string
  image: string
  description?: string
  startsAt?: string
  endsAt?: string
  active: boolean
  /** higher wins when several events overlap */
  priority: number
  target: { type: EventTargetType; value: string }
  ctaText?: string
  /** how often the same visitor sees it */
  frequency: 'once' | 'daily' | 'session'
}

export interface AdminOverview {
  customers: number
  orders: number
  revenue: number
  products: number
  stories: number
  pendingOrders: number
  recentOrders: (Order & { customerName: string })[]
}

export type VideoAspect = '16:9' | '9:16' | '1:1' | '4:5'
export type VideoSource = 'tiktok' | 'youtube' | 'facebook' | 'jamir'

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
  /** link pasted in the admin */
  sourceUrl?: string
  duration: number
  views: number
  likes: number
  publishedAt: string
  kol: User
}

/** kol-reviews.json record (KOL referenced by id) */
export interface KolVideoRecord extends Omit<KolReview, 'kol'> {
  kolId: ID
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
  /** shown without avatar, name masked */
  anonymous?: boolean
  /** the signed-in viewer liked it */
  likedByMe?: boolean
  /** answer from the shop */
  reply?: { content: string; createdAt: string }
}

/** How a reviewer's name is shown. */
export type ReviewerDisplay = 'full' | 'nickname' | 'anonymous'

/** Can the signed-in user review / like this product? */
export interface ReviewEligibility {
  signedIn: boolean
  /** bought it (non-cancelled order) or is admin */
  canReview: boolean
  canLike: boolean
  alreadyReviewed: boolean
}

export interface CreateReviewInput {
  rating: number
  content: string
  colorId?: string
  display: ReviewerDisplay
  nickname?: string
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
  /** customer questions wait for an answer from the admin */
  status?: 'answered' | 'pending'
  askedBy?: string
  createdAt?: string
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
  items: (OrderItem & { name?: string; colorName?: string; thumbnail?: string; gifts?: string[] })[]
  address: Omit<Address, 'id' | 'isDefault' | 'label'>
  shippingMethod: ShippingMethodId
  paymentMethod: PaymentMethodId
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  promoCode?: string
  status: OrderStatus
  createdAt: string
  note?: string
  /** used by the order rate limit (admin only) */
  clientIp?: string
}

export interface CreateOrderInput {
  items: OrderItem[]
  address: Omit<Address, 'id' | 'isDefault' | 'label'> & { id?: ID }
  shippingMethod: ShippingMethodId
  paymentMethod: PaymentMethodId
  note?: string
  promoCode?: string
  /** guest checkout: contact used to create/find the customer record */
  email?: string
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
