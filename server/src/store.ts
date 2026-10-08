/**
 * Storage layer. Route handlers only talk to the `Store` interface (async),
 * so the JSON-file implementation below can later be swapped for MariaDB
 * (one table per collection) without touching the API.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type {
  Category,
  Faq,
  KolVideoRecord,
  NewsArticle,
  Order,
  Product,
  Promotion,
  SiteSettings,
  Story,
  StoriesConfig,
  User,
  LandingPage,
  SiteEvent,
  HomeBanner,
  FeederState,
  ReviewPoolItem,
} from '../../src/types/domain'
import type { CustomerRecord, RecommendationsRecord, ReviewRecord } from './types'

export interface Collection<T extends { id: string }> {
  list(): Promise<T[]>
  get(id: string): Promise<T | undefined>
  find(pred: (t: T) => boolean): Promise<T | undefined>
  insert(doc: T): Promise<T>
  update(id: string, patch: Partial<T>): Promise<T | undefined>
  remove(id: string): Promise<boolean>
}

export interface Doc<T> {
  read(): Promise<T>
  write(value: T): Promise<T>
}

export interface Store {
  products: Collection<Product>
  categories: Collection<Category>
  stories: Collection<Story>
  storiesConfig: Doc<StoriesConfig>
  kols: Collection<User>
  kolVideos: Collection<KolVideoRecord>
  reviews: Collection<ReviewRecord>
  faqs: Collection<Faq>
  news: Collection<NewsArticle>
  promotions: Collection<Promotion>
  customers: Collection<CustomerRecord>
  orders: Collection<Order>
  settings: Doc<SiteSettings>
  recommendations: Doc<RecommendationsRecord>
  landingPages: Collection<LandingPage>
  events: Collection<SiteEvent>
  banners: Collection<HomeBanner>
  reviewPool: Collection<ReviewPoolItem>
  feederState: Doc<FeederState>
}

/* ------------------------------------------------------------------ */
/* JSON file implementation                                            */
/* ------------------------------------------------------------------ */

class JsonFile<T> {
  private data: T
  private timer: NodeJS.Timeout | null = null
  constructor(private readonly path: string) {
    this.data = JSON.parse(readFileSync(path, 'utf8')) as T
  }
  get value() {
    return this.data
  }
  set value(v: T) {
    this.data = v
  }
  /** Debounced atomic write (tmp file + rename) so a crash never leaves half a file. */
  save() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => this.flush(), 120)
  }
  flush() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    const tmp = `${this.path}.tmp`
    writeFileSync(tmp, JSON.stringify(this.data, null, 2) + '\n')
    renameSync(tmp, this.path)
  }
}

const clone = <T>(v: T): T => structuredClone(v)

/** Collection over an array stored either as the whole file or under `key`. */
function jsonCollection<T extends { id: string }>(file: JsonFile<unknown>, key?: string): Collection<T> {
  const arr = (): T[] => (key ? (file.value as Record<string, T[]>)[key]! : (file.value as T[]))
  return {
    async list() {
      return clone(arr())
    },
    async get(id) {
      const found = arr().find((t) => t.id === id)
      return found && clone(found)
    },
    async find(pred) {
      const found = arr().find(pred)
      return found && clone(found)
    },
    async insert(doc) {
      if (arr().some((t) => t.id === doc.id)) throw new Error(`Duplicate id ${doc.id}`)
      arr().push(clone(doc))
      file.save()
      return clone(doc)
    },
    async update(id, patch) {
      const list = arr()
      const i = list.findIndex((t) => t.id === id)
      if (i === -1) return undefined
      list[i] = { ...list[i]!, ...clone(patch), id }
      file.save()
      return clone(list[i]!)
    },
    async remove(id) {
      const list = arr()
      const i = list.findIndex((t) => t.id === id)
      if (i === -1) return false
      list.splice(i, 1)
      file.save()
      return true
    },
  }
}

function jsonDoc<T>(file: JsonFile<unknown>, key?: string): Doc<T> {
  return {
    async read() {
      return clone((key ? (file.value as Record<string, T>)[key] : file.value) as T)
    },
    async write(value) {
      if (key) (file.value as Record<string, T>)[key] = clone(value)
      else file.value = clone(value)
      file.save()
      return clone(value)
    },
  }
}

export function createJsonStore(dataDir: string, seedDir: string): Store & { flush(): void } {
  mkdirSync(dataDir, { recursive: true })
  // first run: copy any missing collection from the seed
  for (const name of readdirSync(seedDir)) {
    if (name.endsWith('.json') && !existsSync(join(dataDir, name))) copyFileSync(join(seedDir, name), join(dataDir, name))
  }
  const files = new Map<string, JsonFile<unknown>>()
  const f = (name: string) => {
    if (!files.has(name)) files.set(name, new JsonFile(join(dataDir, name)))
    return files.get(name)!
  }
  return {
    products: jsonCollection(f('products.json')),
    categories: jsonCollection(f('categories.json')),
    // stories.json = { config, items } — one file per the spec
    stories: jsonCollection(f('stories.json'), 'items'),
    storiesConfig: jsonDoc(f('stories.json'), 'config'),
    kols: jsonCollection(f('kols.json')),
    kolVideos: jsonCollection(f('kol-reviews.json')),
    reviews: jsonCollection(f('reviews.json')),
    faqs: jsonCollection(f('faqs.json')),
    news: jsonCollection(f('news.json')),
    promotions: jsonCollection(f('promotions.json')),
    customers: jsonCollection(f('users.json')),
    orders: jsonCollection(f('orders.json')),
    settings: jsonDoc(f('settings.json')),
    recommendations: jsonDoc(f('recommendations.json')),
    landingPages: jsonCollection(f('landing-pages.json')),
    events: jsonCollection(f('events.json')),
    banners: jsonCollection(f('banners.json')),
    reviewPool: jsonCollection(f('review-pool.json')),
    feederState: jsonDoc(f('feeder-state.json')),
    flush: () => files.forEach((file) => file.flush()),
  }
}
