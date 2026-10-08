import { ArrowLeft, Newspaper } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { StateBlock } from '@/components/jamir/layout/PageStates'
import { RecommendationCard } from '@/components/jamir/recommendation/RecommendationCard'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNewsArticle, useProduct } from '@/hooks/queries'
import { toSummary } from '@/lib/product'

const dateFmt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' })

export default function NewsArticlePage() {
  const { slug = '' } = useParams()
  const { data: a, isPending, isError } = useNewsArticle(slug)
  const { data: product } = useProduct(a?.productSlug ?? '', { enabled: !!a?.productSlug })

  useEffect(() => {
    if (a) document.title = `${a.title} | Tin tức JAMIR`
  }, [a])

  if (isPending)
    return (
      <div className="container-page flex max-w-3xl flex-col gap-4 pt-6 pb-10">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="aspect-video rounded-card" />
        <Skeleton className="h-40" />
      </div>
    )
  if (isError || !a)
    return (
      <StateBlock
        icon={Newspaper}
        title="Không tìm thấy bài viết"
        className="min-h-[50vh] justify-center"
        action={
          <Link to="/tin-tuc" className={buttonVariants({ variant: 'secondary' })}>
            Xem tin tức khác
          </Link>
        }
      />
    )

  return (
    <article className="container-page grid max-w-5xl gap-8 pt-4 pb-12 md:pt-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex min-w-0 flex-col gap-5">
        <Link to="/tin-tuc" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Tin tức
        </Link>
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {a.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
          <h1 className="text-2xl leading-tight font-extrabold tracking-tight md:text-4xl">{a.title}</h1>
          <p className="text-sm text-muted">
            {a.author} · <time dateTime={a.publishedAt}>{dateFmt.format(new Date(a.publishedAt))}</time>
          </p>
        </header>
        {a.cover && <img src={a.cover} alt="" className="aspect-video w-full rounded-card object-cover" />}
        <p className="text-lg leading-relaxed font-medium text-ink-soft">{a.excerpt}</p>
        <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-soft">
          {a.content
            .split(/\n\s*\n/)
            .filter(Boolean)
            .map((para, i) => (
              <p key={i}>{para}</p>
            ))}
        </div>
      </div>
      {product && (
        <aside className="lg:pt-24">
          <p className="mb-2 text-sm font-bold">Sản phẩm trong bài</p>
          <div className="max-w-[240px]">
            <RecommendationCard product={toSummary(product)} />
          </div>
        </aside>
      )}
    </article>
  )
}
