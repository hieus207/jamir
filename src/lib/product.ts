import type { Product, ProductSummary } from '@/types/domain'

export function toSummary(p: Product): ProductSummary {
  const { id, slug, name, categoryId, price, originalPrice, discount, rating, reviewCount, soldCount, stock, thumbnail, highlight, position } = p
  const c = p.colors[0] ?? { id: 'default', name: 'Mặc định', hex: '#E5E7EB' }
  return {
    id, slug, name, categoryId, price, originalPrice, discount, rating, reviewCount, soldCount, stock, thumbnail, highlight, position,
    defaultColor: { id: c.id, name: c.name, hex: c.hex },
  }
}
