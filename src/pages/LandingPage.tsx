import { PackageX } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { PageFallback, StateBlock } from '@/components/jamir/layout/PageStates'
import { LandingCollage } from '@/components/jamir/street/LandingCollage'
import { LandingDesign } from '@/components/jamir/street/LandingDesign'
import { LandingFeed } from '@/components/jamir/street/LandingFeed'
import { LandingPoster } from '@/components/jamir/street/LandingPoster'
import { buttonVariants } from '@/components/ui/button'
import { useLanding } from '@/hooks/queries'
import { useSeo } from '@/hooks/useSeo'
import { paths } from '@/lib/paths'
import { useSelectionStore } from '@/stores/selectionStore'
import type { LandingPayload } from '@/types/domain'

/** Ad landing page (/uu-dai/:slug) — rendered in the theme chosen in the admin. */
export default function LandingPage() {
  const { slug = '' } = useParams()
  const { data, isPending, isError } = useLanding(slug)
  useSeo(data ? { title: `${data.page.headline.replace(/[*[\]]/g, '')} | JAMIR`, description: data.page.subheadline ?? data.product.shortDescription, path: paths.landing(data.page.slug), image: data.product.thumbnail } : null)

  if (isPending) return <PageFallback />
  if (isError || !data)
    return (
      <StateBlock
        icon={PackageX}
        className="min-h-[70vh] justify-center"
        title="Chương trình không còn"
        description="Ưu đãi có thể đã kết thúc. Xem các sản phẩm khác của JAMIR nhé."
        action={
          <Link to="/" className={buttonVariants({ variant: 'secondary' })}>
            Về trang chủ
          </Link>
        }
      />
    )
  return <LandingView data={data} />
}

/**
 * Renders a landing page in its theme (live page and admin preview).
 * Themes: collage (street poster), poster (one screen), feed (TikTok-style scroll).
 * Older saved values map to the closest one: street → collage, default → feed.
 */
export function LandingView({ data }: { data: LandingPayload }) {
  const reset = useSelectionStore((s) => s.reset)
  const productId = data.product.id
  useEffect(() => {
    reset(data.product)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, reset])
  const theme = data.page.theme as string | undefined
  if (theme === 'design') return <LandingDesign data={data} />
  if (theme === 'poster') return <LandingPoster data={data} />
  if (theme === 'feed' || theme === 'default') return <LandingFeed data={data} />
  return <LandingCollage data={data} />
}
