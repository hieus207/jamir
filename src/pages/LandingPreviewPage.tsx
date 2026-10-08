import { useEffect, useMemo, useState } from 'react'
import { useKolReviews, useProduct, useProductReviews, useProducts } from '@/hooks/queries'
import type { CustomerReview, KolReview, LandingPage, LandingPayload } from '@/types/domain'
import { PREVIEW_MESSAGE } from '@/lib/preview'
import { LandingView } from './LandingPage'


/** Same picks as the server (/landing/:slug): featured video first, chosen reviews first. */
function pick(page: LandingPage, kol: KolReview[], reviews: CustomerReview[]) {
  const chosen = (page.reviewIds ?? []).map((id) => reviews.find((r) => r.id === id)).filter((r): r is CustomerReview => !!r)
  const best = reviews
    .filter((r) => !chosen.includes(r))
    .sort((a, b) => b.rating - a.rating || Number(b.featured) - Number(a.featured) || b.media.length - a.media.length || b.helpfulCount - a.helpfulCount)
  const videos = [...kol].sort((a, b) => Number(b.id === page.kolReviewId) - Number(a.id === page.kolReviewId) || b.views - a.views)
  return { reviews: [...chosen, ...best].slice(0, 3), kol: videos.slice(0, 4) }
}

/**
 * /preview/landing — rendered inside the admin's iframe. Receives the draft
 * landing page by postMessage (same origin only) and shows it exactly as
 * shoppers will, with the product's real videos and reviews.
 */
export default function LandingPreviewPage() {
  const [page, setPage] = useState<LandingPage | null>(null)

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== PREVIEW_MESSAGE) return
      setPage(e.data.page as LandingPage)
    }
    window.addEventListener('message', onMessage)
    // tell the admin we're ready for the first draft
    window.parent.postMessage({ type: `${PREVIEW_MESSAGE}:ready` }, window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const { data: list } = useProducts()
  const slug = list?.find((p) => p.id === page?.productId)?.slug ?? ''
  const { data: product } = useProduct(slug, { enabled: !!slug })
  const { data: kol } = useKolReviews(product?.id)
  const { data: reviews } = useProductReviews(product?.id, 'featured')

  const payload = useMemo<LandingPayload | null>(() => {
    if (!page || !product || product.slug !== slug) return null
    const filled = { bullets: [], ctaText: 'Mua ngay', showReviews: true, ...(page as Partial<LandingPage>), headline: page.headline || 'Tiêu đề landing page' }  as LandingPage
    return { page: filled, product, ...pick(filled, kol ?? [], reviews ?? []) }
  }, [page, product, slug, kol, reviews])

  if (!page) return <Hint text="Đang chờ dữ liệu từ form…" />
  if (!page.productId) return <Hint text="Chọn sản phẩm để xem trước" />
  if (!payload) return <Hint text="Đang tải sản phẩm…" />
  return <LandingView data={payload} />
}

function Hint({ text }: { text: string }) {
  return <div className="flex min-h-dvh items-center justify-center bg-canvas p-6 text-center text-lg font-semibold text-muted">{text}</div>
}
