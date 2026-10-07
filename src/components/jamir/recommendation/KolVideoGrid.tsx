import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { KolReview } from '@/types/domain'
import { KolReviewCard } from '../review/KolReviewCard'
import { KolVideoViewer } from '../review/KolVideoViewer'

export function KolVideoGrid({ videos, loading, className }: { videos?: KolReview[]; loading?: boolean; className?: string }) {
  const [active, setActive] = useState<KolReview | null>(null)
  const grid = cn('grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)
  return (
    <>
      {loading ? (
        <div className={grid}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-video rounded-[14px]" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-8 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <ul className={grid}>
          {videos?.map((v) => (
            <li key={v.id}>
              <KolReviewCard review={v} onOpen={() => setActive(v)} />
            </li>
          ))}
        </ul>
      )}
      <KolVideoViewer review={active} playlist={videos ?? []} onChange={setActive} onClose={() => setActive(null)} />
    </>
  )
}
