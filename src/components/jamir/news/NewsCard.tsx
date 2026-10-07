import { ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router'
import { NEWS_LABELS } from '@/lib/newsLabels'
import { cn } from '@/lib/utils'
import type { NewsArticle } from '@/types/domain'

const dateFmt = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function NewsLabels({ article, className }: { article: NewsArticle; className?: string }) {
  if (!article.labels?.length) return null
  return (
    <span className={cn('flex flex-wrap gap-1', className)}>
      {article.labels.map((l) => {
        const meta = NEWS_LABELS[l]
        if (!meta) return null
        return (
          <span key={l} className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold shadow-sm', meta.className)}>
            <span aria-hidden="true">{meta.icon}</span>
            {meta.text}
          </span>
        )
      })}
    </span>
  )
}

export function NewsCard({ article, featured, className }: { article: NewsArticle; featured?: boolean; className?: string }) {
  if (featured) return <FeaturedNewsCard article={article} className={className} />
  return (
    <article
      className={cn(
        'group relative flex flex-row overflow-hidden rounded-card border border-line/70 bg-surface transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:flex-col',
        className,
      )}
    >
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden bg-line-soft sm:aspect-[16/10] sm:w-auto">
        <img src={article.cover} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <NewsLabels article={article} className="absolute top-2 left-2 hidden sm:flex" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 md:p-4">
        <NewsLabels article={article} className="sm:hidden" />
        <time dateTime={article.publishedAt} className="text-xs text-muted">
          {dateFmt.format(new Date(article.publishedAt))}
        </time>
        <h3 className="line-clamp-2 text-sm leading-snug font-bold text-ink md:text-[15px]">
          <Link to={`/news/${article.slug}`} className="after:absolute after:inset-0 hover:text-brand-700">
            {article.title}
          </Link>
        </h3>
        <p className="line-clamp-2 hidden text-sm text-muted sm:block">{article.excerpt}</p>
      </div>
    </article>
  )
}

/** Big cover card: priority article (or the newest). */
function FeaturedNewsCard({ article, className }: { article: NewsArticle; className?: string }) {
  return (
    <article
      className={cn(
        'group relative isolate flex min-h-[360px] flex-col justify-end overflow-hidden rounded-[20px] bg-ink text-white shadow-lift ring-2 ring-transparent transition-[box-shadow] duration-300 hover:ring-brand-400 md:row-span-2 md:min-h-[460px]',
        className,
      )}
    >
      <img src={article.cover} alt="" className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2.5 py-1 text-xs font-extrabold text-ink shadow-lg">
          <Star className="size-3.5 fill-current" aria-hidden="true" />
          Nổi bật
        </span>
        <NewsLabels article={article} />
      </div>
      <div className="flex flex-col gap-2 p-5 md:p-7">
        <time dateTime={article.publishedAt} className="text-xs text-white/70">
          {dateFmt.format(new Date(article.publishedAt))}
        </time>
        <h3 className="line-clamp-3 text-xl leading-tight font-extrabold md:text-3xl">
          <Link to={`/news/${article.slug}`} className="after:absolute after:inset-0">
            {article.title}
          </Link>
        </h3>
        <p className="line-clamp-2 max-w-2xl text-sm text-white/80 md:text-base">{article.excerpt}</p>
        <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink transition-transform duration-200 group-hover:translate-x-1">
          Đọc ngay <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}
