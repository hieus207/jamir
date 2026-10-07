import { createWriteStream, mkdirSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { AdminCustomer, AdminOverview, Story } from '../../../src/types/domain'
import { hashPassword, toCustomer } from '../auth'
import { config } from '../config'
import { HttpError, requireAdmin, type Router } from '../http'
import { newId, slugify } from '../logic'
import type { Collection, Store } from '../store'

type Rec = Record<string, unknown> & { id: string }

interface CollectionDef {
  collection: Collection<Rec>
  prefix: string
  /** fill defaults / derived fields; throws HttpError on invalid input */
  prepare?: (doc: Rec, existing: Rec | undefined, all: Rec[]) => Rec | Promise<Rec>
}

const required = (doc: Rec, ...keys: string[]) => {
  for (const k of keys) if (doc[k] === undefined || doc[k] === '' || doc[k] === null) throw new HttpError(400, `Thiếu trường "${k}"`)
}

const uniqueSlug = (doc: Rec, all: Rec[], from: string) => {
  const base = String(doc.slug || slugify(String(doc[from] ?? '')))
  let slug = base
  for (let i = 2; all.some((x) => x.slug === slug && x.id !== doc.id); i++) slug = `${base}-${i}`
  return slug
}

function storyDefaults(doc: Rec, all: Rec[]): Rec {
  required(doc, 'label', 'thumbnail')
  const media = (doc.media ?? {}) as Story['media']
  if (!media.src) throw new HttpError(400, 'Story cần media.src (video hoặc ảnh)')
  return {
    active: true,
    createdAt: new Date().toISOString(),
    ...doc,
    priority: Number(doc.priority ?? Math.max(0, ...all.map((s) => Number(s.priority) || 0)) + 10),
    media: { ...media, type: media.type ?? (/\.(mp4|webm|mov)$/i.test(media.src) ? 'video' : 'image'), aspectRatio: media.aspectRatio ?? '9:16' },
  }
}

export function adminRoutes(r: Router, db: Store) {
  const defs: Record<string, CollectionDef> = {
    products: {
      collection: db.products as unknown as Collection<Rec>,
      prefix: 'p',
      prepare: (d, _e, all) => {
        required(d, 'name', 'price')
        const price = Number(d.price)
        const originalPrice = Number(d.originalPrice || price)
        return {
          colors: [], specs: [], useCases: [], chapters: [], featureTags: [], gallery: [], guarantees: [], faqCount: 0,
          rating: 5, reviewCount: 0, soldCount: 0, stock: 0, brand: 'JAMIR', position: all.length + 1,
          ...d,
          slug: uniqueSlug(d, all, 'name'),
          price,
          originalPrice,
          discount: originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0,
        }
      },
    },
    categories: { collection: db.categories as unknown as Collection<Rec>, prefix: 'cat', prepare: (d, _e, all) => (required(d, 'name'), { icon: 'package', ...d, slug: uniqueSlug(d, all, 'name') }) },
    stories: { collection: db.stories as unknown as Collection<Rec>, prefix: 'st', prepare: (d, e, all) => storyDefaults({ ...e, ...d }, all.filter((x) => x.id !== d.id)) },
    kols: { collection: db.kols as unknown as Collection<Rec>, prefix: 'kol', prepare: (d) => (required(d, 'name'), { verified: true, followers: 0, avatar: '', ...d }) },
    'kol-reviews': {
      collection: db.kolVideos as unknown as Collection<Rec>,
      prefix: 'kr',
      prepare: (d) => (
        required(d, 'productId', 'kolId', 'title', 'thumbnail'),
        { aspectRatio: '16:9', source: 'jamir', duration: 0, views: 0, likes: 0, publishedAt: new Date().toISOString(), videoSrc: '', ...d }
      ),
    },
    reviews: {
      collection: db.reviews as unknown as Collection<Rec>,
      prefix: 'rv',
      prepare: (d) => (
        required(d, 'productId', 'content'),
        {
          rating: 5, verifiedPurchase: true, featured: false, helpfulCount: 0, commentCount: 0, media: [], createdAt: new Date().toISOString(), author: { name: 'Khách hàng JAMIR' },
          ...d,
          // shop reply: stamp when written, drop when cleared
          reply: String((d.reply as Rec | undefined)?.content ?? '').trim()
            ? { createdAt: new Date().toISOString(), ...(d.reply as Rec) }
            : undefined,
        }
      ),
    },
    faqs: {
      collection: db.faqs as unknown as Collection<Rec>,
      prefix: 'faq',
      prepare: (d) => {
        required(d, 'productId', 'question')
        // answering a customer question publishes it
        const answered = !!String(d.answer ?? '').trim()
        return { answerCount: answered ? 1 : 0, createdAt: new Date().toISOString(), ...d, status: answered ? 'answered' : 'pending' }
      },
    },
    'landing-pages': {
      collection: db.landingPages as unknown as Collection<Rec>,
      prefix: 'lp',
      prepare: (d, _e, all) => (
        required(d, 'productId', 'headline'),
        { active: true, bullets: [], ctaText: 'Mua ngay', showKol: true, showReviews: true, ...d, slug: uniqueSlug(d, all, 'headline') }
      ),
    },
    events: {
      collection: db.events as unknown as Collection<Rec>,
      prefix: 'ev',
      prepare: (d) => {
        required(d, 'title', 'image')
        const target = (d.target ?? {}) as Rec
        if (!target.type || !target.value) throw new HttpError(400, 'Chọn nơi chuyển tới khi bấm (sản phẩm, bài viết, video hoặc link)')
        return { active: true, priority: 0, frequency: 'daily', ...d }
      },
    },
    news: {
      collection: db.news as unknown as Collection<Rec>,
      prefix: 'n',
      prepare: (d, _e, all) => (
        required(d, 'title'),
        { excerpt: '', content: '', cover: '', tags: [], author: 'Ban biên tập JAMIR', published: true, publishedAt: new Date().toISOString(), ...d, slug: uniqueSlug(d, all, 'title') }
      ),
    },
    promotions: {
      collection: db.promotions as unknown as Collection<Rec>,
      prefix: 'pm',
      prepare: (d, _e, all) => {
        required(d, 'code', 'type')
        const code = String(d.code).trim().toUpperCase().replace(/\s+/g, '')
        if (all.some((p) => String(p.code).toUpperCase() === code && p.id !== d.id)) throw new HttpError(409, `Mã ${code} đã tồn tại`)
        return { description: '', used: 0, active: true, ...d, code, value: Number(d.value) || 0, minOrder: Number(d.minOrder) || 0 }
      },
    },
    orders: {
      collection: db.orders as unknown as Collection<Rec>,
      prefix: 'JM',
      prepare: async (d, existing) => {
        // cancelling gives the promo code's use back; un-cancelling takes it again
        const was = existing?.status === 'cancelled'
        const now = d.status === 'cancelled'
        if (existing && was !== now && d.promoCode) {
          const promo = await db.promotions.find((p) => p.code === d.promoCode)
          if (promo) await db.promotions.update(promo.id, { used: Math.max(0, promo.used + (now ? -1 : 1)) })
        }
        return d
      },
    },
  }

  const def = (name: string) => {
    const d = defs[name]
    if (!d) throw new HttpError(404, `Không có bảng "${name}"`)
    return d
  }

  /* ---- dashboard & customers ---- */

  r.get('/admin/overview', async (ctx): Promise<AdminOverview> => {
    requireAdmin(ctx)
    const [customers, orders, products, stories] = await Promise.all([db.customers.list(), db.orders.list(), db.products.list(), db.stories.list()])
    const active = orders.filter((o) => o.status !== 'cancelled')
    return {
      customers: customers.filter((c) => c.role !== 'admin').length,
      orders: orders.length,
      revenue: active.reduce((s, o) => s + o.total, 0),
      products: products.length,
      stories: stories.filter((s) => s.active).length,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      recentOrders: orders
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6)
        .map((o) => ({ ...o, customerName: customers.find((c) => c.id === o.userId)?.name ?? o.address.recipient })),
    }
  })

  r.get('/admin/customers', async (ctx): Promise<AdminCustomer[]> => {
    requireAdmin(ctx)
    const orders = await db.orders.list()
    return (await db.customers.list())
      .map((c) => {
        const mine = orders.filter((o) => o.userId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        return {
          ...toCustomer(c),
          orders: mine,
          orderCount: mine.length,
          totalSpent: mine.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
          lastOrderAt: mine[0]?.createdAt,
        }
      })
      .sort((a, b) => (b.lastOrderAt ?? b.createdAt).localeCompare(a.lastOrderAt ?? a.createdAt))
  })

  r.put('/admin/customers/:id', async (ctx) => {
    requireAdmin(ctx)
    const b = (ctx.body ?? {}) as Record<string, unknown>
    const patch: Record<string, unknown> = {}
    for (const k of ['name', 'email', 'phone', 'role', 'addresses'] as const) if (b[k] !== undefined) patch[k] = b[k]
    if (typeof b.password === 'string' && b.password.length >= 6) patch.passwordHash = await hashPassword(b.password)
    const c = await db.customers.update(ctx.params.id!, patch)
    if (!c) throw new HttpError(404, 'Không tìm thấy khách hàng')
    return toCustomer(c)
  })

  r.delete('/admin/customers/:id', async (ctx) => {
    const { sub } = requireAdmin(ctx)
    if (ctx.params.id === sub) throw new HttpError(400, 'Không thể xóa chính bạn')
    if (!(await db.customers.remove(ctx.params.id!))) throw new HttpError(404, 'Không tìm thấy khách hàng')
  })

  /* ---- single documents ---- */

  const docs = { settings: db.settings, 'stories-config': db.storiesConfig, recommendations: db.recommendations } as const
  r.get('/admin/doc/:name', (ctx) => {
    requireAdmin(ctx)
    const d = docs[ctx.params.name as keyof typeof docs]
    if (!d) throw new HttpError(404, 'Không tìm thấy')
    return d.read()
  })
  r.put('/admin/doc/:name', (ctx) => {
    requireAdmin(ctx)
    const d = docs[ctx.params.name as keyof typeof docs] as { write(v: unknown): Promise<unknown> } | undefined
    if (!d) throw new HttpError(404, 'Không tìm thấy')
    if (!ctx.body || typeof ctx.body !== 'object') throw new HttpError(400, 'Dữ liệu không hợp lệ')
    return d.write(ctx.body)
  })

  /* ---- story import: a story object, an array, or { items: [...] } ---- */

  r.post('/admin/stories/import', async (ctx) => {
    requireAdmin(ctx)
    const b = ctx.body as unknown
    const list = (Array.isArray(b) ? b : b && typeof b === 'object' && Array.isArray((b as { items?: unknown }).items) ? (b as { items: unknown[] }).items : [b]) as Rec[]
    const created: Rec[] = []
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') throw new HttpError(400, 'File JSON không đúng định dạng story')
      const all = await db.stories.list()
      const doc = storyDefaults({ ...raw, id: newId('st') }, all as unknown as Rec[])
      created.push((await db.stories.insert(doc as unknown as Story)) as unknown as Rec)
    }
    return created
  })

  /* ---- media upload: raw body, ?filename= ---- */

  r.on(
    'POST',
    '/admin/upload',
    async (ctx) => {
      requireAdmin(ctx)
      const original = ctx.query.get('filename') ?? 'file'
      const ext = extname(original).toLowerCase()
      if (!/^\.(jpe?g|png|webp|gif|avif|mp4|webm|mov|m4v)$/.test(ext)) throw new HttpError(400, 'Chỉ nhận ảnh (jpg, png, webp, gif, avif) hoặc video (mp4, webm, mov)')
      const len = Number(ctx.req.headers['content-length'] ?? 0)
      if (len > config.maxUploadMb * 1024 * 1024) throw new HttpError(413, `File tối đa ${config.maxUploadMb}MB`)
      const month = new Date().toISOString().slice(0, 7)
      const dir = join(config.mediaDir, month)
      mkdirSync(dir, { recursive: true })
      const name = `${slugify(original.replace(/\.[^.]+$/, '')).slice(0, 40)}-${Date.now().toString(36)}${ext}`
      const path = join(dir, name)
      let size = 0
      ctx.req.on('data', (c: Buffer) => {
        size += c.length
        if (size > config.maxUploadMb * 1024 * 1024) ctx.req.destroy(new Error('too large'))
      })
      try {
        await pipeline(ctx.req, createWriteStream(path))
      } catch {
        await unlink(path).catch(() => {})
        throw new HttpError(413, 'Tải lên thất bại hoặc file quá lớn')
      }
      return { url: `${config.mediaUrl}/${month}/${name}`, size, type: /\.(mp4|webm|mov|m4v)$/.test(ext) ? 'video' : 'image' }
    },
    { raw: true },
  )

  /* ---- generic CRUD: /admin/c/:collection ---- */

  r.get('/admin/c/:name', async (ctx) => {
    requireAdmin(ctx)
    return def(ctx.params.name!).collection.list()
  })
  r.get('/admin/c/:name/:id', async (ctx) => {
    requireAdmin(ctx)
    const doc = await def(ctx.params.name!).collection.get(ctx.params.id!)
    if (!doc) throw new HttpError(404, 'Không tìm thấy')
    return doc
  })
  r.post('/admin/c/:name', async (ctx) => {
    requireAdmin(ctx)
    const d = def(ctx.params.name!)
    const body = (ctx.body ?? {}) as Rec
    const all = await d.collection.list()
    const doc = { ...body, id: body.id && !all.some((x) => x.id === body.id) ? String(body.id) : newId(d.prefix) }
    return d.collection.insert(d.prepare ? await d.prepare(doc, undefined, all) : doc)
  })
  r.put('/admin/c/:name/:id', async (ctx) => {
    requireAdmin(ctx)
    const d = def(ctx.params.name!)
    const existing = await d.collection.get(ctx.params.id!)
    if (!existing) throw new HttpError(404, 'Không tìm thấy')
    const merged = { ...existing, ...((ctx.body ?? {}) as Rec), id: existing.id }
    const doc = d.prepare ? await d.prepare(merged, existing, await d.collection.list()) : merged
    return d.collection.update(existing.id, doc)
  })
  r.delete('/admin/c/:name/:id', async (ctx) => {
    requireAdmin(ctx)
    if (!(await def(ctx.params.name!).collection.remove(ctx.params.id!))) throw new HttpError(404, 'Không tìm thấy')
  })
}
