import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { KolReview } from '@/types/domain'
import { KolReviewCard } from '../review/KolReviewCard'
import { KolVideoViewer } from '../review/KolVideoViewer'

export function KolVideoGrid({ videos, loading, className }: { videos?: KolReview[]; loading?: boolean; className?: string }) {
  const [active, setActive] = useState<KolReview | null>(null)
  const grid = cn('columns-2 gap-3 sm:columns-3 md:gap-4 lg:columns-4', className)
  return (
    <>
      {loading ? (
        <div className={grid}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="mb-5 flex break-inside-avoid flex-col gap-2">
              <Skeleton className={i % 2 ? 'aspect-[9/16] rounded-[14px]' : 'aspect-video rounded-[14px]'} />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-8 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
        <h2 className="sr-only">Danh sách video</h2>
        <ul className={grid}>
          {videos?.map((v) => (
            <li key={v.id} className="mb-5 break-inside-avoid">
              <KolReviewCard review={v} onOpen={() => setActive(v)} />
            </li>
          ))}
        </ul>
        </>
      )}
      <KolVideoViewer review={active} playlist={videos ?? []} onChange={setActive} onClose={() => setActive(null)} />
    </>
  )
}
