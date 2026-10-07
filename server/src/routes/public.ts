import type { ReviewSort, StoriesFeed } from '../../../src/types/domain'
import { HttpError, type Router } from '../http'
import { byPosition, normalizeText, ratingSummary, toPublicProduct, toReview, toSummary, withKol } from '../logic'
import type { Store } from '../store'

export function publicRoutes(r: Router, db: Store) {
  const productBySlug = async (slug: string) => {
    const p = await db.products.find((x) => x.slug === slug)
    if (!p) throw new HttpError(404, 'Không tìm thấy sản phẩm')
    return p
  }
  const productsByIds = async (ids: string[]) => {
    const all = await db.products.list()
    return ids.map((id) => all.find((p) => p.id === id)).filter((p) => !!p).map(toSummary)
  }

  r.get('/products', async ({ query }) => {
    const all = (await db.products.list()).sort(byPosition)
    const ids = query.get('ids')
    if (ids) return productsByIds(ids.split(',').filter(Boolean))
    const cat = query.get('categoryId')
    return all.filter((p) => !cat || p.categoryId === cat).map(toSummary)
  })

  r.get('/products/:slug', async ({ params }) => toPublicProduct(await productBySlug(params.slug!)))

  r.get('/products/:slug/neighbors', async ({ params }) => {
    const list = (await db.products.list()).sort(byPosition)
    const index = list.findIndex((p) => p.slug === params.slug)
    if (index === -1) throw new HttpError(404, 'Không tìm thấy sản phẩm')
    const at = (i: number) => toSummary(list[(i + list.length) % list.length]!)
    return { prev: at(index - 1), next: at(index + 1), index, total: list.length }
  })

  r.get('/products/:id/kol-reviews', async ({ params }) => {
    const kols = await db.kols.list()
    return (await db.kolVideos.list()).filter((v) => v.productId === params.id).map((v) => withKol(v, kols))
  })

  r.get('/kol-reviews', async () => {
    const kols = await db.kols.list()
    return (await db.kolVideos.list()).sort((a, b) => b.views - a.views).map((v) => withKol(v, kols))
  })

  r.get('/products/:id/reviews', async ({ params, query, auth }) => {
    const sort = (query.get('sort') ?? 'featured') as ReviewSort
    let list = (await db.reviews.list()).filter((x) => x.productId === params.id && !x.hidden)
    if (sort === 'media') list = list.filter((x) => x.media.length > 0)
    list.sort((a, b) =>
      sort === 'featured'
        ? Number(b.featured) - Number(a.featured) || b.helpfulCount - a.helpfulCount
        : b.createdAt.localeCompare(a.createdAt),
    )
    return list.map((x) => toReview(x, auth?.sub))
  })

  r.get('/products/:id/rating-summary', async ({ params }) => {
    const product = await db.products.get(params.id!)
    if (!product) throw new HttpError(404, 'Không tìm thấy sản phẩm')
    return ratingSummary(product, (await db.reviews.list()).filter((x) => x.productId === product.id))
  })

  // only answered questions are public; pending ones wait for the admin
  r.get('/products/:id/faqs', async ({ params }) =>
    (await db.faqs.list()).filter((f) => f.productId === params.id && f.status !== 'pending' && !!f.answer?.trim()),
  )

  /* ---- ad landing page: /lp/:slug ---- */
  r.get('/landing/:slug', async ({ params }) => {
    const page = await db.landingPages.find((p) => p.slug === params.slug && p.active)
    if (!page) throw new HttpError(404, 'Trang không tồn tại hoặc đã tắt')
    const product = await db.products.get(page.productId)
    if (!product) throw new HttpError(404, 'Sản phẩm của trang này không còn')
    const kols = await db.kols.list()
    const reviews = (await db.reviews.list())
      .filter((x) => x.productId === product.id && !x.hidden)
      .sort((a, b) => Number(b.featured) - Number(a.featured) || b.media.length - a.media.length || b.helpfulCount - a.helpfulCount)
      .slice(0, 6)
      .map((x) => toReview(x))
    const kol = (await db.kolVideos.list())
      .filter((v) => v.productId === product.id)
      .sort((a, b) => b.views - a.views)
      .slice(0, 4)
      .map((v) => withKol(v, kols))
    return { page, product: toPublicProduct(product), reviews, kol }
  })

  /* ---- home hero banners running now ---- */
  r.get('/banners', async () => {
    const now = Date.now()
    return (await db.banners.list())
      .filter((b) => b.active && (!b.startsAt || new Date(b.startsAt).getTime() <= now) && (!b.endsAt || new Date(b.endsAt).getTime() > now))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  })

  /* ---- promo popups running now ---- */
  r.get('/events/active', async () => {
    const now = Date.now()
    return (await db.events.list())
      .filter((e) => e.active && (!e.startsAt || new Date(e.startsAt).getTime() <= now) && (!e.endsAt || new Date(e.endsAt).getTime() > now))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  })

  r.get('/products/:id/related', async ({ params }) => productsByIds((await db.recommendations.read()).related[params.id!] ?? []))
  r.get('/products/:id/bought-together', async ({ params }) =>
    productsByIds((await db.recommendations.read()).boughtTogether[params.id!] ?? []),
  )
  r.get('/recommendations/for-you', async () => {
    const rec = await db.recommendations.read()
    const all = (await db.products.list()).sort(byPosition)
    // curated list first, then any product not listed (so new products show up)
    const ids = [...rec.forYou, ...all.map((p) => p.id).filter((id) => !rec.forYou.includes(id))]
    return productsByIds(ids)
  })

  r.get('/categories', () => db.categories.list())

  r.get('/stories', async (): Promise<StoriesFeed> => {
    const items = (await db.stories.list()).filter((s) => s.active).sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt))
    return { config: await db.storiesConfig.read(), items }
  })

  r.get('/search', async ({ query }) => {
    const terms = normalizeText(query.get('q') ?? '').split(/\s+/).filter(Boolean)
    if (!terms.length) return { products: [], categories: [] }
    const cats = await db.categories.list()
    const products = (await db.products.list())
      .map((p) => {
        const name = normalizeText(p.name)
        const hay = normalizeText([p.name, p.shortDescription, cats.find((c) => c.id === p.categoryId)?.name ?? '', ...p.featureTags].join(' '))
        return { p, score: terms.reduce((acc, t) => acc + (name.includes(t) ? 3 : hay.includes(t) ? 1 : 0), 0) }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.p.soldCount - a.p.soldCount)
      .map((x) => toSummary(x.p))
    return { products, categories: cats.filter((c) => terms.some((t) => normalizeText(c.name).includes(t))) }
  })

  r.get('/search/trending', async () => (await db.recommendations.read()).trendingSearches)

  r.get('/community/feed', async () => {
    const products = await db.products.list()
    return (await db.reviews.list())
      .filter((x) => x.media.length > 0)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((x) => {
        const p = products.find((pp) => pp.id === x.productId)
        return { ...toReview(x), productSlug: p?.slug ?? '', productName: p?.name ?? '' }
      })
  })

  r.get('/news', async ({ query }) => {
    const limit = Number(query.get('limit') ?? 0)
    const rank = (n: { priority?: number }) => (n.priority && n.priority > 0 ? n.priority : Number.MAX_SAFE_INTEGER)
    const list = (await db.news.list())
      .filter((n) => n.published)
      .sort((a, b) => rank(a) - rank(b) || b.publishedAt.localeCompare(a.publishedAt))
    return limit ? list.slice(0, limit) : list
  })
  r.get('/news/:slug', async ({ params }) => {
    const n = await db.news.find((x) => x.slug === params.slug && x.published)
    if (!n) throw new HttpError(404, 'Không tìm thấy bài viết')
    return n
  })

  r.get('/settings', () => db.settings.read())
}
