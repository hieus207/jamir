import { Gift } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { formatCompact, formatPrice } from '@/lib/utils'
import { NEWS_LABEL_OPTIONS, NEWS_LABELS } from '@/lib/newsLabels'
import type { AdminCollection } from '@/services'
import type { NewsLabel, OrderStatus, ProductGift, Promotion } from '@/types/domain'
import { type FieldDef, useAdminList } from './fields'
import { EventPreview } from './EventPreview'
import { LandingPreview } from './LandingPreview'
import type { Rec, ResourceConfig } from './ResourcePanel'

const s = (v: unknown) => (v == null ? '' : String(v))
const dateFmt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
export const fmtDate = (iso: unknown) => (typeof iso === 'string' && iso ? dateFmt.format(new Date(iso)) : '—')

/** Thumbnail + title cell. */
function Thumb({ src, title, sub }: { src?: unknown; title: unknown; sub?: unknown }) {
  const url = s(src)
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {url ? (
        /\.(mp4|webm|mov)$/i.test(url) ? (
          <video src={url} muted className="size-10 shrink-0 rounded-[8px] bg-line-soft object-cover" />
        ) : (
          <img src={url} alt="" className="size-10 shrink-0 rounded-[8px] bg-line-soft object-cover" />
        )
      ) : (
        <span className="size-10 shrink-0 rounded-[8px] bg-line-soft" />
      )}
      <div className="min-w-0">
        <p className="line-clamp-2 font-semibold text-ink">{s(title)}</p>
        {!!sub && <p className="truncate text-xs text-muted">{s(sub)}</p>}
      </div>
    </div>
  )
}

/** Name of a referenced record (product, KOL…). */
function RefName({ collection, value, by = 'id', label = 'name' }: { collection: AdminCollection; value: unknown; by?: string; label?: string }) {
  const { data } = useAdminList(collection)
  const hit = data?.find((x) => (x as Rec)[by] === value)
  return <span className="text-ink-soft">{hit ? s((hit as Rec)[label]) : s(value) || '—'}</span>
}

const ASPECTS = ['9:16', '16:9', '1:1', '4:5'].map((v) => ({ value: v, label: v }))
const productRef = { collection: 'products' as const }
const productSlugRef = { collection: 'products' as const, valueKey: 'slug' }
const byPriority = (a: Rec, b: Rec) => Number(b.priority ?? 0) - Number(a.priority ?? 0)
const byNewest = (key: string) => (a: Rec, b: Rec) => s(b[key]).localeCompare(s(a[key]))

/* ------------------------------------------------------------------ */

const productFields: FieldDef[] = [
  { key: 'name', label: 'Tên sản phẩm', type: 'text', required: true, wide: true },
  { key: 'slug', label: 'Slug (URL)', type: 'text', help: 'Để trống để tự tạo từ tên' },
  { key: 'categoryId', label: 'Danh mục', type: 'ref', ref: { collection: 'categories' } },
  { key: 'price', label: 'Giá bán', type: 'number', required: true },
  { key: 'originalPrice', label: 'Giá gốc', type: 'number', help: 'Lớn hơn giá bán thì hiện % giảm' },
  { key: 'stock', label: 'Tồn kho', type: 'number' },
  { key: 'position', label: 'Thứ tự hiển thị', type: 'number' },
  { key: 'brand', label: 'Thương hiệu', type: 'text' },
  { key: 'highlight', label: 'Nhãn nổi bật', type: 'text', placeholder: 'Bán chạy, Mới…' },
  { key: 'thumbnail', label: 'Ảnh đại diện', type: 'media', wide: true },
  { key: 'shortDescription', label: 'Mô tả ngắn', type: 'textarea', wide: true },
  {
    key: 'aiSummary',
    label: 'Tóm tắt nhanh',
    type: 'textarea',
    wide: true,
    placeholder: 'Để trống: web tự ghép tóm tắt từ thông số',
    help: 'Hiện cạnh điểm đánh giá trong khối "Cảm nhận khách hàng". 2 câu ngắn là đẹp nhất.',
  },
  { key: 'featureTags', label: 'Tag tính năng', type: 'tags', wide: true },
  { key: 'gallery', label: 'Thư viện ảnh (URL)', type: 'tags', wide: true },
  {
    key: 'video',
    label: 'Video sản phẩm',
    type: 'video',
    wide: true,
    video: { source: 'video.source', src: 'video.src', embed: 'video.embedUrl', url: 'video.sourceUrl', aspect: 'video.aspectRatio' },
  },
  { key: 'video.poster', label: 'Ảnh bìa video', type: 'media', wide: true },
  {
    key: 'chapters',
    label: 'Chương video (Giới thiệu, Thiết kế, Hình ảnh 2K…)',
    type: 'chapters',
    wide: true,
    help: 'Mỗi chương là một mốc thời gian trong video sản phẩm, hiện thành dải ảnh dưới video.',
  },
  { key: 'video.episode', label: 'Nhãn tập (góc video)', type: 'text', placeholder: 'EP07' },
  {
    key: 'gifts',
    label: 'Quà tặng kèm',
    type: 'gifts',
    wide: true,
    help: 'Quà bị ẩn (biểu tượng mắt gạch) vẫn được lưu nhưng không hiện cho khách và không ghi vào đơn. Không có quà nào hiện thì mục "Quà tặng kèm" tự ẩn.',
  },
]

function GiftsCell({ gifts }: { gifts: unknown }) {
  const list = (Array.isArray(gifts) ? gifts : []) as ProductGift[]
  if (!list.length) return <span className="text-subtle">—</span>
  const shown = list.filter((g) => !g.hidden).length
  return (
    <Badge variant={shown ? 'soft' : 'neutral'}>
      <Gift />
      {shown}/{list.length} hiện
    </Badge>
  )
}

export const products: ResourceConfig = {
  collection: 'products',
  title: 'Sản phẩm',
  noun: 'sản phẩm',
  search: (r) => `${s(r.name)} ${s(r.slug)} ${s(r.id)}`,
  sort: (a, b) => Number(a.position ?? 0) - Number(b.position ?? 0),
  defaults: { brand: 'JAMIR', stock: 100, gifts: [], featureTags: [], gallery: [] },
  columns: [
    { label: 'Sản phẩm', render: (r) => <Thumb src={r.thumbnail} title={r.name} sub={r.slug} /> },
    { label: 'Danh mục', render: (r) => <RefName collection="categories" value={r.categoryId} /> },
    {
      label: 'Giá',
      render: (r) => (
        <div>
          <p className="font-semibold">{formatPrice(Number(r.price))}</p>
          {Number(r.originalPrice) > Number(r.price) && <p className="text-xs text-muted line-through">{formatPrice(Number(r.originalPrice))}</p>}
        </div>
      ),
    },
    { label: 'Kho / đã bán', render: (r) => `${s(r.stock)} / ${s(r.soldCount)}` },
    { label: 'Quà tặng', render: (r) => <GiftsCell gifts={r.gifts} /> },
  ],
  fields: productFields,
}

export const categories: ResourceConfig = {
  collection: 'categories',
  title: 'Danh mục',
  noun: 'danh mục',
  search: (r) => `${s(r.name)} ${s(r.slug)}`,
  defaults: { icon: 'package' },
  columns: [
    { label: 'Tên', render: (r) => <span className="font-semibold">{s(r.name)}</span> },
    { label: 'Slug', render: (r) => s(r.slug) },
    { label: 'Icon', render: (r) => s(r.icon) },
  ],
  fields: [
    { key: 'name', label: 'Tên danh mục', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'text', help: 'Để trống để tự tạo' },
    { key: 'icon', label: 'Icon (Lucide)', type: 'text', placeholder: 'headphones, speaker, cable…' },
  ],
}

export const stories: ResourceConfig = {
  collection: 'stories',
  title: 'Jamir Stories',
  noun: 'story',
  search: (r) => `${s(r.label)} ${s(r.productSlug)}`,
  sort: byPriority,
  toggle: { key: 'active', label: 'Hiển thị' },
  defaults: { active: true, hot: false },
  columns: [
    { label: 'Story', render: (r) => <Thumb src={r.thumbnail} title={r.label} /> },
    { label: 'Sản phẩm', render: (r) => (r.productSlug ? <RefName collection="products" value={r.productSlug} by="slug" /> : s(r.link) || '—') },
    { label: 'Ưu tiên', render: (r) => <span className="font-semibold">{s(r.priority)}</span> },
    { label: 'Hot', render: (r) => (r.hot ? <Badge variant="danger-soft">HOT</Badge> : '') },
  ],
  fields: [
    { key: 'label', label: 'Tiêu đề', type: 'text', required: true },
    { key: 'productSlug', label: 'Sản phẩm (story mở trang sản phẩm này)', type: 'ref', ref: productSlugRef, required: true },
    { key: 'priority', label: 'Độ ưu tiên', type: 'number', help: 'Số lớn hiện trước. Để trống thì xếp lên đầu' },
    { key: 'thumbnail', label: 'Ảnh thumbnail', type: 'media', required: true, wide: true },
    { key: 'gift.enabled', label: 'Hiện quà tặng kèm khi phát story', type: 'switch' },
    { key: 'gift.text', label: 'Nội dung quà tặng', type: 'text', placeholder: 'Tặng túi chống sốc trị giá 150K' },
    { key: 'gift.image', label: 'Ảnh quà tặng (không bắt buộc)', type: 'media', wide: true },
    { key: 'hot', label: 'Gắn nhãn HOT', type: 'switch' },
    { key: 'active', label: 'Đang hiển thị', type: 'switch' },
  ],
}

export const kols: ResourceConfig = {
  collection: 'kols',
  title: 'KOL / KOC',
  noun: 'KOL',
  search: (r) => `${s(r.name)} ${s(r.title)}`,
  defaults: { verified: true, followers: 0 },
  toggle: { key: 'verified', label: 'Xác minh' },
  columns: [
    { label: 'KOL', render: (r) => <Thumb src={r.avatar} title={r.name} sub={r.title} /> },
    { label: 'Người theo dõi', render: (r) => formatCompact(Number(r.followers) || 0) },
  ],
  fields: [
    { key: 'name', label: 'Tên', type: 'text', required: true },
    { key: 'title', label: 'Mô tả ngắn', type: 'text', placeholder: 'KOL Công nghệ' },
    { key: 'avatar', label: 'Ảnh đại diện', type: 'media', wide: true },
    { key: 'followers', label: 'Người theo dõi', type: 'number' },
    { key: 'verified', label: 'Đã xác minh', type: 'switch' },
  ],
}

export const kolReviews: ResourceConfig = {
  collection: 'kol-reviews',
  title: 'Video review KOL',
  noun: 'video',
  search: (r) => `${s(r.title)} ${s(r.productId)} ${s(r.kolId)}`,
  sort: byNewest('publishedAt'),
  defaults: () => ({ aspectRatio: '9:16', source: 'tiktok', publishedAt: new Date().toISOString(), views: 0, likes: 0, duration: 0 }),
  columns: [
    { label: 'Video', render: (r) => <Thumb src={r.thumbnail} title={r.title} sub={fmtDate(r.publishedAt)} /> },
    { label: 'KOL', render: (r) => <RefName collection="kols" value={r.kolId} /> },
    { label: 'Sản phẩm', render: (r) => <RefName collection="products" value={r.productId} /> },
    { label: 'Khung', render: (r) => <Badge variant="neutral">{s(r.source)} · {s(r.aspectRatio)}</Badge> },
    { label: 'Lượt xem', render: (r) => formatCompact(Number(r.views) || 0) },
  ],
  fields: [
    { key: 'title', label: 'Tiêu đề', type: 'text', required: true, wide: true },
    { key: 'productId', label: 'Sản phẩm', type: 'ref', ref: productRef, required: true },
    { key: 'kolId', label: 'KOL', type: 'ref', ref: { collection: 'kols' }, required: true },
    { key: 'thumbnail', label: 'Ảnh bìa', type: 'media', required: true, wide: true },
    {
      key: 'video',
      label: 'Video',
      type: 'video',
      wide: true,
      video: { source: 'source', src: 'videoSrc', embed: 'embedUrl', url: 'sourceUrl', aspect: 'aspectRatio' },
    },
    { key: 'aspectRatio', label: 'Khung hình', type: 'select', options: ASPECTS, help: 'Tự đặt 9:16 với TikTok, Shorts, Reels' },
    { key: 'duration', label: 'Thời lượng (giây)', type: 'number' },
    { key: 'publishedAt', label: 'Ngày đăng', type: 'datetime' },
    { key: 'views', label: 'Lượt xem', type: 'number' },
    { key: 'likes', label: 'Lượt thích', type: 'number' },
  ],
}

export const reviews: ResourceConfig = {
  collection: 'reviews',
  title: 'Đánh giá & bình luận',
  noun: 'đánh giá',
  search: (r) => `${s(r.content)} ${s((r.author as Rec | undefined)?.name)} ${s(r.productId)}`,
  sort: byNewest('createdAt'),
  toggle: { key: 'featured', label: 'Nổi bật' },
  defaults: () => ({ rating: 5, verifiedPurchase: true, featured: false, media: [], createdAt: new Date().toISOString(), author: { name: '' } }),
  columns: [
    {
      label: 'Nội dung',
      className: 'max-w-md',
      render: (r) => (
        <div>
          <p className="font-semibold">
            {s((r.author as Rec | undefined)?.name)} <span className="text-amber-500">{'★'.repeat(Number(r.rating) || 0)}</span>
            {(r.author as Rec | undefined)?.display === 'anonymous' && <Badge size="sm" variant="neutral" className="ml-1">Ẩn danh</Badge>}
            {!!r.userId && <Badge size="sm" variant="success" className="ml-1">Khách viết</Badge>}
            {!!r.seeded && <Badge size="sm" variant="warning" className="ml-1">Demo</Badge>}
            {!!r.hidden && <Badge size="sm" variant="danger-soft" className="ml-1">Đang ẩn</Badge>}
          </p>
          <p className="line-clamp-2 text-xs text-muted">{s(r.content)}</p>
        </div>
      ),
    },
    { label: 'Sản phẩm', render: (r) => <RefName collection="products" value={r.productId} /> },
    { label: 'Ảnh/video', render: (r) => (Array.isArray(r.media) ? r.media.length : 0) },
    { label: 'Ngày', render: (r) => fmtDate(r.createdAt) },
  ],
  fields: [
    { key: 'productId', label: 'Sản phẩm', type: 'ref', ref: productRef, required: true },
    {
      key: 'rating',
      label: 'Số sao',
      type: 'select',
      numeric: true,
      options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} sao` })),
    },
    { key: 'author.name', label: 'Họ tên đầy đủ', type: 'text', required: true },
    {
      key: 'author.display',
      label: 'Hiển thị tên',
      type: 'select',
      options: [
        { value: 'full', label: 'Tên đầy đủ' },
        { value: 'nickname', label: 'Biệt danh' },
        { value: 'anonymous', label: 'Ẩn danh (ẩn 3 ký tự cuối)' },
      ],
    },
    { key: 'author.nickname', label: 'Biệt danh', type: 'text', placeholder: 'Long Audio' },
    { key: 'author.avatar', label: 'Ảnh đại diện', type: 'media', help: 'Để trống thì hiện chữ cái đầu của tên' },
    { key: 'content', label: 'Nội dung', type: 'textarea', required: true, wide: true },
    { key: 'createdAt', label: 'Ngày đánh giá', type: 'datetime' },
    { key: 'helpfulCount', label: 'Lượt hữu ích', type: 'number' },
    { key: 'reply.content', label: 'Phản hồi từ JAMIR', type: 'textarea', wide: true },
    { key: 'verifiedPurchase', label: 'Đã mua hàng', type: 'switch' },
    { key: 'featured', label: 'Nổi bật', type: 'switch' },
    { key: 'hidden', label: 'Ẩn khỏi trang sản phẩm', type: 'switch' },
    {
      key: 'media',
      label: 'Ảnh / video đính kèm (JSON)',
      type: 'json',
      wide: true,
      help: '[{ "type": "image", "src": "/media/...", "thumbnail": "/media/..." }]',
    },
  ],
}

export const faqs: ResourceConfig = {
  collection: 'faqs',
  title: 'Hỏi đáp',
  noun: 'câu hỏi',
  search: (r) => `${s(r.question)} ${s(r.answer)}`,
  sort: (a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || s(b.createdAt).localeCompare(s(a.createdAt)),
  defaults: { answerCount: 1 },
  columns: [
    {
      label: 'Câu hỏi',
      className: 'max-w-md',
      render: (r) => (
        <div>
          <p className="font-semibold">
            {r.status === 'pending' && <Badge size="sm" variant="warning" className="mr-1.5">Chờ trả lời</Badge>}
            {s(r.question)}
          </p>
          <p className="line-clamp-1 text-xs text-muted">{s(r.answer) || 'Chưa có câu trả lời: bấm để trả lời và đăng công khai'}</p>
        </div>
      ),
    },
    { label: 'Sản phẩm', render: (r) => <RefName collection="products" value={r.productId} /> },
  ],
  fields: [
    { key: 'productId', label: 'Sản phẩm', type: 'ref', ref: productRef, required: true, wide: true },
    { key: 'question', label: 'Câu hỏi', type: 'text', required: true, wide: true },
    { key: 'answer', label: 'Trả lời', type: 'textarea', wide: true, help: 'Có câu trả lời thì câu hỏi được hiện công khai trên trang sản phẩm' },
    { key: 'answerCount', label: 'Số câu trả lời', type: 'number' },
  ],
}

export const news: ResourceConfig = {
  collection: 'news',
  title: 'Tin tức',
  noun: 'bài viết',
  search: (r) => `${s(r.title)} ${s(r.excerpt)} ${Array.isArray(r.tags) ? r.tags.join(' ') : ''}`,
  sort: byNewest('publishedAt'),
  toggle: { key: 'published', label: 'Xuất bản' },
  defaults: () => ({ published: true, publishedAt: new Date().toISOString(), tags: [], author: 'Ban biên tập JAMIR' }),
  columns: [
    { label: 'Bài viết', className: 'max-w-md', render: (r) => <Thumb src={r.cover} title={r.title} sub={r.excerpt} /> },
    { label: 'Sản phẩm', render: (r) => (r.productSlug ? <RefName collection="products" value={r.productSlug} by="slug" /> : '—') },
    {
      label: 'Nhãn',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {!!r.priority && <Badge variant="warning">Ưu tiên {s(r.priority)}</Badge>}
          {((r.labels ?? []) as NewsLabel[]).map((l) =>
            NEWS_LABELS[l] ? (
              <span key={l} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${NEWS_LABELS[l].className}`}>
                {NEWS_LABELS[l].text}
              </span>
            ) : null,
          )}
        </div>
      ),
    },
    { label: 'Ngày đăng', render: (r) => fmtDate(r.publishedAt) },
  ],
  fields: [
    { key: 'title', label: 'Tiêu đề', type: 'text', required: true, wide: true },
    { key: 'slug', label: 'Slug', type: 'text', help: 'Để trống để tự tạo' },
    { key: 'productSlug', label: 'Sản phẩm liên quan', type: 'ref', ref: productSlugRef },
    { key: 'cover', label: 'Ảnh bìa', type: 'media', wide: true },
    { key: 'excerpt', label: 'Tóm tắt', type: 'textarea', wide: true },
    { key: 'content', label: 'Nội dung', type: 'textarea', wide: true, help: 'Mỗi đoạn cách nhau một dòng trống' },
    {
      key: 'priority',
      label: 'Độ ưu tiên',
      type: 'number',
      placeholder: 'trống',
      help: '1 = bài nổi bật nhất ở trang chủ (thẻ lớn). Để trống thì xếp theo ngày đăng',
    },
    { key: 'labels', label: 'Nhãn', type: 'chips', options: NEWS_LABEL_OPTIONS, wide: true },
    { key: 'tags', label: 'Tags', type: 'tags' },
    { key: 'author', label: 'Tác giả', type: 'text' },
    { key: 'publishedAt', label: 'Ngày đăng', type: 'datetime' },
    { key: 'published', label: 'Xuất bản', type: 'switch' },
  ],
}

const promoValue = (r: Rec) => {
  const p = r as unknown as Promotion
  if (p.type === 'freeship') return 'Miễn phí vận chuyển'
  if (p.type === 'percent') return `Giảm ${p.value}%${p.maxDiscount ? ` (tối đa ${formatPrice(p.maxDiscount)})` : ''}`
  return `Giảm ${formatPrice(p.value)}`
}

export const promotions: ResourceConfig = {
  collection: 'promotions',
  title: 'Mã khuyến mại',
  noun: 'mã',
  search: (r) => `${s(r.code)} ${s(r.description)}`,
  toggle: { key: 'active', label: 'Kích hoạt' },
  defaults: { type: 'percent', value: 10, minOrder: 0, active: true, public: true, productIds: [] },
  columns: [
    {
      label: 'Mã',
      render: (r) => (
        <div>
          <p className="font-mono font-bold text-brand-700">{s(r.code)}</p>
          <p className="line-clamp-1 text-xs text-muted">{s(r.description)}</p>
        </div>
      ),
    },
    {
      label: 'Ưu đãi',
      render: (r) => (
        <div className="text-xs">
          <p className="font-semibold text-ink">{promoValue(r)}</p>
          {Number(r.minOrder) > 0 && <p className="text-muted">Đơn từ {formatPrice(Number(r.minOrder))}</p>}
        </div>
      ),
    },
    { label: 'Đã dùng', render: (r) => `${s(r.used ?? 0)}${r.usageLimit ? ` / ${s(r.usageLimit)}` : ''}` },
    { label: 'Hết hạn', render: (r) => fmtDate(r.endsAt) },
    {
      label: 'Phạm vi',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.public ? <Badge variant="success">Công khai</Badge> : <Badge variant="neutral">Ẩn</Badge>}
          {Array.isArray(r.productIds) && r.productIds.length > 0 && <Badge variant="outline">{r.productIds.length} SP</Badge>}
        </div>
      ),
    },
  ],
  fields: [
    { key: 'code', label: 'Mã', type: 'text', required: true, placeholder: 'JAMIR10', help: 'Tự viết hoa, bỏ khoảng trắng' },
    {
      key: 'type',
      label: 'Loại',
      type: 'select',
      required: true,
      options: [
        { value: 'percent', label: 'Giảm theo %' },
        { value: 'fixed', label: 'Giảm số tiền' },
        { value: 'freeship', label: 'Miễn phí vận chuyển' },
      ],
    },
    { key: 'value', label: 'Giá trị', type: 'number', help: '% hoặc số tiền (VNĐ). Freeship bỏ qua' },
    { key: 'maxDiscount', label: 'Giảm tối đa', type: 'number', help: 'Chỉ áp dụng cho mã %' },
    { key: 'minOrder', label: 'Đơn tối thiểu', type: 'number' },
    { key: 'usageLimit', label: 'Giới hạn lượt dùng', type: 'number', help: 'Để trống là không giới hạn' },
    { key: 'startsAt', label: 'Bắt đầu', type: 'datetime' },
    { key: 'endsAt', label: 'Kết thúc', type: 'datetime' },
    { key: 'description', label: 'Mô tả hiển thị', type: 'text', wide: true },
    { key: 'productIds', label: 'Chỉ áp dụng cho sản phẩm', type: 'refs', ref: productRef, wide: true, help: 'Không chọn là áp dụng cho cả đơn' },
    { key: 'public', label: 'Hiện voucher trên trang sản phẩm', type: 'switch' },
    { key: 'active', label: 'Kích hoạt', type: 'switch' },
  ],
}

export const ORDER_STATUS: Record<OrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
  pending: { label: 'Chờ xác nhận', variant: 'warning' },
  confirmed: { label: 'Đã xác nhận', variant: 'soft' },
  shipping: { label: 'Đang giao', variant: 'warning' },
  delivered: { label: 'Đã giao', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'danger-soft' },
}
const statusOptions = Object.entries(ORDER_STATUS).map(([value, v]) => ({ value, label: v.label }))

export const orders: ResourceConfig = {
  collection: 'orders',
  title: 'Đơn hàng',
  noun: 'đơn hàng',
  readonlyCreate: true,
  search: (r) => {
    const a = (r.address ?? {}) as Rec
    return `${r.id} ${s(a.recipient)} ${s(a.phone)} ${s(a.city)} ${s(r.promoCode)}`
  },
  sort: byNewest('createdAt'),
  columns: [
    {
      label: 'Đơn',
      render: (r) => (
        <div>
          <p className="font-mono font-semibold">{r.id}</p>
          <p className="text-xs text-muted">{fmtDate(r.createdAt)}</p>
        </div>
      ),
    },
    {
      label: 'Người nhận',
      render: (r) => {
        const a = (r.address ?? {}) as Rec
        return (
          <div className="text-xs">
            <p className="text-sm font-semibold">{s(a.recipient)}</p>
            <p className="text-muted">{s(a.phone)}</p>
            <p className="line-clamp-1 text-muted">{[a.line, a.district, a.city].filter(Boolean).join(', ')}</p>
            {!!r.clientIp && <p className="font-mono text-[10px] text-subtle">IP {s(r.clientIp)}</p>}
          </div>
        )
      },
    },
    {
      label: 'Sản phẩm',
      className: 'max-w-xs',
      render: (r) => (
        <ul className="text-xs">
          {((r.items ?? []) as Rec[]).map((i, k) => (
            <li key={k} className="line-clamp-1">
              {s(i.quantity)} × {s(i.name ?? i.productId)}
              {i.colorName ? ` (${s(i.colorName)})` : ''}
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: 'Tổng',
      render: (r) => (
        <div>
          <p className="font-semibold">{formatPrice(Number(r.total))}</p>
          {!!r.promoCode && <p className="font-mono text-xs text-brand-700">{s(r.promoCode)}</p>}
        </div>
      ),
    },
    {
      label: 'Trạng thái',
      render: (r, patch) => (
        <div onClick={(e) => e.stopPropagation()} className="w-40">
          <Select value={s(r.status)} onValueChange={(status) => patch({ status })} options={statusOptions} className="h-9" />
        </div>
      ),
    },
  ],
  fields: [
    { key: 'status', label: 'Trạng thái', type: 'select', options: statusOptions },
    { key: 'note', label: 'Ghi chú', type: 'text' },
    { key: 'address.recipient', label: 'Người nhận', type: 'text' },
    { key: 'address.phone', label: 'Số điện thoại', type: 'text' },
    { key: 'address.line', label: 'Địa chỉ', type: 'text', wide: true },
    { key: 'address.district', label: 'Quận / huyện', type: 'text' },
    { key: 'address.city', label: 'Tỉnh / thành phố', type: 'text' },
  ],
}

export const landingPages: ResourceConfig = {
  collection: 'landing-pages',
  title: 'Landing page quảng cáo',
  noun: 'landing page',
  preview: (draft) => <LandingPreview draft={draft} />,
  search: (r) => `${s(r.headline)} ${s(r.slug)}`,
  toggle: { key: 'active', label: 'Đang chạy' },
  defaults: { active: true, theme: 'collage', showReviews: true, ctaText: 'Mua ngay' },
  columns: [
    {
      label: 'Trang',
      className: 'max-w-md',
      render: (r) => (
        <div>
          <p className="font-semibold">{s(r.headline)}</p>
          <a href={`/uu-dai/${s(r.slug)}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="font-mono text-xs text-brand-700 hover:underline">
            /uu-dai/{s(r.slug)} ↗
          </a>
        </div>
      ),
    },
    { label: 'Sản phẩm', render: (r) => <RefName collection="products" value={r.productId} /> },
    { label: 'Hết hạn ưu đãi', render: (r) => fmtDate(r.countdownEndsAt) },
  ],
  fields: [
    { key: 'productId', label: 'Sản phẩm', type: 'ref', ref: productRef, required: true },
    { key: 'slug', label: 'Đường dẫn (/uu-dai/...)', type: 'text', help: 'Để trống để tự tạo từ tiêu đề. Dùng link này cho quảng cáo Facebook/TikTok' },
    {
      key: 'theme',
      label: 'Giao diện',
      type: 'select',
      options: [
        { value: 'collage', label: 'Collage street (giống poster quảng cáo, cuộn dọc)' },
        { value: 'poster', label: 'Poster một màn hình (không cần cuộn)' },
        { value: 'feed', label: 'Lướt kiểu TikTok (mỗi phần một màn hình, neon)' },
        { value: 'design', label: 'Ảnh thiết kế (up nguyên ảnh, giống 100%, có vùng bấm)' },
      ],
    },
    {
      key: 'headline',
      label: 'Tiêu đề lớn',
      type: 'textarea',
      required: true,
      wide: true,
      help: 'Giao diện street: *chữ* thành chữ đỏ to, [chữ] thành băng dính vàng. Ví dụ: Nhỏ vậy thôi\nnhưng *chất* [không nhỏ]',
    },
    { showIf: (r) => ['design'].includes(String(r.theme ?? 'collage')), key: 'designImage', label: 'Ảnh thiết kế (giao diện "Ảnh thiết kế")', type: 'media', wide: true, help: 'Up nguyên ảnh landing đã thiết kế. Ảnh rộng 1200–1600px sẽ nét trên máy tính.' },
    { showIf: (r) => ['design'].includes(String(r.theme ?? 'collage')), key: 'designWidth', label: 'Độ rộng tối đa của ảnh (px)', type: 'number', placeholder: '900' },
    { showIf: (r) => ['design'].includes(String(r.theme ?? 'collage')), key: 'hotspots', label: 'Vùng bấm trên ảnh', type: 'hotspots', wide: true, help: 'Vẽ vùng video (hiện nút ▶, bấm mở popup video) và vùng mua hàng (nhấp nháy, mở checkout sản phẩm đã chọn).' },
    { showIf: (r) => ['collage', 'poster'].includes(String(r.theme ?? 'collage')), key: 'tagline', label: 'Câu khẩu hiệu (street)', type: 'textarea', wide: true, placeholder: 'Đi đâu cũng có nhạc, cũng có bạn' },
    { showIf: (r) => ['collage', 'poster', 'feed'].includes(String(r.theme ?? 'collage')), key: 'sideNote', label: 'Ghi chú viết tay ở hero', type: 'text', placeholder: 'Play anytime anywhere' },
    { showIf: (r) => ['collage'].includes(String(r.theme ?? 'collage')), key: 'outroLine', label: 'Câu ở ảnh cuối (collage)', type: 'text', placeholder: 'Âm nhạc không giới hạn' },
    { showIf: (r) => ['collage', 'poster', 'feed'].includes(String(r.theme ?? 'collage')), key: 'subheadline', label: 'Mô tả ngắn', type: 'textarea', wide: true },
    { showIf: (r) => ['poster', 'feed'].includes(String(r.theme ?? 'collage')), key: 'badge', label: 'Nhãn nổi bật', type: 'text', placeholder: 'Giảm sốc hôm nay' },
    { key: 'ctaText', label: 'Chữ trên nút mua', type: 'text', placeholder: 'Mua ngay với giá ưu đãi' },
    { showIf: (r) => ['collage', 'poster', 'feed'].includes(String(r.theme ?? 'collage')), key: 'heroMedia.src', label: 'Ảnh hero / ảnh chia sẻ Facebook-Zalo', type: 'media', accept: 'any', help: 'Street: ảnh người cầm sản phẩm, ngang, càng tối càng hợp. Chọn loại "Ảnh" ở trên' },
    { showIf: (r) => ['feed'].includes(String(r.theme ?? 'collage')), key: 'countdownEndsAt', label: 'Đếm ngược tới', type: 'datetime', help: 'Để trống nếu không cần đồng hồ đếm ngược' },
    { showIf: (r) => ['collage', 'poster', 'feed', 'design'].includes(String(r.theme ?? 'collage')), key: 'kolReviewId', label: 'Video KOL nổi bật', type: 'ref', ref: { collection: 'kol-reviews', labelKey: 'title', where: { field: 'productId', sameAs: 'productId' } }, wide: true, help: 'Video KOL của sản phẩm đã chọn. Để trống: video nhiều lượt xem nhất' },
    { showIf: (r) => ['collage', 'poster', 'feed'].includes(String(r.theme ?? 'collage')), key: 'reviewIds', label: 'Đánh giá nổi bật (chọn tối đa 3)', type: 'refs', ref: { collection: 'reviews', labelKey: 'content', where: { field: 'productId', sameAs: 'productId' } }, wide: true, help: 'Đánh giá của sản phẩm đã chọn. Để trống: tự chọn đánh giá điểm cao, có ảnh' },
    { showIf: (r) => ['collage'].includes(String(r.theme ?? 'collage')), key: 'showReviews', label: 'Hiện đánh giá khách hàng', type: 'switch' },
    { key: 'active', label: 'Đang chạy', type: 'switch' },
  ],
}

const TARGET_LABEL: Record<string, string> = { product: 'Sản phẩm', news: 'Bài viết', video: 'Video KOL', url: 'Link' }

export const events: ResourceConfig = {
  collection: 'events',
  title: 'Sự kiện & popup',
  noun: 'sự kiện',
  preview: (draft) => <EventPreview draft={draft} />,
  search: (r) => s(r.title),
  sort: (a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0),
  toggle: { key: 'active', label: 'Bật' },
  defaults: { active: true, priority: 10, frequency: 'daily', ctaText: 'Xem ngay', target: { type: 'product', value: '' } },
  columns: [
    { label: 'Popup', className: 'max-w-md', render: (r) => <Thumb src={r.image} title={r.title} sub={r.description} /> },
    {
      label: 'Thời gian',
      render: (r) => (
        <div className="text-xs">
          <p>Từ {fmtDate(r.startsAt)}</p>
          <p>Đến {fmtDate(r.endsAt)}</p>
        </div>
      ),
    },
    {
      label: 'Khi bấm',
      render: (r) => {
        const t = (r.target ?? {}) as Rec
        return <Badge variant="outline">{TARGET_LABEL[s(t.type)] ?? '—'}: {s(t.value)}</Badge>
      },
    },
    {
      label: 'Tần suất',
      render: (r) => ({ once: 'Một lần', daily: 'Mỗi ngày', session: 'Mỗi phiên' })[s(r.frequency) as 'once'] ?? s(r.frequency),
    },
  ],
  fields: [
    {
      key: 'style',
      label: 'Kiểu popup',
      type: 'select',
      options: [
        { value: 'banner', label: 'Banner (ảnh + chữ)' },
        { value: 'poster', label: 'Poster graffiti (giá, màu lấy từ sản phẩm)' },
        { value: 'image', label: 'Ảnh tự thiết kế (chỉ hiện ảnh, bấm để mở)' },
      ],
    },
    {
      key: 'width',
      label: 'Chiều rộng popup (px)',
      type: 'number',
      placeholder: 'tự động',
      help: 'Để trống: banner 720, poster 500, ảnh 560. Điện thoại tự co theo màn hình.',
    },
    { key: 'title', label: 'Tiêu đề', type: 'text', required: true, wide: true },
    { key: 'image', label: 'Ảnh banner / ảnh nền poster / ảnh tự thiết kế', type: 'media', required: true, wide: true, help: 'Kiểu "Ảnh tự thiết kế": up nguyên banner đã làm sẵn (Canva, Photoshop…), giữ nguyên tỉ lệ ảnh' },
    { showIf: (r) => r.style === 'poster', key: 'kicker', label: 'Poster: băng dính đỏ', type: 'text', placeholder: 'Siêu deal' },
    { showIf: (r) => r.style === 'poster', key: 'highlight', label: 'Poster: chữ cực lớn', type: 'text', placeholder: '10.10' },
    { showIf: (r) => r.style === 'poster', key: 'discountText', label: 'Poster: ưu đãi', type: 'text', placeholder: 'Giảm ngay 25%' },
    { showIf: (r) => r.style === 'poster', key: 'note', label: 'Poster: nhãn dán trắng', type: 'text', placeholder: 'Chỉ duy nhất 10.10' },
    { showIf: (r) => r.style !== 'image', key: 'description', label: 'Mô tả (poster: câu khẩu hiệu dán giấy)', type: 'textarea', wide: true, placeholder: 'Nhỏ vậy thôi nhưng chất không nhỏ!' },
    { showIf: (r) => r.style === 'poster', key: 'sideNote', label: 'Poster: ghi chú viết tay', type: 'text', placeholder: 'Play anytime anywhere' },
    { key: 'target', label: 'Khi bấm thì mở', type: 'target', wide: true },
    { showIf: (r) => r.style !== 'image', key: 'ctaText', label: 'Chữ trên nút', type: 'text', placeholder: 'Xem ngay' },
    {
      key: 'frequency',
      label: 'Hiện cho mỗi khách',
      type: 'select',
      options: [
        { value: 'daily', label: 'Mỗi ngày một lần' },
        { value: 'session', label: 'Mỗi lần vào web' },
        { value: 'once', label: 'Chỉ một lần duy nhất' },
      ],
    },
    { key: 'startsAt', label: 'Bắt đầu', type: 'datetime', help: 'Để trống = hiện ngay' },
    { key: 'endsAt', label: 'Kết thúc', type: 'datetime', help: 'Để trống = không hết hạn' },
    { key: 'priority', label: 'Độ ưu tiên', type: 'number', help: 'Nhiều sự kiện cùng lúc thì số lớn hiện trước' },
    { key: 'active', label: 'Bật', type: 'switch' },
  ],
}

export const banners: ResourceConfig = {
  collection: 'banners',
  title: 'Banner trang chủ',
  noun: 'banner',
  search: (r) => `${s(r.title)} ${s(r.eyebrow)}`,
  sort: (a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0),
  toggle: { key: 'active', label: 'Hiển thị' },
  defaults: { active: true, overlay: true, ctaText: 'Xem ngay', target: { type: 'product', value: '' } },
  columns: [
    {
      label: 'Banner',
      className: 'max-w-md',
      render: (r) => (
        <div className="flex items-center gap-3">
          <img src={s(r.image)} alt="" className="h-12 w-24 shrink-0 rounded-[8px] bg-line-soft object-cover" />
          <div className="min-w-0">
            <p className="line-clamp-2 font-semibold whitespace-pre-line">{s(r.title) || '(không có tiêu đề)'}</p>
            {!!r.eyebrow && <p className="truncate text-xs text-muted">{s(r.eyebrow)}</p>}
          </div>
        </div>
      ),
    },
    {
      label: 'Khi bấm',
      render: (r) => {
        const t = (r.target ?? {}) as Rec
        return t.value ? <Badge variant="outline">{TARGET_LABEL[s(t.type)] ?? '—'}: {s(t.value)}</Badge> : <span className="text-subtle">—</span>
      },
    },
    {
      label: 'Thời gian',
      render: (r) => (r.startsAt || r.endsAt ? <span className="text-xs">{fmtDate(r.startsAt)} → {fmtDate(r.endsAt)}</span> : <span className="text-xs text-muted">Luôn hiện</span>),
    },
    { label: 'Thứ tự', render: (r) => <span className="font-semibold">{s(r.priority)}</span> },
  ],
  fields: [
    { key: 'image', label: 'Ảnh banner (máy tính, ngang khoảng 1920×720)', type: 'media', required: true, wide: true },
    { key: 'mobileImage', label: 'Ảnh cho điện thoại (không bắt buộc, khoảng 1080×700)', type: 'media', wide: true },
    { key: 'eyebrow', label: 'Nhãn nhỏ phía trên', type: 'text', placeholder: 'Ưu đãi tuần này' },
    { key: 'ctaText', label: 'Chữ trên nút', type: 'text', placeholder: 'Xem ngay' },
    { key: 'title', label: 'Tiêu đề lớn', type: 'textarea', wide: true, help: 'Xuống dòng sẽ được giữ nguyên trên banner' },
    { key: 'subtitle', label: 'Mô tả ngắn (không bắt buộc)', type: 'text', wide: true },
    { key: 'target', label: 'Khi bấm nút thì mở', type: 'target', wide: true },
    { key: 'priority', label: 'Thứ tự', type: 'number', help: 'Số lớn hiện trước' },
    { key: 'overlay', label: 'Làm tối nền bên trái cho chữ dễ đọc', type: 'switch' },
    { key: 'startsAt', label: 'Bắt đầu hiện', type: 'datetime', help: 'Để trống = hiện ngay' },
    { key: 'endsAt', label: 'Ngừng hiện', type: 'datetime', help: 'Để trống = không hết hạn' },
    { key: 'active', label: 'Hiển thị', type: 'switch' },
  ],
}

export const reviewPool: ResourceConfig = {
  collection: 'review-pool',
  title: 'Kho đánh giá mẫu',
  noun: 'mẫu',
  search: (r) => `${s(r.content)} ${s(r.name)}`,
  defaults: { rating: 5, display: 'full' },
  columns: [
    {
      label: 'Nội dung',
      className: 'max-w-md',
      render: (r) => (
        <div>
          <p className="font-semibold">
            {s(r.name)} <span className="text-amber-500">{'★'.repeat(Number(r.rating) || 0)}</span>
          </p>
          <p className="line-clamp-2 text-xs text-muted">{s(r.content)}</p>
        </div>
      ),
    },
    { label: 'Sản phẩm', render: (r) => (r.productId ? <RefName collection="products" value={r.productId} /> : <span className="text-subtle">Ngẫu nhiên</span>) },
    {
      label: 'Hiển thị tên',
      render: (r) => ({ full: 'Đầy đủ', nickname: 'Biệt danh', anonymous: 'Ẩn danh' })[s(r.display) as 'full'] ?? 'Ngẫu nhiên',
    },
  ],
  fields: [
    { key: 'productId', label: 'Sản phẩm', type: 'ref', ref: productRef, help: 'Không chọn = gắn vào sản phẩm ngẫu nhiên khi đăng' },
    { key: 'rating', label: 'Số sao', type: 'select', numeric: true, options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} sao` })) },
    { key: 'content', label: 'Nội dung', type: 'textarea', required: true, wide: true },
    { key: 'name', label: 'Họ tên', type: 'text', required: true },
    {
      key: 'display',
      label: 'Hiển thị tên',
      type: 'select',
      options: [
        { value: 'full', label: 'Tên đầy đủ' },
        { value: 'nickname', label: 'Biệt danh' },
        { value: 'anonymous', label: 'Ẩn danh' },
      ],
    },
    { key: 'nickname', label: 'Biệt danh', type: 'text' },
    { key: 'avatar', label: 'Ảnh đại diện', type: 'media' },
    { key: 'media', label: 'Ảnh / video đính kèm (JSON)', type: 'json', wide: true, help: '[{ "type": "image", "src": "/media/...", "thumbnail": "/media/..." }]' },
  ],
}
