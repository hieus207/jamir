import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createOrder,
  getBoughtTogether,
  getCategories,
  getCommunityFeed,
  getNews,
  getNewsArticle,
  getSettings,
  getAuthConfig,
  getActiveEvents,
  getBanners,
  getLanding,
  getReviewEligibility,
  getVouchers,
  getCurrentUser,
  getKolFeed,
  getKolReviews,
  getMyOrders,
  getProductBySlug,
  getProductFaqs,
  getProductNeighbors,
  getProductsByIds,
  getProductReviews,
  getProducts,
  getRatingSummary,
  getRecommendedForYou,
  getRelatedProducts,
  getStories,
  getTrendingSearches,
  searchCatalog,
} from '@/services'
import { useSession } from '@/components/jamir/auth/authStore'
import type { ReviewSort } from '@/types/domain'

/** Centralised query keys — one place to invalidate/prefetch from. */
export const qk = {
  products: (categoryId?: string) => ['products', { categoryId }] as const,
  product: (slug: string) => ['product', slug] as const,
  neighbors: (slug: string) => ['product', slug, 'neighbors'] as const,
  kolReviews: (productId: string) => ['kol-reviews', productId] as const,
  kolFeed: ['kol-feed'] as const,
  reviews: (productId: string, sort: ReviewSort) => ['reviews', productId, sort] as const,
  ratingSummary: (productId: string) => ['rating-summary', productId] as const,
  faqs: (productId: string) => ['faqs', productId] as const,
  related: (productId: string) => ['related', productId] as const,
  boughtTogether: (productId: string) => ['bought-together', productId] as const,
  forYou: ['for-you'] as const,
  categories: ['categories'] as const,
  stories: ['stories'] as const,
  search: (q: string) => ['search', q] as const,
  trending: ['trending'] as const,
  byIds: (ids: string[]) => ['products-by-ids', ids] as const,
  community: ['community'] as const,
  news: (limit?: number) => ['news', limit] as const,
  newsArticle: (slug: string) => ['news', 'article', slug] as const,
  settings: ['settings'] as const,
  authConfig: ['auth-config'] as const,
  vouchers: (productId?: string) => ['vouchers', productId] as const,
  me: ['me'] as const,
  eligibility: (productId: string) => ['review-eligibility', productId] as const,
  landing: (slug: string) => ['landing', slug] as const,
  events: ['events'] as const,
  banners: ['banners'] as const,
  orders: ['orders'] as const,
}

export const useProducts = (categoryId?: string) =>
  useQuery({ queryKey: qk.products(categoryId), queryFn: () => getProducts({ categoryId }) })

export const useProduct = (slug: string, opts: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: qk.product(slug), queryFn: () => getProductBySlug(slug), retry: false, placeholderData: keepPreviousData, enabled: opts.enabled ?? true })

export const useProductNeighbors = (slug: string) =>
  useQuery({ queryKey: qk.neighbors(slug), queryFn: () => getProductNeighbors(slug), placeholderData: keepPreviousData })

export const useKolReviews = (productId?: string) =>
  useQuery({ queryKey: qk.kolReviews(productId!), queryFn: () => getKolReviews(productId!), enabled: !!productId })

export const useKolFeed = () => useQuery({ queryKey: qk.kolFeed, queryFn: getKolFeed })

export const useProductReviews = (productId: string | undefined, sort: ReviewSort) => {
  // the viewer's likes are part of the response
  const token = useSession((s) => s.token)
  return useQuery({
    queryKey: [...qk.reviews(productId!, sort), token],
    queryFn: () => getProductReviews(productId!, sort),
    enabled: !!productId,
    placeholderData: keepPreviousData,
  })
}

export function useReviewEligibility(productId?: string) {
  const token = useSession((s) => s.token)
  return useQuery({ queryKey: [...qk.eligibility(productId!), token], queryFn: () => getReviewEligibility(productId!), enabled: !!productId })
}

export const useLanding = (slug: string) => useQuery({ queryKey: qk.landing(slug), queryFn: () => getLanding(slug), retry: false })

export const useActiveEvents = () => useQuery({ queryKey: qk.events, queryFn: getActiveEvents, staleTime: 5 * 60_000 })

export const useRatingSummary = (productId?: string) =>
  useQuery({ queryKey: qk.ratingSummary(productId!), queryFn: () => getRatingSummary(productId!), enabled: !!productId })

export const useProductFaqs = (productId?: string) =>
  useQuery({ queryKey: qk.faqs(productId!), queryFn: () => getProductFaqs(productId!), enabled: !!productId })

export const useRelatedProducts = (productId?: string) =>
  useQuery({ queryKey: qk.related(productId!), queryFn: () => getRelatedProducts(productId!), enabled: !!productId })

export const useBoughtTogether = (productId?: string) =>
  useQuery({ queryKey: qk.boughtTogether(productId!), queryFn: () => getBoughtTogether(productId!), enabled: !!productId })

export const useRecommendedForYou = () => useQuery({ queryKey: qk.forYou, queryFn: getRecommendedForYou })

export const useCategories = () =>
  useQuery({ queryKey: qk.categories, queryFn: getCategories, staleTime: Infinity })

export const useStories = () => useQuery({ queryKey: qk.stories, queryFn: getStories, staleTime: Infinity })

export const useSearch = (q: string) =>
  useQuery({
    queryKey: qk.search(q.trim()),
    queryFn: () => searchCatalog(q),
    enabled: q.trim().length > 0,
    placeholderData: keepPreviousData,
  })

export const useTrendingSearches = () =>
  useQuery({ queryKey: qk.trending, queryFn: getTrendingSearches, staleTime: Infinity })

export const useProductsByIds = (ids: string[]) =>
  useQuery({ queryKey: qk.byIds(ids), queryFn: () => getProductsByIds(ids), placeholderData: keepPreviousData })

export const useCommunityFeed = () => useQuery({ queryKey: qk.community, queryFn: getCommunityFeed })

export const useVouchers = (productId?: string) => useQuery({ queryKey: qk.vouchers(productId), queryFn: () => getVouchers(productId) })

export const useNews = (limit?: number) => useQuery({ queryKey: qk.news(limit), queryFn: () => getNews(limit) })
export const useNewsArticle = (slug: string) => useQuery({ queryKey: qk.newsArticle(slug), queryFn: () => getNewsArticle(slug), retry: false })
export const useSettings = () => useQuery({ queryKey: qk.settings, queryFn: getSettings, staleTime: 10 * 60_000 })
export const useAuthConfig = () => useQuery({ queryKey: qk.authConfig, queryFn: getAuthConfig, staleTime: Infinity })

/** Signed-in customer (refreshed from the server; null when signed out). */
export function useCurrentUser() {
  const token = useSession((s) => s.token)
  const cached = useSession((s) => s.user)
  return useQuery({ queryKey: [...qk.me, token], queryFn: getCurrentUser, enabled: !!token, initialData: cached ?? undefined, staleTime: 60_000 })
}

export function useMyOrders() {
  const token = useSession((s) => s.token)
  return useQuery({ queryKey: [...qk.orders, token], queryFn: getMyOrders, enabled: !!token })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orders }),
  })
}

/** Warm the cache for a product (used before swipe navigation and on card hover). */
export function usePrefetchProduct() {
  const qc = useQueryClient()
  return (slug: string) =>
    qc.prefetchQuery({ queryKey: qk.product(slug), queryFn: () => getProductBySlug(slug), staleTime: 60_000 })
}

export const useBanners = () => useQuery({ queryKey: qk.banners, queryFn: getBanners, staleTime: 5 * 60_000 })
