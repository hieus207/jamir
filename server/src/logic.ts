/** Pure business logic shared by the routes. */
import type {
  CustomerReview,
  KolReview,
  KolVideoRecord,
  Product,
  ProductSummary,
  Promotion,
  PromotionCheck,
  RatingSummary,
  ShippingMethodId,
  User,
} from '../../src/types/domain'
import type { ReviewRecord } from './types'

export function toSummary(p: Product): ProductSummary {
  const { id, slug, name, categoryId, price, originalPrice, discount, rating, reviewCount, soldCount, stock, thumbnail, highlight, position } = p
  const c = p.colors[0] ?? { id: 'default', name: 'Mặc định', hex: '#E5E7EB' }
  return {
    id, slug, name, categoryId, price, originalPrice, discount, rating, reviewCount, soldCount, stock, thumbnail, highlight, position,
    defaultColor: { id: c.id, name: c.name, hex: c.hex },
  }
}

/** Gifts the shop currently offers (admin can hide one without deleting it). */
export const visibleGifts = (p: Product) => (p.gifts ?? []).filter((g) => !g.hidden)

/** Product as served to shoppers. */
export const toPublicProduct = (p: Product): Product => ({ ...p, gifts: visibleGifts(p) })

export const byPosition = (a: Product, b: Product) => a.position - b.position

/** Lowercase + strip Vietnamese diacritics so "tai nghe" matches "Tài nghe". */
export const normalizeText = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').trim()

export const slugify = (s: string) =>
  normalizeText(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || `item-${Date.now()}`

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function withKol(r: KolVideoRecord, kols: User[]): KolReview {
  const { kolId, ...rest } = r
  const kol = kols.find((k) => k.id === kolId) ?? { id: kolId, name: 'KOL', avatar: '', verified: false }
  return { ...rest, kol }
}

/** "Nguyễn Hoàng Long" → "Nguyễn Hoàng L***" (last 3 characters hidden). */
export const maskName = (name: string) => {
  const n = name.trim()
  return n.length <= 4 ? `${n.charAt(0) || '*'}***` : `${n.slice(0, -3)}***`
}

export function reviewerName(a: ReviewRecord['author']) {
  if (a.display === 'anonymous') return maskName(a.name)
  if (a.display === 'nickname' && a.nickname?.trim()) return a.nickname.trim()
  return a.name
}

export function toReview(r: ReviewRecord, viewerId?: string): CustomerReview {
  const { author, userId, likedBy, hidden: _h, seeded: _s, ...rest } = r
  const anonymous = author.display === 'anonymous'
  return {
    ...rest,
    anonymous,
    likedByMe: !!viewerId && !!likedBy?.includes(viewerId),
    // no avatar → initials; anonymous never shows a photo
    user: { id: anonymous ? `anon-${r.id}` : (userId ?? `author-${r.id}`), name: reviewerName(author), avatar: anonymous ? '' : (author.avatar ?? ''), verified: false },
  }
}

/** Headline numbers from the product, distribution shaped to match the rating. */
export function ratingSummary(product: Product, sample: ReviewRecord[]): RatingSummary {
  const total = product.reviewCount
  const five = Math.min(0.9, Math.max(0.55, (product.rating - 4) * 1.05))
  const rest = 1 - five
  const shares = [five, rest * 0.7, rest * 0.18, rest * 0.07, rest * 0.05]
  const distribution = shares.map((s, i) => ({ stars: 5 - i, count: Math.round(total * s) }))
  const withMedia = Math.round((sample.filter((r) => r.media.length).length / Math.max(sample.length, 1)) * total)
  return { average: product.rating, total, distribution, withMedia }
}

export const SHIPPING_FEES: Record<ShippingMethodId, number> = { express: 30000, standard: 18000, economy: 0 }

export function shippingFee(method: ShippingMethodId, subtotal: number) {
  if (method === 'economy') return subtotal >= 300000 ? 0 : 15000
  return SHIPPING_FEES[method] ?? 0
}

export interface PromoLine {
  productId: string
  quantity: number
  unitPrice: number
}

export function checkPromotion(promo: Promotion | undefined, code: string, lines: PromoLine[], fee: number, now = new Date()): PromotionCheck {
  const fail = (message: string): PromotionCheck => ({ code, valid: false, message, discount: 0, freeShipping: false })
  if (!promo || !promo.active) return fail('Mã khuyến mại không tồn tại hoặc đã hết hiệu lực')
  if (promo.startsAt && new Date(promo.startsAt) > now) return fail('Mã chưa đến thời gian áp dụng')
  if (promo.endsAt && new Date(promo.endsAt) < now) return fail('Mã đã hết hạn')
  if (promo.usageLimit && promo.used >= promo.usageLimit) return fail('Mã đã hết lượt sử dụng')
  const scoped = promo.productIds?.length ? lines.filter((l) => promo.productIds!.includes(l.productId)) : lines
  if (!scoped.length) return fail('Mã không áp dụng cho sản phẩm trong đơn')
  const subtotal = scoped.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
  if (subtotal < promo.minOrder) return fail(`Đơn tối thiểu ${promo.minOrder.toLocaleString('vi-VN')}đ để dùng mã này`)
  if (promo.type === 'freeship') return { code: promo.code, valid: true, message: promo.description, discount: fee, freeShipping: true }
  let discount = promo.type === 'percent' ? Math.round((subtotal * promo.value) / 100) : promo.value
  if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount)
  discount = Math.min(discount, subtotal)
  return { code: promo.code, valid: true, message: promo.description, discount, freeShipping: false }
}
