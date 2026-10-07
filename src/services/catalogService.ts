import type { Category, SearchResult, Story } from '@/types/domain'
import { get } from './client'
import { db } from './db'
import { toSummary } from './productService'

export function getCategories(): Promise<Category[]> {
  return get('/categories', () => db.categories)
}

export function getStories(): Promise<Story[]> {
  return get('/stories', () => db.stories)
}

/** Lowercase + strip Vietnamese diacritics so "tai nghe" matches "Tai nghe". */
export const normalizeText = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .trim()

export function searchCatalog(q: string): Promise<SearchResult> {
  return get(
    '/search',
    () => {
      const terms = normalizeText(q).split(/\s+/).filter(Boolean)
      if (!terms.length) return { products: [], categories: [] }
      const categoryName = (id: string) => db.categories.find((c) => c.id === id)?.name ?? ''
      const products = db.products
        .map((p) => {
          const name = normalizeText(p.name)
          const hay = normalizeText([p.name, p.shortDescription, categoryName(p.categoryId), ...p.featureTags].join(' '))
          const score = terms.reduce((acc, t) => acc + (name.includes(t) ? 3 : hay.includes(t) ? 1 : 0), 0)
          return { p, score }
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || b.p.soldCount - a.p.soldCount)
        .map((x) => toSummary(x.p))
      const categories = db.categories.filter((c) => terms.some((t) => normalizeText(c.name).includes(t)))
      return { products, categories }
    },
    { q },
  )
}

export function getTrendingSearches(): Promise<string[]> {
  return get('/search/trending', () => db.recommendations.trendingSearches)
}
