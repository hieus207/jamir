import type { Category, LandingPayload, NewsArticle, SearchResult, SiteEvent, SiteSettings, StoriesFeed } from '@/types/domain'
import { get } from './client'

export const getCategories = () => get<Category[]>('/categories')

/** stories.json → { config, items } (active stories, highest priority first) */
export const getStories = () => get<StoriesFeed>('/stories')

export const searchCatalog = (q: string) => get<SearchResult>('/search', { q })

export const getTrendingSearches = () => get<string[]>('/search/trending')

export const getNews = (limit?: number) => get<NewsArticle[]>('/news', { limit })

export const getNewsArticle = (slug: string) => get<NewsArticle>(`/news/${encodeURIComponent(slug)}`)

export const getSettings = () => get<SiteSettings>('/settings')

/** Ad landing page for one product (/lp/:slug). */
export const getLanding = (slug: string) => get<LandingPayload>(`/landing/${encodeURIComponent(slug)}`)

/** Promo popups running right now (highest priority first). */
export const getActiveEvents = () => get<SiteEvent[]>('/events/active')
