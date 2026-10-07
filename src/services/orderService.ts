import type {
  AuthSession,
  CreateOrderInput,
  Customer,
  Order,
  PaymentMethod,
  PromotionCheck,
  ShippingMethod,
  ShippingMethodId,
  Voucher,
} from '@/types/domain'
import { get, post } from './client'

export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: 'express', name: 'Hỏa tốc 4h', description: 'Nội thành Hà Nội & TP.HCM', fee: 30000, eta: 'Nhận trong hôm nay' },
  { id: 'standard', name: 'Tiêu chuẩn', description: 'Giao toàn quốc', fee: 18000, eta: 'Nhận sau 2–3 ngày' },
  { id: 'economy', name: 'Tiết kiệm', description: 'Miễn phí cho đơn từ 300K', fee: 0, eta: 'Nhận sau 4–6 ngày' },
]

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', description: 'Kiểm tra hàng trước khi trả tiền', icon: 'banknote' },
  { id: 'ewallet', name: 'Ví điện tử', description: 'MoMo, ZaloPay, ShopeePay', icon: 'wallet' },
  { id: 'card', name: 'Thẻ ngân hàng', description: 'ATM nội địa, Visa, Mastercard', icon: 'credit-card' },
  { id: 'applepay', name: 'Apple Pay', description: 'Thanh toán nhanh bằng Face ID', icon: 'smartphone' },
]

/** Display estimate — the server recomputes the real fee when the order is placed. */
export function getShippingFee(method: ShippingMethodId, subtotal: number) {
  if (method === 'economy') return subtotal >= 300000 ? 0 : 15000
  return SHIPPING_METHODS.find((s) => s.id === method)?.fee ?? 0
}

export const createOrder = (input: CreateOrderInput) => post<Order>('/orders', input)

export const validatePromotion = (code: string, items: { productId: string; quantity: number }[], shippingFee: number) =>
  post<PromotionCheck>('/promotions/validate', { code, items, shippingFee })

/** Public vouchers (all, or those usable for one product). */
export const getVouchers = (productId?: string) => get<Voucher[]>('/promotions', { productId })

/* ---- account ---- */

export const getAuthConfig = () => get<{ googleClientId: string }>('/auth/config')
export const login = (identifier: string, password: string) => post<AuthSession>('/auth/login', { identifier, password })
export const register = (input: { name: string; phone: string; email?: string; password: string }) => post<AuthSession>('/auth/register', input)
export const loginWithGoogle = (credential: string) => post<AuthSession>('/auth/google', { credential })
export const getCurrentUser = () => get<Customer>('/me')
export const getMyOrders = () => get<Order[]>('/me/orders')
