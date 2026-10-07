import type {
  CreateOrderInput,
  Order,
  PaymentMethod,
  ShippingMethod,
  ShippingMethodId,
  User,
} from '@/types/domain'
import { get, post } from './client'
import { db } from './db'

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

export function getShippingFee(method: ShippingMethodId, subtotal: number) {
  if (method === 'economy') return subtotal >= 300000 ? 0 : 15000
  return SHIPPING_METHODS.find((s) => s.id === method)?.fee ?? 0
}

export function getCurrentUser(): Promise<User> {
  return get('/me', () => db.users.find((u) => u.id === 'u-me'))
}

export function getMyOrders(): Promise<Order[]> {
  return get('/me/orders', () => db.orders.filter((o) => o.userId === 'u-me'))
}

export function createOrder(input: CreateOrderInput): Promise<Order> {
  return post('/orders', input, () => {
    const subtotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    const shippingFee = getShippingFee(input.shippingMethod, subtotal)
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`
    const order: Order = {
      id: `JM${stamp}${Math.floor(Math.random() * 90 + 10)}`,
      userId: 'u-me',
      items: input.items,
      addressId: input.address.id ?? 'new',
      shippingMethod: input.shippingMethod,
      paymentMethod: input.paymentMethod,
      subtotal,
      shippingFee,
      discount: 0,
      total: subtotal + shippingFee,
      status: 'confirmed',
      createdAt: now.toISOString(),
      note: input.note,
    }
    db.orders.unshift(order) // in-memory only for the prototype
    return order
  })
}
