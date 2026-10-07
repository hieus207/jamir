import { useRelatedProducts } from '@/hooks/queries'
import { RecommendationSection } from '../recommendation/RecommendationSection'

export function RelatedProducts({ productId, className }: { productId: string; className?: string }) {
  const { data, isPending } = useRelatedProducts(productId)
  return <RecommendationSection title="Sản phẩm liên quan" products={data} loading={isPending} className={className} />
}
