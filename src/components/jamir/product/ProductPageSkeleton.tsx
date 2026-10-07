import { Skeleton } from '@/components/ui/skeleton'

export function ProductPageSkeleton() {
  return (
    <div className="container-page pt-3 pb-28 md:pt-5" role="status" aria-label="Đang tải sản phẩm">
      <Skeleton className="mb-3 h-6 w-40" />
      <div className="mb-5 flex gap-2.5 overflow-hidden">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/3] w-[84px] shrink-0 rounded-[12px] md:w-[92px]" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_372px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-3">
          <Skeleton className="-mx-4 aspect-video rounded-none md:mx-0 md:rounded-card" />
          <div className="flex gap-2.5 overflow-hidden">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="aspect-video w-[112px] shrink-0 rounded-[10px] md:flex-1" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-card border border-line/70 bg-surface p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-16" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-12" />
          <Skeleton className="h-[52px]" />
        </div>
      </div>
    </div>
  )
}
