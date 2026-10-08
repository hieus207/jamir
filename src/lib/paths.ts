/** SEO-friendly Vietnamese URLs (old /product, /news, /lp links redirect here). */
export const paths = {
  product: (slug: string) => `/san-pham/${slug}`,
  news: '/tin-tuc',
  article: (slug: string) => `/tin-tuc/${slug}`,
  landing: (slug: string) => `/uu-dai/${slug}`,
}
