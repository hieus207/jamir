import { Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/domain'
import { scrollToSection } from './ProductVideo'
import { ProductRating } from './ProductRating'

/** Badges, name, rating line, description and feature tags. */
export function ProductInfo({ product, className, compact, headingLevel = 'h1' }: { product: Product; className?: string; compact?: boolean
  /** only one h1 per page (the desktop copy of the panel uses h2) */
  headingLevel?: 'h1' | 'h2'
}) {
  const Heading = headingLevel
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="gradient" size="md" className="rounded-md">
          {product.video.episode}
        </Badge>
        {product.highlight && (
          <span className="flex items-center gap-1 text-sm font-semibold text-orange-700">
            <Flame className="size-4 fill-orange-500 text-orange-500" aria-hidden="true" />
            {product.highlight}
          </span>
        )}
      </div>
      <Heading className={cn('font-extrabold tracking-tight text-ink', compact ? 'text-2xl' : 'text-[26px] leading-tight md:text-[30px]')}>
        {product.name}
      </Heading>
      <ProductRating
        rating={product.rating}
        reviewCount={product.reviewCount}
        soldCount={product.soldCount}
        onReviewsClick={() => scrollToSection('reviews')}
      />
      {!compact && <p className="text-sm leading-relaxed text-muted">{product.shortDescription}</p>}
      <ul className="flex flex-wrap gap-1.5" aria-label="Tính năng nổi bật">
        {product.featureTags.map((t) => (
          <li key={t}>
            <Badge variant="neutral" size="lg" className="rounded-lg font-medium">
              {t}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
