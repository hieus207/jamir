import { useRelatedProducts, useSettings } from '@/hooks/queries'
import { RecommendationSection } from '../recommendation/RecommendationSection'

export function RelatedProducts({ productId, className }: { productId: string; className?: string }) {
  const { data, isPending } = useRelatedProducts(productId)
  // settings.json → relatedLabels (default: on, at most 2)
  const cfg = { enabled: true, max: 2, ...useSettings().data?.relatedLabels }
  return <RecommendationSection title="Sản phẩm" accent="liên quan" products={data} loading={isPending} columns={4} labelLimit={cfg.enabled ? cfg.max : 0} className={className} />
}
