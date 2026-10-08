import type { Address, AuthSession, CreateOrderInput, Order } from '../../../src/types/domain'
import { hashPassword, issueToken, toCustomer, verifyGoogleCredential, verifyPassword } from '../auth'
import { config } from '../config'
import { HttpError, requireAuth, type Router } from '../http'
import { checkPromotion, newId, shippingFee, toReview, visibleGifts } from '../logic'
import type { Store } from '../store'
import type { CustomerRecord, ReviewRecord } from '../types'

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const normPhone = (p: string) => p.replace(/[\s.]/g, '').replace(/^\+84/, '0')
const PHONE = /^0\d{9}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Client IP behind nginx (X-Real-IP), used by the order rate limit. */
const clientIp = (ctx: { req: { headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string } } }) => {
  const h = ctx.req.headers
  const real = typeof h['x-real-ip'] === 'string' ? h['x-real-ip'] : undefined
  const fwd = typeof h['x-forwarded-for'] === 'string' ? h['x-forwarded-for'].split(',')[0]?.trim() : undefined
  return real || fwd || ctx.req.socket.remoteAddress || ''
}
const vnTime = (d: Date) => d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })

export function accountRoutes(r: Router, db: Store) {
  const session = async (c: CustomerRecord): Promise<AuthSession> => {
    const updated = (await db.customers.update(c.id, { lastLoginAt: new Date().toISOString() })) ?? c
    return { token: issueToken(updated), user: toCustomer(updated) }
  }

  /**
   * Review quota (settings.json → reviewLimit). Default: one review per account,
   * ever — after reviewing any product the customer can't review another.
   * Returns true when the customer has used it up.
   */
  const reviewQuotaUsed = async (userId: string, productId: string) => {
    const lim = { scope: 'account', max: 1, windowDays: 0, ...(await db.settings.read()).reviewLimit }
    if (!(lim.max > 0)) return false
    const since = lim.windowDays > 0 ? Date.now() - lim.windowDays * 86400_000 : 0
    const mine = (await db.reviews.list()).filter(
      (x) => x.userId === userId && (lim.scope === 'account' || x.productId === productId) && new Date(x.createdAt).getTime() >= since,
    )
    return mine.length >= lim.max
  }

  /** bought it in a non-cancelled order */
  const hasBought = async (userId: string, productId: string) =>
    (await db.orders.list()).some((o) => o.userId === userId && o.status !== 'cancelled' && o.items.some((i) => i.productId === productId))

  r.get('/auth/config', () => ({ googleClientId: config.googleClientId }))

  /* ---- reviews: buyers (or admins) only ---- */

  r.get('/products/:id/review-eligibility', async (ctx) => {
    if (!ctx.auth) return { signedIn: false, canReview: false, canLike: false, alreadyReviewed: false }
    const admin = ctx.auth.role === 'admin'
    const bought = admin || (await hasBought(ctx.auth.sub, ctx.params.id!))
    const alreadyReviewed = !admin && (await reviewQuotaUsed(ctx.auth.sub, ctx.params.id!))
    return { signedIn: true, canReview: bought && !alreadyReviewed, canLike: bought, alreadyReviewed }
  })

  r.post('/products/:id/reviews', async (ctx) => {
    const { sub, role } = requireAuth(ctx)
    const productId = ctx.params.id!
    if (!(await db.products.get(productId))) throw new HttpError(404, 'Không tìm thấy sản phẩm')
    if (role !== 'admin' && !(await hasBought(sub, productId))) throw new HttpError(403, 'Chỉ khách đã mua sản phẩm này mới có thể đánh giá')
    if (role !== 'admin' && (await reviewQuotaUsed(sub, productId))) throw new HttpError(409, 'Bạn đã dùng hết lượt đánh giá của tài khoản')
    const b = (ctx.body ?? {}) as Record<string, unknown>
    const rating = Math.round(Number(b.rating))
    const content = str(b.content)
    if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, 'Chọn số sao từ 1 đến 5')
    if (content.length < 10) throw new HttpError(400, 'Nội dung đánh giá tối thiểu 10 ký tự')
    if (content.length > 2000) throw new HttpError(400, 'Nội dung đánh giá tối đa 2000 ký tự')
    const me = await db.customers.get(sub)
    const display = (['full', 'nickname', 'anonymous'] as const).find((d) => d === b.display) ?? 'full'
    const record: ReviewRecord = {
      id: newId('rv'),
      productId,
      rating,
      content,
      colorId: str(b.colorId) || undefined,
      verifiedPurchase: role !== 'admin',
      featured: false,
      helpfulCount: 0,
      commentCount: 0,
      media: [],
      createdAt: new Date().toISOString(),
      author: { name: me?.name ?? 'Khách hàng', nickname: str(b.nickname).slice(0, 40) || undefined, display, avatar: me?.avatar },
      userId: sub,
      likedBy: [],
    }
    await db.reviews.insert(record)
    return toReview(record, sub)
  })

  r.post('/reviews/:id/like', async (ctx) => {
    const { sub, role } = requireAuth(ctx)
    const review = await db.reviews.get(ctx.params.id!)
    if (!review) throw new HttpError(404, 'Không tìm thấy đánh giá')
    if (role !== 'admin' && !(await hasBought(sub, review.productId))) throw new HttpError(403, 'Chỉ khách đã mua sản phẩm này mới có thể thích đánh giá')
    const likedBy = review.likedBy ?? []
    const liked = likedBy.includes(sub)
    const next = liked ? likedBy.filter((x) => x !== sub) : [...likedBy, sub]
    const updated = await db.reviews.update(review.id, { likedBy: next, helpfulCount: Math.max(0, review.helpfulCount + (liked ? -1 : 1)) })
    return toReview(updated!, sub)
  })

  /* ---- questions: any signed-in user; answered by the admin ---- */

  r.post('/products/:id/questions', async (ctx) => {
    const { sub } = requireAuth(ctx)
    const question = str((ctx.body as Record<string, unknown>)?.question)
    if (question.length < 8) throw new HttpError(400, 'Câu hỏi tối thiểu 8 ký tự')
    if (question.length > 500) throw new HttpError(400, 'Câu hỏi tối đa 500 ký tự')
    const since = Date.now() - 86400_000
    const mine = (await db.faqs.list()).filter((f) => f.askedBy === sub && f.createdAt && new Date(f.createdAt).getTime() > since)
    if (mine.length >= 10) throw new HttpError(429, 'Bạn đã gửi nhiều câu hỏi hôm nay, vui lòng thử lại sau')
    await db.faqs.insert({
      id: newId('faq'), productId: ctx.params.id!, question, answer: '', answerCount: 0, status: 'pending', askedBy: sub, createdAt: new Date().toISOString(),
    })
    return { ok: true, message: 'Đã gửi câu hỏi. JAMIR sẽ trả lời sớm nhất có thể.' }
  })

  r.post('/auth/register', async ({ body }) => {
    const b = (body ?? {}) as Record<string, unknown>
    const name = str(b.name)
    const email = str(b.email).toLowerCase()
    const phone = normPhone(str(b.phone))
    const password = str(b.password)
    if (name.length < 2) throw new HttpError(400, 'Vui lòng nhập họ tên')
    if (!PHONE.test(phone)) throw new HttpError(400, 'Số điện thoại không hợp lệ')
    if (email && !EMAIL.test(email)) throw new HttpError(400, 'Email không hợp lệ')
    if (password.length < 6) throw new HttpError(400, 'Mật khẩu tối thiểu 6 ký tự')
    const existing = await db.customers.find((c) => c.phone === phone || (!!email && c.email === email))
    if (existing?.passwordHash || existing?.provider === 'google')
      throw new HttpError(409, 'Số điện thoại hoặc email đã được đăng ký')
    const passwordHash = await hashPassword(password)
    // a guest who ordered before keeps their history
    const record: CustomerRecord = existing
      ? { ...existing, name, email: email || existing.email, provider: 'password', passwordHash }
      : { id: newId('c'), name, email: email || undefined, phone, provider: 'password', role: 'customer', addresses: [], createdAt: new Date().toISOString(), passwordHash }
    if (existing) await db.customers.update(existing.id, record)
    else await db.customers.insert(record)
    return session(record)
  })

  r.post('/auth/login', async ({ body }) => {
    const b = (body ?? {}) as Record<string, unknown>
    const id = str(b.identifier).toLowerCase()
    const phone = normPhone(id)
    const c = await db.customers.find((x) => x.email === id || x.phone === phone)
    if (!c || !(await verifyPassword(str(b.password), c.passwordHash))) throw new HttpError(401, 'Sai tài khoản hoặc mật khẩu')
    return session(c)
  })

  r.post('/auth/google', async ({ body }) => {
    const profile = await verifyGoogleCredential(str((body as Record<string, unknown>)?.credential)).catch((e: Error) => {
      throw new HttpError(401, e.message)
    })
    let c = await db.customers.find((x) => x.googleSub === profile.sub || x.email === profile.email.toLowerCase())
    if (c) {
      c = (await db.customers.update(c.id, { googleSub: profile.sub, avatar: c.avatar ?? profile.picture, provider: c.provider === 'guest' ? 'google' : c.provider }))!
    } else {
      c = await db.customers.insert({
        id: newId('c'), name: profile.name, email: profile.email.toLowerCase(), avatar: profile.picture, provider: 'google', role: 'customer',
        addresses: [], createdAt: new Date().toISOString(), googleSub: profile.sub,
      })
    }
    return session(c)
  })

  r.get('/me', async (ctx) => {
    const c = await db.customers.get(requireAuth(ctx).sub)
    if (!c) throw new HttpError(401, 'Phiên đăng nhập không còn hợp lệ')
    return toCustomer(c)
  })

  r.get('/me/orders', async (ctx) => {
    const { sub } = requireAuth(ctx)
    return (await db.orders.list())
      .filter((o) => o.userId === sub)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ clientIp: _ip, ...o }) => o)
  })

  r.post('/promotions/validate', async ({ body }) => {
    const b = (body ?? {}) as Record<string, unknown>
    const code = str(b.code).toUpperCase()
    const fee = Number(b.shippingFee) || 0
    const products = await db.products.list()
    // price lines from the catalogue
    const lines = (Array.isArray(b.items) ? (b.items as { productId: string; quantity: number }[]) : []).flatMap((i) => {
      const p = products.find((x) => x.id === i.productId)
      return p ? [{ productId: p.id, quantity: Math.max(1, Number(i.quantity) || 1), unitPrice: p.price }] : []
    })
    return checkPromotion(await db.promotions.find((p) => p.code.toUpperCase() === code), code, lines, fee)
  })

  /** Public vouchers, optionally only those usable for a product. */
  r.get('/promotions', async ({ query }) => {
    const productId = query.get('productId')
    const now = new Date()
    return (await db.promotions.list())
      .filter((p) => p.active && p.public && (!p.endsAt || new Date(p.endsAt) > now) && (!p.startsAt || new Date(p.startsAt) <= now))
      .filter((p) => !p.usageLimit || p.used < p.usageLimit)
      .filter((p) => !productId || !p.productIds?.length || p.productIds.includes(productId))
      .map(({ id, code, description, type, value, minOrder, maxDiscount, endsAt, productIds, usageLimit, used }) => ({
        id, code, description, type, value, minOrder, maxDiscount, endsAt, productIds,
        remaining: usageLimit ? Math.max(0, usageLimit - used) : undefined,
      }))
  })

  r.post('/orders', async (ctx) => {
    const input = (ctx.body ?? {}) as CreateOrderInput
    if (!Array.isArray(input.items) || !input.items.length) throw new HttpError(400, 'Giỏ hàng trống')
    const a = input.address ?? ({} as CreateOrderInput['address'])
    const phone = normPhone(str(a.phone))
    if (str(a.recipient).length < 2 || !PHONE.test(phone) || str(a.line).length < 3 || !str(a.city))
      throw new HttpError(400, 'Địa chỉ nhận hàng chưa đầy đủ')

    // anti-spam: max N orders per account / phone / IP within the window, then blocked for the window
    const ip = clientIp(ctx)
    const limit = { max: 5, windowHours: 8, ...(await db.settings.read()).orderLimit }
    if (limit.max > 0 && ctx.auth?.role !== 'admin') {
      const windowMs = limit.windowHours * 3600_000
      const recent = (await db.orders.list()).filter(
        (o) =>
          Date.now() - new Date(o.createdAt).getTime() < windowMs &&
          ((ctx.auth && o.userId === ctx.auth.sub) || o.address.phone === phone || (!!ip && o.clientIp === ip)),
      )
      if (recent.length >= limit.max) {
        const last = Math.max(...recent.map((o) => new Date(o.createdAt).getTime()))
        throw new HttpError(
          429,
          `Bạn đã đặt ${limit.max} đơn trong ${limit.windowHours} giờ qua. Vui lòng đặt lại sau ${vnTime(new Date(last + windowMs))} hoặc liên hệ hotline.`,
        )
      }
    }

    // re-price from the catalogue — never trust client prices
    const products = await db.products.list()
    const items = input.items.map((i) => {
      const p = products.find((x) => x.id === i.productId)
      if (!p) throw new HttpError(400, 'Sản phẩm không tồn tại')
      if (p.stock < i.quantity) throw new HttpError(409, `${p.name} không đủ hàng`)
      const color = p.colors.find((c) => c.id === i.colorId) ?? p.colors[0]
      return {
        productId: p.id, colorId: color?.id ?? i.colorId, quantity: Math.max(1, Math.min(99, Math.floor(i.quantity))), unitPrice: p.price,
        name: p.name, colorName: color?.name, thumbnail: p.thumbnail, gifts: visibleGifts(p).length ? visibleGifts(p).map((g) => g.name) : undefined,
      }
    })
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    let fee = shippingFee(input.shippingMethod, subtotal)
    let discount = 0
    let promoCode: string | undefined
    if (input.promoCode) {
      const promo = await db.promotions.find((p) => p.code.toUpperCase() === str(input.promoCode).toUpperCase())
      const check = checkPromotion(promo, str(input.promoCode), items, fee)
      if (!check.valid) throw new HttpError(400, check.message)
      if (check.freeShipping) fee = 0
      else discount = check.discount
      promoCode = promo!.code
      await db.promotions.update(promo!.id, { used: promo!.used + 1 })
    }

    // attach to the signed-in customer, else find/create a guest by phone
    const address = { recipient: str(a.recipient), phone, line: str(a.line), district: str(a.district), city: str(a.city) }
    let customer = ctx.auth ? await db.customers.get(ctx.auth.sub) : await db.customers.find((c) => c.phone === phone)
    if (!customer) {
      customer = await db.customers.insert({
        id: newId('c'), name: address.recipient, phone, email: str(input.email) || undefined, provider: 'guest', role: 'customer', addresses: [], createdAt: new Date().toISOString(),
      })
    }
    const known = customer.addresses.some((x) => x.line === address.line && x.phone === address.phone)
    if (!known) {
      const saved: Address = { id: newId('addr'), label: customer.addresses.length ? 'Địa chỉ khác' : 'Nhà riêng', isDefault: customer.addresses.length === 0, ...address }
      await db.customers.update(customer.id, { addresses: [...customer.addresses, saved], phone: customer.phone ?? phone })
    }

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const order: Order = {
      id: `JM${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${Math.floor(Math.random() * 90 + 10)}`,
      userId: customer.id,
      items,
      address,
      shippingMethod: input.shippingMethod,
      paymentMethod: input.paymentMethod,
      subtotal,
      shippingFee: fee,
      discount,
      total: subtotal + fee - discount,
      promoCode,
      status: 'pending',
      createdAt: now.toISOString(),
      note: str(input.note) || undefined,
      clientIp: ip || undefined,
    }
    await db.orders.insert(order)
    for (const i of items) {
      const p = products.find((x) => x.id === i.productId)!
      await db.products.update(p.id, { stock: Math.max(0, p.stock - i.quantity), soldCount: p.soldCount + i.quantity })
    }
    const { clientIp: _ip, ...publicOrder } = order
    return publicOrder
  })
}
