import { useEffect } from 'react'
import { PageHeader } from '@/components/jamir/layout/PageHeader'
import { KolVideoGrid } from '@/components/jamir/recommendation/KolVideoGrid'
import { useKolFeed } from '@/hooks/queries'

export default function ExplorePage() {
  const { data, isPending } = useKolFeed()
  useEffect(() => {
    document.title = 'Khám phá video — JAMIR'
  }, [])
  return (
    <div className="container-page flex flex-col gap-6 pt-4 pb-10 md:pt-6">
      <PageHeader title="Khám phá" description="Video review, mẹo & hướng dẫn từ KOL và khách hàng JAMIR" />
      <KolVideoGrid videos={data} loading={isPending} />
    </div>
  )
}
