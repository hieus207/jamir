import { motion } from 'motion/react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ProductSummary } from '@/types/domain'
import { RecommendationCard } from './RecommendationCard'

export function ProductGrid({
  products,
  loading,
  className,
}: {
  products?: ProductSummary[]
  loading?: boolean
  className?: string
}) {
  const grid = cn('grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5', className)
  if (loading)
    return (
      <div className={grid} aria-busy="true">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-card border border-line/70 bg-surface p-0">
            <Skeleton className="aspect-square rounded-t-card rounded-b-none" />
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    )
  return (
    <>
    <h2 className="sr-only">Danh sách sản phẩm</h2>
    <ul className={grid}>
      {products?.map((p, i) => (
        <motion.li
          key={p.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(i, 10) * 0.03 }}
        >
          <RecommendationCard product={p} />
        </motion.li>
      ))}
    </ul>
    </>
  )
}
