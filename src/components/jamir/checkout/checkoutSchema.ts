import { z } from 'zod'

export const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai', 'Khánh Hòa']

const newAddress = z.object({
  recipient: z.string().trim().min(2, 'Vui lòng nhập họ tên người nhận'),
  phone: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s.]/g, ''))
    .pipe(z.string().regex(/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ')),
  line: z.string().trim().min(5, 'Vui lòng nhập số nhà, tên đường'),
  district: z.string().trim().min(2, 'Vui lòng nhập quận / huyện'),
  city: z.string().min(1, 'Vui lòng chọn tỉnh / thành phố'),
})

export const checkoutSchema = z
  .object({
    addressMode: z.enum(['saved', 'new']),
    addressId: z.string().optional(),
    newAddress: newAddress.partial(),
    shippingMethod: z.enum(['express', 'standard', 'economy']),
    paymentMethod: z.enum(['cod', 'ewallet', 'card', 'applepay']),
    note: z.string().max(200, 'Tối đa 200 ký tự').optional(),
  })
  .superRefine((v, ctx) => {
    if (v.addressMode === 'saved') {
      if (!v.addressId) ctx.addIssue({ code: 'custom', path: ['addressId'], message: 'Vui lòng chọn địa chỉ' })
      return
    }
    const r = newAddress.safeParse(v.newAddress)
    if (!r.success)
      for (const issue of r.error.issues) ctx.addIssue({ code: 'custom', path: ['newAddress', ...issue.path], message: issue.message })
  })

export type CheckoutForm = z.input<typeof checkoutSchema>
export const parseNewAddress = (v: CheckoutForm['newAddress']) => newAddress.parse(v)
