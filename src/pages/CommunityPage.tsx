import { ArrowRight, Heart, Images, Play, Quote, Star, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Stars } from '@/components/jamir/product/ProductRating'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { useCommunityFeed, useSettings } from '@/hooks/queries'
import { useSeo } from '@/hooks/useSeo'
import { paths } from '@/lib/paths'
import { cn, formatPrice, formatRelative } from '@/lib/utils'
import type { CommunityPost } from '@/services'
import { useIsWishlisted, useWishlistStore } from '@/stores/wishlistStore'

/** Feelings people write about, matched in the review text. */
const MOODS: { key: string; label: string; re: RegExp; tone: string }[] = [
  { key: 'pin', label: '🔋 Pin trâu', re: /pin|sạc/i, tone: 'bg-emerald-50 text-emerald-700' },
  { key: 'am', label: '🎵 Nghe đã', re: /âm|bass|nhạc|loa|nghe/i, tone: 'bg-violet-50 text-violet-700' },
  { key: 'yen', label: '🤫 Yên tĩnh', re: /chống ồn|anc|ồn/i, tone: 'bg-sky-50 text-sky-700' },
  { key: 'em', label: '☁️ Êm ái', re: /êm|thoải mái|nhẹ/i, tone: 'bg-indigo-50 text-indigo-700' },
  { key: 'dep', label: '✨ Đẹp mê', re: /đẹp|xinh|sang|màu/i, tone: 'bg-pink-50 text-pink-700' },
  { key: 'tien', label: '💸 Đáng tiền', re: /đáng tiền|tầm giá|hợp lý|rẻ/i, tone: 'bg-amber-50 text-amber-700' },
  { key: 'ship', label: '🚀 Giao nhanh', re: /giao|ship|đóng gói/i, tone: 'bg-orange-50 text-orange-700' },
  { key: 'gon', label: '🎒 Mang đi tiện', re: /gọn|bỏ túi|du lịch|balo|mang đi/i, tone: 'bg-teal-50 text-teal-700' },
]
const moodsOf = (text: string) => MOODS.filter((m) => m.re.test(text))
/** filter chips shown at the top (cards carry no tags) */
const FILTERS = ['pin', 'am', 'tien', 'gon']

/** ISO week number + Monday of that week. */
function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t.getTime() - y0.getTime()) / 86400_000 + 1) / 7)
}
const monday = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}
const dm = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`

interface Week {
  start: Date
  no: number
  posts: CommunityPost[]
  top: string[]
}

/** Group by week; a week with a single post joins the next older one so every shelf has 2–4. */
function groupWeeks(posts: CommunityPost[]): Week[] {
  const map = new Map<number, CommunityPost[]>()
  for (const p of posts) {
    const k = monday(new Date(p.createdAt)).getTime()
    map.set(k, [...(map.get(k) ?? []), p])
  }
  const raw = [...map.entries()].sort((a, b) => b[0] - a[0])
  const out: { start: number; posts: CommunityPost[] }[] = []
  let carry: CommunityPost[] = []
  for (const [k, list] of raw) {
    const all = [...carry, ...list]
    if (all.length < 2) {
      carry = all
      continue
    }
    out.push({ start: carry.length && out.length === 0 ? k : k, posts: all })
    carry = []
  }
  if (carry.length && out.length) out[out.length - 1]!.posts.push(...carry)
  else if (carry.length) out.push({ start: raw[raw.length - 1]![0], posts: carry })
  return out.map(({ start, posts }) => {
    const counts = new Map<string, number>()
    posts.forEach((p) => moodsOf(p.content).forEach((m) => counts.set(m.label, (counts.get(m.label) ?? 0) + 1)))
    return { start: new Date(start), no: isoWeek(new Date(start)), posts, top: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l) }
  })
}

/**
 * Cộng đồng — Netflix hero (moment of the week), YouTube mood chips, then one
 * shelf per week (big week number, newest first) of the 2–4 best Facebook-style posts.
 * The heart saves the product to Yêu thích, like on Khám phá.
 */
export default function CommunityPage() {
  const { data, isPending } = useCommunityFeed()
  const { data: settings } = useSettings()
  const [mood, setMood] = useState<string | null>(null)
  useSeo({
    title: 'Cộng đồng JAMIR | Cảm nhận thật mỗi tuần',
    description: 'Ảnh, video và cảm nhận thật từ người dùng JAMIR, cập nhật mỗi tuần: họ mang đi đâu, thích điều gì và nói gì với nhau.',
    path: '/cong-dong',
  })

  const filtered = useMemo(() => (data ?? []).filter((p) => !mood || MOODS.find((m) => m.key === mood)!.re.test(p.content)), [data, mood])
  const weeks = useMemo(() => groupWeeks(filtered), [filtered])
  const hero = useMemo(() => {
    const newest = weeks[0]?.posts ?? []
    return [...newest].sort((a, b) => Number(b.media.length > 0) - Number(a.media.length > 0) || b.rating - a.rating || b.helpfulCount - a.helpfulCount)[0]
  }, [weeks])
  const avg = data?.length ? data.reduce((s, p) => s + p.rating, 0) / data.length : 0

  return (
    <div className="-mb-2 bg-[#f3fbfa] [background-image:radial-gradient(circle_at_8%_0%,rgba(45,212,191,0.18),transparent_42%),radial-gradient(circle_at_92%_25%,rgba(56,189,248,0.16),transparent_40%)]">
    <div className="container-page flex flex-col gap-8 pt-4 pb-10 md:pt-6">
      <h1 className="sr-only">Cộng đồng JAMIR: cảm nhận thật từ người dùng, cập nhật mỗi tuần</h1>

      {/* Netflix-style hero: moment of the week */}
      {isPending ? (
        <Skeleton className="h-[360px] rounded-[24px]" />
      ) : (
        hero && <HeroMoment post={hero} week={weeks[0]!} avg={avg} total={data?.length ?? 0} zalo={settings?.community.zaloGroup} facebook={settings?.community.facebook} />
      )}

      {/* YouTube-style chips */}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4" role="toolbar" aria-label="Lọc theo cảm xúc">
        <Chip active={!mood} onClick={() => setMood(null)}>
          Tất cả
        </Chip>
        {MOODS.filter((m) => FILTERS.includes(m.key)).map((m) => (
          <Chip key={m.key} active={mood === m.key} onClick={() => setMood(mood === m.key ? null : m.key)}>
            {m.label}
          </Chip>
        ))}
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[420px] rounded-[18px]" />
          ))}
        </div>
      ) : !weeks.length ? (
        <p className="py-16 text-center text-muted">Chưa có khoảnh khắc nào với cảm xúc này.</p>
      ) : (
        weeks.map((w, i) => <WeekShelf key={w.start.getTime()} week={w} newest={i === 0} />)
      )}
    </div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'shrink-0 cursor-pointer rounded-[10px] px-3.5 py-2 text-sm font-semibold transition-colors',
        active ? 'bg-[#0d9488] text-white shadow-[0_6px_16px_-6px_rgba(13,148,136,0.55)]' : 'bg-white text-ink-soft ring-1 ring-[#cdeee9] hover:bg-[#e6faf6]',
      )}
    >
      {children}
    </button>
  )
}

function HeroMoment({ post: p, week, avg, total, zalo, facebook }: { post: CommunityPost; week: Week; avg: number; total: number; zalo?: string; facebook?: string }) {
  const cover = p.media[0]?.thumbnail || p.productThumb
  return (
    <section aria-label="Khoảnh khắc của tuần" className="relative overflow-hidden rounded-[28px] border border-[#cdeee9] bg-gradient-to-br from-white via-[#ecfdf9] to-[#e0f2fe] shadow-[0_20px_60px_-30px_rgba(13,148,136,0.45)]">
      <span aria-hidden="true" className="absolute -top-24 -left-16 size-72 rounded-full bg-[#5eead4]/30 blur-3xl" />
      <span aria-hidden="true" className="absolute -right-10 -bottom-24 size-72 rounded-full bg-[#7dd3fc]/30 blur-3xl" />
      <div className="relative grid items-center gap-6 p-6 md:grid-cols-[1.25fr_1fr] md:gap-10 md:p-10">
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#0f766e] uppercase">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#2dd4bf] motion-reduce:hidden" />
              <span className="relative size-2 rounded-full bg-[#14b8a6]" />
            </span>
            Khoảnh khắc của tuần {week.no}
          </p>
          <blockquote className="text-2xl leading-snug font-extrabold text-ink md:text-[32px]">“{p.content}”</blockquote>
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            {p.anonymous ? <span className="size-9 rounded-full bg-[#cdeee9]" /> : <Avatar src={p.user.avatar || undefined} name={p.user.name} className="size-9 ring-2 ring-white" />}
            <span className="font-semibold text-ink">{p.user.name}</span>
            <Stars value={p.rating} size="size-4" />
            <span className="text-muted">{formatRelative(p.createdAt)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <Link to={paths.product(p.productSlug)} className="flex items-center gap-2 rounded-full bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(13,148,136,0.8)] transition-transform hover:scale-[1.03]">
              Xem {p.productName} <ArrowRight className="size-4" />
            </Link>
            <WishHeart productId={p.productId} name={p.productName} />
            {zalo && (
              <a href={zalo} target="_blank" rel="noreferrer" className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#0068ff] ring-1 ring-[#cdeee9] hover:bg-[#f2f7ff]">
                Vào nhóm Zalo
              </a>
            )}
            {facebook && (
              <a href={facebook} target="_blank" rel="noreferrer" className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#1877f2] ring-1 ring-[#cdeee9] hover:bg-[#f2f7ff]">
                Nhóm Facebook
              </a>
            )}
          </div>
          {total > 0 && (
            <p className="text-xs text-muted">
              {total} cảm nhận thật · <Star className="inline size-3.5 fill-star text-star" /> {avg.toFixed(1)} điểm trung bình
            </p>
          )}
        </div>
        {cover && (
          <div className="relative mx-auto w-full max-w-[380px] md:rotate-2">
            <img src={cover} alt={`Ảnh ${p.user.name} chia sẻ về ${p.productName}`} className="aspect-[4/3] w-full rounded-[24px] border-[6px] border-white object-cover shadow-[0_24px_50px_-24px_rgba(15,118,110,0.6)]" />
            <span className="absolute -bottom-3 -left-3 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0f766e] shadow-md">💬 Tuần {week.no}</span>
          </div>
        )}
      </div>
    </section>
  )
}

function WeekShelf({ week: w, newest }: { week: Week; newest: boolean }) {
  const end = new Date(w.start)
  end.setDate(end.getDate() + 6)
  // curated: the 2–4 best moments of the week (photos / video first, then most helpful, then rating)
  const shown = [...w.posts].sort((a, b) => Number(b.media.length > 0) - Number(a.media.length > 0) || b.helpfulCount - a.helpfulCount || b.rating - a.rating).slice(0, 4)
  return (
    <section aria-labelledby={`week-${w.no}`} className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-14 shrink-0 flex-col items-center justify-center rounded-[16px] leading-none font-extrabold md:size-16',
            newest ? 'bg-gradient-to-br from-[#2dd4bf] to-[#0ea5e9] text-white shadow-[0_10px_24px_-8px_rgba(14,165,233,0.45)]' : 'bg-white text-[#0f766e] ring-1 ring-[#cdeee9]',
          )}
        >
          <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">Tuần</span>
          <span className="text-2xl md:text-[28px]">{w.no}</span>
        </span>
        <div className="min-w-0">
          <h2 id={`week-${w.no}`} className="flex flex-wrap items-center gap-2 text-xl font-extrabold tracking-tight md:text-2xl">
            Tuần {w.no} <span className="text-base font-semibold text-muted">· {dm(w.start)} – {dm(end)}</span>
            {newest && (
              <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0d9488] to-[#0ea5e9] px-2.5 py-0.5 text-xs font-bold text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-white" /> MỚI NHẤT
              </span>
            )}
          </h2>
          {w.top.length > 0 && <p className="text-sm text-muted">Mọi người đang nói nhiều về: {w.top.join(' · ')}</p>}
        </div>
      </header>
      <div className={cn('grid gap-4 sm:grid-cols-2', shown.length >= 3 && 'lg:grid-cols-3', shown.length >= 4 && 'xl:grid-cols-4')}>
        {shown.map((p) => (
          <MomentCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  )
}

function MomentCard({ post: p }: { post: CommunityPost }) {
  const cover = p.media[0]
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-[#cdeee9] bg-white shadow-[0_2px_14px_-6px_rgba(13,148,136,0.16)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      {/* Facebook-style post header */}
      <header className="flex items-center gap-2.5 px-4 pt-4">
        {p.anonymous ? (
          <span className="flex size-10 items-center justify-center rounded-full bg-line-soft text-subtle">
            <UserRound className="size-5" />
          </span>
        ) : (
          <Avatar src={p.user.avatar || undefined} name={p.user.name} className="size-10" />
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">{p.user.name}</p>
          <p className="text-xs text-subtle">
            <time dateTime={p.createdAt}>{formatRelative(p.createdAt)}</time>
          </p>
        </div>
        <Stars value={p.rating} size="size-3.5" />
      </header>

      <p className="line-clamp-4 px-4 pt-3 text-[15px] leading-relaxed text-ink">{p.content}</p>

      {/* YouTube-style media thumbnail */}
      <Link to={`${paths.product(p.productSlug)}#reviews`} className="relative mx-4 mt-3 mb-3 block aspect-video overflow-hidden rounded-[12px] bg-line-soft">
        {cover ? (
          <>
            <img src={cover.thumbnail} alt={`Ảnh ${p.user.name} chia sẻ về ${p.productName}`} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 hover:scale-105" />
            {cover.type === 'video' && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-black/55 backdrop-blur">
                  <Play className="size-5 translate-x-0.5 fill-white text-white" />
                </span>
              </span>
            )}
            {p.media.length > 1 && (
              <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                <Images className="size-3.5" /> {p.media.length}
              </span>
            )}
          </>
        ) : (
          <span className="absolute inset-0 flex items-center gap-3 bg-gradient-to-br from-[#e6faf6] to-[#e0f2fe] p-4">
            {p.productThumb && <img src={p.productThumb} alt="" className="h-full max-h-24 rounded-[10px] object-cover" />}
            <Quote className="size-8 shrink-0 text-[#5eead4]" aria-hidden="true" />
          </span>
        )}
      </Link>


      {/* product + reactions */}
      <footer className="mt-auto flex items-center gap-2.5 border-t border-[#e3f4f1] p-3">
        <Link to={paths.product(p.productSlug)} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[10px] p-1 transition-colors hover:bg-[#e6faf6]">
          {p.productThumb && <img src={p.productThumb} alt="" className="size-9 shrink-0 rounded-[8px] object-cover" />}
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-xs font-semibold">{p.productName}</span>
            <span className="block text-xs font-bold text-[#0f766e]">{formatPrice(p.productPrice)}</span>
          </span>
        </Link>
        <WishHeart productId={p.productId} name={p.productName} />
      </footer>
    </article>
  )
}

/** Same heart as Khám phá: saves the product to Yêu thích. */
function WishHeart({ productId, name, variant }: { productId: string; name: string; variant?: 'hero' }) {
  const saved = useIsWishlisted(productId)
  const toggle = useWishlistStore((s) => s.toggle)
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Bỏ ${name} khỏi Yêu thích` : `Thêm ${name} vào Yêu thích`}
      onClick={() => {
        const added = toggle(productId)
        toast.success(added ? 'Đã thêm vào Yêu thích' : 'Đã bỏ khỏi Yêu thích', name)
      }}
      className={cn(
        'flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-[background-color,transform] active:scale-90',
        variant === 'hero' ? 'size-11' : 'size-9',
        saved ? 'bg-[#ff4d6d] text-white' : variant === 'hero' ? 'bg-white/15 text-white backdrop-blur hover:bg-white/25' : 'bg-[#e6faf6] text-[#0f766e] hover:bg-[#e0f2fe] hover:text-[#ff4d6d]',
      )}
    >
      <Heart className={cn(variant === 'hero' ? 'size-5' : 'size-[18px]', saved && 'fill-white')} />
    </button>
  )
}
