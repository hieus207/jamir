import type { FeederState, ReviewFeederConfig, ReviewPoolItem, ReviewerDisplay } from '../../src/types/domain'
import { newId } from './logic'
import type { Store } from './store'
import type { ReviewRecord } from './types'

const DEFAULTS: Required<Omit<ReviewFeederConfig, 'sourceUrl'>> & { sourceUrl: string } = { enabled: false, everyHours: 36, perRun: 2, sourceUrl: '' }
const DISPLAYS: ReviewerDisplay[] = ['full', 'nickname', 'anonymous']
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Accepts a loose item (file / external feed) and resolves product slug → id. Returns null when unusable. */
export function normalizePoolItem(raw: unknown, products: { id: string; slug: string }[]): ReviewPoolItem | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const content = str(r.content)
  const rating = Math.round(Number(r.rating ?? 5))
  if (content.length < 10 || !(rating >= 1 && rating <= 5)) return null
  const product = products.find((p) => p.id === r.productId || p.slug === r.productSlug || p.slug === r.productId)
  const display = DISPLAYS.find((d) => d === r.display)
  return {
    id: str(r.id) || newId('pool'),
    productId: product?.id,
    rating,
    content,
    name: str(r.name) || 'Khách hàng JAMIR',
    nickname: str(r.nickname) || undefined,
    display,
    avatar: str(r.avatar) || undefined,
    colorId: str(r.colorId) || undefined,
    media: Array.isArray(r.media) ? (r.media as ReviewPoolItem['media']) : undefined,
  }
}

/** Add items to the pool, skipping duplicates (same product + text) and texts already posted. */
export async function importPool(db: Store, items: unknown[]) {
  const products = await db.products.list()
  const pool = await db.reviewPool.list()
  const posted = new Set((await db.reviews.list()).map((x) => x.content.trim()))
  let added = 0
  let skipped = 0
  for (const raw of items) {
    const item = normalizePoolItem(raw, products)
    if (!item || posted.has(item.content) || pool.some((x) => x.productId === item.productId && x.content === item.content)) {
      skipped++
      continue
    }
    await db.reviewPool.insert(item)
    pool.push(item)
    added++
  }
  return { added, skipped }
}

/**
 * Demo review feeder: every `everyHours` posts `perRun` reviews from the pool
 * (optionally refilled from `sourceUrl`). Posted reviews carry `seeded: true`
 * and never the "Đã mua hàng" badge, and can be purged in one go.
 */
export async function runFeeder(db: Store, force = false): Promise<FeederState> {
  const cfg = { ...DEFAULTS, ...(await db.settings.read()).reviewFeeder }
  const state = await db.feederState.read()
  if (!force) {
    if (!cfg.enabled) return state
    if (state.lastRunAt && Date.now() - new Date(state.lastRunAt).getTime() < Math.max(1, cfg.everyHours) * 3600_000) return state
  }
  const log: string[] = []
  const stamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })

  if (cfg.sourceUrl) {
    try {
      const res = await fetch(cfg.sourceUrl, { signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as unknown
      const items = Array.isArray(json) ? json : ((json as { items?: unknown[] })?.items ?? [])
      const r = await importPool(db, items)
      log.push(`${stamp} · nguồn ngoài: thêm ${r.added} mẫu, bỏ qua ${r.skipped} trùng`)
    } catch (e) {
      log.push(`${stamp} · nguồn ngoài lỗi: ${(e as Error).message}`)
    }
  }

  const products = await db.products.list()
  const pool = [...(await db.reviewPool.list())].sort(() => Math.random() - 0.5)
  // spread picks across products: prefer one per product first
  const picks: ReviewPoolItem[] = []
  const used = new Set<string>()
  for (const pass of [true, false]) {
    for (const item of pool) {
      if (picks.length >= Math.max(0, cfg.perRun)) break
      if (picks.includes(item)) continue
      const pid = item.productId ?? pick(products)?.id
      if (!pid || (pass && used.has(pid))) continue
      used.add(pid)
      picks.push({ ...item, productId: pid })
    }
  }
  for (const item of picks) {
    const product = products.find((p) => p.id === item.productId)
    if (!product) continue
    const review: ReviewRecord = {
      id: newId('rv'),
      productId: product.id,
      rating: item.rating,
      content: item.content,
      colorId: item.colorId ?? pick(product.colors)?.id,
      verifiedPurchase: false,
      featured: false,
      helpfulCount: 0,
      commentCount: 0,
      media: item.media ?? [],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 6 * 3600_000)).toISOString(),
      author: { name: item.name, nickname: item.nickname, display: item.display ?? pick(DISPLAYS), avatar: item.avatar },
      seeded: true,
    }
    await db.reviews.insert(review)
    await db.reviewPool.remove(item.id)
    log.push(`${stamp} · đăng "${item.content.slice(0, 40)}…" vào ${product.name}`)
  }
  if (!picks.length) log.push(`${stamp} · kho mẫu trống, không đăng gì`)

  return db.feederState.write({
    lastRunAt: new Date().toISOString(),
    log: [...log, ...(state.log ?? [])].slice(0, 30),
  })
}

/** Boot: run shortly after start, then check every 10 minutes. */
export function startFeeder(db: Store) {
  const tick = () => runFeeder(db).catch((e) => console.error('[feeder]', e))
  setTimeout(tick, 30_000)
  setInterval(tick, 10 * 60_000)
}
