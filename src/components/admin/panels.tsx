import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileJson, MapPin, Play, Search, ShoppingBag, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { SectionError } from '@/components/jamir/layout/PageStates'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { formatPrice, normalizeText } from '@/lib/utils'
import { adminApi, type AdminDoc } from '@/services'
import type { AdminCustomer, AuthProvider, SiteSettings, StoriesConfig } from '@/types/domain'
import { FieldControl, type FieldDef } from './fields'
import { ResourcePanel } from './ResourcePanel'
import { reviewPool } from './resources'
import { fmtDate, ORDER_STATUS } from './resources'
import { useAdminMutation } from './ResourcePanel'

/* ---------------- overview ---------------- */

export function OverviewPanel() {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['admin', 'overview'], queryFn: adminApi.overview })
  if (isError) return <SectionError onRetry={() => void refetch()} />
  const stats = [
    { label: 'Khách hàng', value: data?.customers },
    { label: 'Đơn hàng', value: data?.orders },
    { label: 'Chờ xác nhận', value: data?.pendingOrders },
    { label: 'Doanh thu', value: data ? formatPrice(data.revenue) : undefined },
    { label: 'Sản phẩm', value: data?.products },
    { label: 'Stories đang chạy', value: data?.stories },
  ]
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold">Tổng quan</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted">{s.label}</p>
              {isPending ? <Skeleton className="mt-1.5 h-7 w-16" /> : <p className="mt-1 text-2xl font-bold text-ink">{s.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Đơn hàng gần đây</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-line">
          {data?.recentOrders.map((o) => (
            <div key={o.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="font-mono font-semibold">{o.id}</span>
              <span className="min-w-0 flex-1 truncate">{o.customerName}</span>
              <span className="hidden text-xs text-muted sm:inline">{fmtDate(o.createdAt)}</span>
              <span className="font-semibold">{formatPrice(o.total)}</span>
              <Badge variant={ORDER_STATUS[o.status].variant}>{ORDER_STATUS[o.status].label}</Badge>
            </div>
          ))}
          {data && !data.recentOrders.length && <p className="py-6 text-center text-sm text-muted">Chưa có đơn hàng</p>}
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- customers ---------------- */

const PROVIDER: Record<AuthProvider, { label: string; variant: 'soft' | 'success' | 'neutral' }> = {
  google: { label: 'Google', variant: 'success' },
  password: { label: 'Tài khoản', variant: 'soft' },
  guest: { label: 'Khách vãng lai', variant: 'neutral' },
}

export function CustomersPanel() {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['admin', 'customers'], queryFn: adminApi.customers })
  const [q, setQ] = useState('')
  const [provider, setProvider] = useState('all')
  const [open, setOpen] = useState<AdminCustomer | null>(null)

  const rows = useMemo(() => {
    const n = normalizeText(q)
    return (data ?? []).filter(
      (c) =>
        (provider === 'all' || c.provider === provider || (provider === 'admin' && c.role === 'admin')) &&
        (!n || normalizeText(`${c.name} ${c.phone ?? ''} ${c.email ?? ''} ${c.addresses.map((a) => `${a.district} ${a.city}`).join(' ')}`).includes(n)),
    )
  }, [data, q, provider])

  if (isError) return <SectionError onRetry={() => void refetch()} />
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-xl font-bold">
          Khách hàng <span className="text-sm font-medium text-muted">({data?.length ?? 0})</span>
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tên, SĐT, email, tỉnh…" className="pl-9" />
        </div>
        <Select
          value={provider}
          onValueChange={setProvider}
          className="w-44"
          options={[
            { value: 'all', label: 'Tất cả nguồn' },
            { value: 'google', label: 'Đăng nhập Google' },
            { value: 'password', label: 'Đăng ký tài khoản' },
            { value: 'guest', label: 'Khách vãng lai' },
            { value: 'admin', label: 'Quản trị viên' },
          ]}
        />
      </div>
      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-line-soft/60 text-xs font-semibold text-muted">
            <tr>
              <th className="px-3 py-2.5">Khách hàng</th>
              <th className="px-3 py-2.5">Liên hệ</th>
              <th className="px-3 py-2.5">Khu vực</th>
              <th className="px-3 py-2.5">Đơn</th>
              <th className="px-3 py-2.5">Chi tiêu</th>
              <th className="px-3 py-2.5">Gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {isPending &&
              Array.from({ length: 4 }, (_, i) => (
                <tr key={i} className="border-t border-line">
                  <td colSpan={6} className="px-3 py-3">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))}
            {rows.map((c) => {
              const addr = c.addresses.find((a) => a.isDefault) ?? c.addresses[0]
              return (
                <tr key={c.id} onClick={() => setOpen(c)} className="cursor-pointer border-t border-line hover:bg-brand-50/40">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={c.avatar} name={c.name} className="size-9" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{c.name}</p>
                        <div className="flex gap-1">
                          <Badge size="sm" variant={PROVIDER[c.provider].variant}>
                            {PROVIDER[c.provider].label}
                          </Badge>
                          {c.role === 'admin' && (
                            <Badge size="sm" variant="brand">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    <p className="font-medium text-ink">{c.phone ?? '—'}</p>
                    <p className="text-muted">{c.email ?? ''}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-ink-soft">{addr ? [addr.district, addr.city].filter(Boolean).join(', ') : '—'}</td>
                  <td className="px-3 py-2.5 font-semibold">{c.orderCount}</td>
                  <td className="px-3 py-2.5 font-semibold">{formatPrice(c.totalSpent)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted">{fmtDate(c.lastOrderAt ?? c.lastLoginAt ?? c.createdAt)}</td>
                </tr>
              )
            })}
            {!isPending && !rows.length && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted">
                  Không có khách hàng phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {open && <CustomerDialog customer={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function CustomerDialog({ customer: c, onClose }: { customer: AdminCustomer; onClose: () => void }) {
  const update = useAdminMutation((role: 'admin' | 'customer') => adminApi.updateCustomer(c.id, { role }), 'Đã cập nhật quyền')
  const remove = useAdminMutation(() => adminApi.deleteCustomer(c.id), 'Đã xóa khách hàng')
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl overflow-y-auto p-5 md:p-6" closeClassName="bg-line-soft text-ink-soft hover:bg-line">
        <div className="flex items-center gap-3 pr-10">
          <Avatar src={c.avatar} name={c.name} className="size-14" />
          <div className="min-w-0">
            <DialogTitle>{c.name}</DialogTitle>
            <DialogDescription>
              {PROVIDER[c.provider].label} · tạo {fmtDate(c.createdAt)}
              {c.lastLoginAt ? ` · đăng nhập ${fmtDate(c.lastLoginAt)}` : ''}
            </DialogDescription>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Info label="Số điện thoại" value={c.phone} />
          <Info label="Email" value={c.email} />
          <Info label="Đã chi" value={`${formatPrice(c.totalSpent)} · ${c.orderCount} đơn`} />
        </div>

        <h3 className="mt-5 mb-2 flex items-center gap-1.5 text-sm font-bold">
          <MapPin className="size-4 text-brand-600" /> Địa chỉ ({c.addresses.length})
        </h3>
        <div className="flex flex-col gap-2">
          {c.addresses.map((a) => (
            <div key={a.id} className="rounded-[12px] border border-line p-3 text-sm">
              <p className="font-semibold">
                {a.recipient} · {a.phone} {a.isDefault && <Badge size="sm">Mặc định</Badge>}
              </p>
              <p className="text-muted">{[a.line, a.district, a.city].filter(Boolean).join(', ')}</p>
            </div>
          ))}
          {!c.addresses.length && <p className="text-sm text-muted">Chưa có địa chỉ</p>}
        </div>

        <h3 className="mt-5 mb-2 flex items-center gap-1.5 text-sm font-bold">
          <ShoppingBag className="size-4 text-brand-600" /> Đơn hàng ({c.orders.length})
        </h3>
        <div className="flex flex-col gap-2">
          {c.orders.map((o) => (
            <div key={o.id} className="rounded-[12px] border border-line p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-semibold">{o.id}</span>
                <span className="text-xs text-muted">{fmtDate(o.createdAt)}</span>
                <Badge variant={ORDER_STATUS[o.status].variant} className="ml-auto">
                  {ORDER_STATUS[o.status].label}
                </Badge>
              </div>
              <ul className="mt-1.5 text-xs text-ink-soft">
                {o.items.map((i, k) => (
                  <li key={k}>
                    {i.quantity} × {i.name ?? i.productId}
                    {i.colorName ? ` (${i.colorName})` : ''} — {formatPrice(i.unitPrice)}
                    {i.gifts?.length ? <span className="text-pink-700"> · 🎁 {i.gifts.join(', ')}</span> : null}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-xs text-muted">
                Giao tới: {[o.address.line, o.address.district, o.address.city].filter(Boolean).join(', ')}
                {o.promoCode ? ` · Mã ${o.promoCode}` : ''}
              </p>
              <p className="mt-1 text-right font-bold">{formatPrice(o.total)}</p>
            </div>
          ))}
          {!c.orders.length && <p className="text-sm text-muted">Chưa đặt đơn nào</p>}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <Button
            variant="ghost"
            className="text-danger"
            loading={remove.isPending}
            onClick={() => confirm(`Xóa khách hàng ${c.name}?`) && remove.mutate(undefined, { onSuccess: onClose })}
          >
            Xóa khách hàng
          </Button>
          <Button
            variant="outline"
            loading={update.isPending}
            onClick={() => update.mutate(c.role === 'admin' ? 'customer' : 'admin', { onSuccess: onClose })}
          >
            {c.role === 'admin' ? 'Gỡ quyền quản trị' : 'Cấp quyền quản trị'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-[12px] bg-line-soft/60 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold">{value || '—'}</p>
    </div>
  )
}

/* ---------------- single-document editors ---------------- */

function DocForm<T extends object>({ doc, title, fields, description }: { doc: AdminDoc; title: string; fields: FieldDef[]; description?: string }) {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['admin', 'doc', doc], queryFn: () => adminApi.readDoc<T>(doc) })
  const [draft, setDraft] = useState<T | null>(null)
  const save = useAdminMutation((v: T) => adminApi.writeDoc(doc, v), 'Đã lưu cấu hình')
  const value = (draft ?? data) as Record<string, unknown> | undefined
  if (isError) return <SectionError onRetry={() => void refetch()} />
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted">{description}</p>}
      </CardHeader>
      <CardContent>
        {isPending || !value ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="grid gap-3.5 md:grid-cols-2">
            {fields.map((f) => (
              <FieldControl key={f.key} field={f} record={value} onChange={(r) => setDraft(r as T)} />
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button disabled={!draft} loading={save.isPending} onClick={() => draft && save.mutate(draft, { onSuccess: () => setDraft(null) })}>
            Lưu thay đổi
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function StoriesConfigCard() {
  return (
    <DocForm<StoriesConfig>
      doc="stories-config"
      title="Cấu hình phát Stories"
      description="Chế độ Xem tất cả: mỗi story là một trang sản phẩm, hết thời gian thì tự chuyển sang sản phẩm khác."
      fields={[
        { key: 'intervalSeconds', label: 'Thời gian mỗi story (giây)', type: 'number' },
        {
          key: 'idleSeconds',
          label: 'Tự phát ở trang chủ sau (giây)',
          type: 'number',
          placeholder: '10',
          help: 'Khách không click / cuộn trong khoảng này thì tự vào Xem tất cả. 0 = tắt.',
        },
        { key: 'playAllImage', label: 'Ảnh ô "Xem tất cả"', type: 'media', wide: true, help: 'Để trống: dùng ảnh đồ hoạ mặc định của JAMIR (không trùng ảnh sản phẩm). Ảnh dọc 3:4.' },
        {
          key: 'order',
          label: 'Thứ tự chuyển',
          type: 'select',
          options: [
            { value: 'random', label: 'Ngẫu nhiên (xáo lại mỗi vòng)' },
            { value: 'priority', label: 'Theo độ ưu tiên' },
          ],
        },
      ]}
    />
  )
}

/** Import one story, an array, or { items: [...] } from a .json file. */
export function StoryImportButton() {
  const ref = useRef<HTMLInputElement>(null)
  const imp = useAdminMutation((json: unknown) => adminApi.importStories(json))
  return (
    <>
      <Button variant="outline" loading={imp.isPending} onClick={() => ref.current?.click()}>
        <FileJson />
        Import JSON
      </Button>
      <input
        ref={ref}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          let json: unknown
          try {
            json = JSON.parse(await f.text())
          } catch {
            toast.error('File không phải JSON hợp lệ')
            return
          }
          imp.mutate(json, { onSuccess: (r) => toast.success(`Đã thêm ${(r as unknown[]).length} story`, 'Xếp theo độ ưu tiên trong file') })
        }}
      />
    </>
  )
}

export const STORY_SAMPLE = `{
  "label": "Tai nghe Pro X1",
  "productSlug": "tai-nghe-pro-x1",
  "thumbnail": "/media/products/tai-nghe-pro-x1/thumb.jpg",
  "media": { "type": "video", "src": "/media/videos/tai-nghe-pro-x1.mp4", "aspectRatio": "9:16" },
  "caption": "Chống ồn -35dB",
  "priority": 200,
  "hot": true
}`

export function SettingsPanel() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Cài đặt</h2>
      <DocForm<SiteSettings>
        doc="settings"
        title="Logo & ô tìm kiếm"
        description="Có ảnh logo đầy đủ thì thay cả biểu tượng lẫn chữ ở đầu trang. Biểu tượng vuông dùng ở footer, hộp đăng nhập."
        fields={[
          { key: 'logo.image', label: 'Ảnh logo đầy đủ (ngang, nền trong suốt)', type: 'media', wide: true },
          { key: 'logo.height', label: 'Chiều cao logo (px)', type: 'number', placeholder: '32' },
          { key: 'logo.text', label: 'Tên hiển thị', type: 'text', placeholder: 'Jamir' },
          { key: 'logo.icon', label: 'Biểu tượng vuông', type: 'media', wide: true },
          { key: 'searchPlaceholder', label: 'Chữ gợi ý ô tìm kiếm', type: 'text', wide: true, placeholder: 'AI tìm kiếm sản phẩm cho bạn…' },
        ]}
      />
      <DocForm<SiteSettings>
        doc="settings"
        title="Ô cam kết ở trang chủ"
        description="Tối đa 4 ô. Bật Nổi bật để ô đó có nền màu thương hiệu."
        fields={[{ key: 'usps', label: 'Các ô cam kết', type: 'usps', wide: true }]}
      />
      <DocForm<SiteSettings>
        doc="settings"
        title="Thông tin liên hệ (footer)"
        fields={[
          { key: 'hotline', label: 'Hotline', type: 'text' },
          { key: 'zalo', label: 'Link Zalo hỗ trợ', type: 'text' },
          { key: 'email', label: 'Email', type: 'text' },
          { key: 'kolContact', label: 'Liên hệ hợp tác KOC/KOL', type: 'text' },
          { key: 'community.zaloGroup', label: 'Cộng đồng Zalo', type: 'text' },
          { key: 'community.facebook', label: 'Cộng đồng Facebook', type: 'text' },
          { key: 'community.tiktok', label: 'TikTok', type: 'text' },
          { key: 'address', label: 'Địa chỉ', type: 'text', wide: true },
        ]}
      />
      <DocForm<SiteSettings>
        doc="settings"
        title="Giới hạn đánh giá"
        description="Mặc định: mỗi tài khoản chỉ được đánh giá 1 lần, đánh giá rồi thì không viết thêm cho sản phẩm nào khác. Khoảng thời gian 0 = vĩnh viễn; ví dụ 30 = sau 30 ngày được viết tiếp."
        fields={[
          {
            key: 'reviewLimit.scope',
            label: 'Tính theo',
            type: 'select',
            options: [
              { value: 'account', label: 'Cả tài khoản (mọi sản phẩm)' },
              { value: 'product', label: 'Từng sản phẩm' },
            ],
          },
          { key: 'reviewLimit.max', label: 'Số đánh giá tối đa', type: 'number', placeholder: '1' },
          { key: 'reviewLimit.windowDays', label: 'Trong khoảng (ngày, 0 = vĩnh viễn)', type: 'number', placeholder: '0' },
        ]}
      />
      <DocForm<SiteSettings>
        doc="settings"
        title="Nhãn trên thẻ sản phẩm"
        description="Nhãn như Bán chạy, Mới ra mắt trên ảnh sản phẩm liên quan. Để ít nhãn cho đỡ rối mắt."
        fields={[
          { key: 'relatedLabels.enabled', label: 'Hiện nhãn', type: 'switch' },
          { key: 'relatedLabels.max', label: 'Số thẻ tối đa có nhãn', type: 'number', placeholder: '2' },
          { key: 'forYouLabels.enabled', label: 'Hiện nhãn ở "Gợi ý cho bạn" (trang chủ)', type: 'switch' },
          { key: 'forYouLabels.max', label: 'Số thẻ tối đa có nhãn (trang chủ)', type: 'number', placeholder: '2' },
        ]}
      />
      <DocForm<SiteSettings>
        doc="settings"
        title="Chống spam đặt hàng"
        description="Mỗi số điện thoại / tài khoản / IP đặt quá số đơn này trong khoảng thời gian thì bị chặn đặt tiếp trong chừng đó giờ. Đặt 0 để tắt."
        fields={[
          { key: 'orderLimit.max', label: 'Số đơn tối đa', type: 'number', placeholder: '5' },
          { key: 'orderLimit.windowHours', label: 'Trong khoảng (giờ)', type: 'number', placeholder: '8' },
        ]}
      />
      <DocForm<Record<string, unknown>>
        doc="recommendations"
        title="Gợi ý sản phẩm"
        description='forYou: danh sách id cho "Gợi ý cho bạn"; related / boughtTogether: theo id sản phẩm; trendingSearches: từ khóa gợi ý.'
        fields={[
          { key: 'forYou', label: 'Gợi ý cho bạn', type: 'refs', ref: { collection: 'products' }, wide: true },
          { key: 'trendingSearches', label: 'Tìm kiếm phổ biến', type: 'tags', wide: true },
          { key: 'related', label: 'Sản phẩm liên quan (JSON)', type: 'json', wide: true },
          { key: 'boughtTogether', label: 'Thường mua cùng (JSON)', type: 'json', wide: true },
        ]}
      />
    </div>
  )
}

/* ---------------- demo review feeder ---------------- */

const POOL_SAMPLE = `[
  {
    "productSlug": "tai-nghe-pro-x1",
    "rating": 5,
    "name": "Nguyễn Văn A",
    "display": "anonymous",
    "content": "Chống ồn tốt, đeo lâu không đau tai."
  },
  {
    "productId": "airbuds-001",
    "rating": 4,
    "name": "Trần Thị B",
    "nickname": "b.tran",
    "display": "nickname",
    "content": "Kết nối nhanh, pin ổn, nút cảm ứng hơi nhạy.",
    "media": [{ "type": "image", "src": "/media/reviews/1.jpg", "thumbnail": "/media/reviews/1.jpg" }]
  }
]`

/** Posts pool reviews on a schedule — for testing the review flow with demo data. */
export function FeederPanel() {
  const qc = useQueryClient()
  const { data, isError, refetch } = useQuery({ queryKey: ['admin', 'feeder'], queryFn: adminApi.feeder, refetchInterval: 60_000 })
  const run = useAdminMutation(() => adminApi.runFeeder(), 'Đã chạy một lượt')
  const purge = useAdminMutation(() => adminApi.purgeSeeded())
  const ref = useRef<HTMLInputElement>(null)
  const imp = useAdminMutation((json: unknown) => adminApi.importPool(json))
  if (isError) return <SectionError onRetry={() => void refetch()} />
  const state = data?.state
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">Đánh giá demo (tự động)</h2>
        <p className="mt-1 text-sm text-muted">
          Dùng để test luồng đánh giá. Hệ thống lấy mẫu từ kho bên dưới và đăng vào sản phẩm theo lịch; mỗi đánh giá đăng ra được gắn nhãn
          <Badge size="sm" variant="warning" className="mx-1">Demo</Badge> trong trang quản trị, không có nhãn "Đã mua hàng", và xoá được toàn bộ bằng một nút.
        </p>
      </div>

      <PoolFormatGuide />

      <DocForm<SiteSettings>
        doc="settings"
        title="Lịch chạy"
        fields={[
          { key: 'reviewFeeder.enabled', label: 'Bật tự động đăng', type: 'switch' },
          { key: 'reviewFeeder.everyHours', label: 'Cách mỗi (giờ)', type: 'number', placeholder: '36', help: '24 = mỗi ngày, 48 = 2 ngày một lần' },
          { key: 'reviewFeeder.perRun', label: 'Số đánh giá mỗi lượt', type: 'number', placeholder: '2', help: 'Rải đều cho các sản phẩm khác nhau' },
          {
            key: 'reviewFeeder.sourceUrl',
            label: 'Nguồn ngoài (URL JSON, không bắt buộc)',
            type: 'text',
            wide: true,
            placeholder: 'https://example.com/reviews.json',
            help: 'Trước mỗi lượt, server tải JSON ở đây (mảng hoặc { items: [...] }, cùng định dạng file mẫu) và nạp thêm vào kho, bỏ qua mẫu trùng.',
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Info label="Lần chạy gần nhất" value={state?.lastRunAt ? fmtDate(state.lastRunAt) : 'Chưa chạy'} />
            <Info label="Mẫu còn trong kho" value={String(data?.poolCount ?? '…')} />
            <Info label="Đánh giá demo đang hiện" value={String(data?.seededCount ?? '…')} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button loading={run.isPending} onClick={() => run.mutate(undefined)}>
              <Play />
              Chạy ngay một lượt
            </Button>
            <Button variant="outline" loading={imp.isPending} onClick={() => ref.current?.click()}>
              <FileJson />
              Nạp kho từ file JSON
            </Button>
            <Button
              variant="ghost"
              className="text-danger"
              loading={purge.isPending}
              disabled={!data?.seededCount}
              onClick={() =>
                confirm(`Xóa ${data?.seededCount} đánh giá demo khỏi web?`) &&
                purge.mutate(undefined, { onSuccess: (r) => toast.success(`Đã xóa ${(r as { removed: number }).removed} đánh giá demo`) })
              }
            >
              <Trash2 />
              Xóa tất cả đánh giá demo
            </Button>
            <input
              ref={ref}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                try {
                  const json = JSON.parse(await f.text()) as unknown
                  imp.mutate(json, {
                    onSuccess: (r) => {
                      const x = r as { added: number; skipped: number }
                      toast.success(`Đã nạp ${x.added} mẫu`, x.skipped ? `${x.skipped} mẫu trùng bị bỏ qua` : undefined)
                      void qc.invalidateQueries({ queryKey: ['admin', 'feeder'] })
                    },
                  })
                } catch {
                  toast.error('File không phải JSON hợp lệ')
                }
              }}
            />
          </div>
          {!!state?.log?.length && (
            <ul className="max-h-48 overflow-y-auto rounded-[10px] bg-line-soft/60 p-3 font-mono text-xs text-ink-soft">
              {state.log.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ResourcePanel config={reviewPool} />

    </div>
  )
}

const AI_PROMPT = `Viết 20 đánh giá sản phẩm bằng tiếng Việt cho cửa hàng phụ kiện công nghệ, trả về đúng một mảng JSON, không giải thích.
Mỗi phần tử có các trường: productSlug, rating (1-5), name (họ tên người Việt), display ("full" | "nickname" | "anonymous"), nickname (chỉ khi display là "nickname"), content (1-3 câu, 60-200 ký tự).
Sản phẩm (productSlug): tai-nghe-pro-x1 (tai nghe chụp tai chống ồn), tai-nghe-airbuds (tai nghe không dây), loa-mini-s2 (loa bluetooth mini), sac-gan-65w (củ sạc nhanh), pin-du-phong-20000 (pin dự phòng), cap-usb-c-240w (cáp sạc), camera-home-c2 (camera an ninh).
Yêu cầu: giọng văn tự nhiên, mỗi đánh giá nói về một tình huống dùng cụ thể; 70% 5 sao, 25% 4 sao, 5% 3 sao; khoảng 1/3 đánh giá có nêu một điểm chưa ưng; không lặp ý giữa các đánh giá.`

function PoolFormatGuide() {
  const copy = (text: string, what: string) =>
    navigator.clipboard.writeText(text).then(
      () => toast.success(`Đã sao chép ${what}`),
      () => toast.error('Trình duyệt chặn sao chép, hãy bôi đen và copy tay'),
    )
  const download = () => {
    const url = URL.createObjectURL(new Blob([POOL_SAMPLE], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'jamir-review-pool.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Card>
      <CardHeader className="flex-wrap">
        <CardTitle>File JSON mẫu</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => copy(POOL_SAMPLE, 'file mẫu')}>
            Sao chép
          </Button>
          <Button variant="secondary" size="sm" onClick={download}>
            Tải file mẫu
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <pre className="overflow-x-auto rounded-[10px] bg-line-soft p-3 font-mono text-xs leading-relaxed">{POOL_SAMPLE}</pre>
        <ul className="ml-4 list-disc space-y-1 text-muted">
          <li>
            Bắt buộc: <code>content</code> (tối thiểu 10 ký tự) và <code>rating</code> từ 1 đến 5.
          </li>
          <li>
            Sản phẩm: <code>productSlug</code> (phần cuối URL, ví dụ <code>tai-nghe-pro-x1</code>) hoặc <code>productId</code>. Bỏ trống thì gắn sản phẩm ngẫu nhiên.
          </li>
          <li>
            <code>display</code>: <code>full</code> tên đầy đủ, <code>nickname</code> biệt danh (kèm <code>nickname</code>), <code>anonymous</code> ẩn danh. Bỏ trống thì ngẫu nhiên.
          </li>
          <li>
            Không bắt buộc: <code>name</code>, <code>avatar</code>, <code>media</code> (ảnh/video đính kèm). File có thể là một mảng hoặc <code>{'{ "items": [...] }'}</code>; mẫu trùng nội dung tự bị bỏ qua.
          </li>
        </ul>
        <div className="rounded-[12px] bg-brand-50/60 p-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="font-semibold text-brand-700">Nhờ AI viết nhanh 20 mẫu</p>
            <Button variant="outline" size="sm" onClick={() => copy(AI_PROMPT, 'câu lệnh')}>
              Sao chép câu lệnh
            </Button>
          </div>
          <p className="text-xs text-muted">Dán câu lệnh này vào ChatGPT, Claude hoặc Gemini, lưu kết quả thành file .json rồi bấm "Nạp kho từ file JSON".</p>
          <pre className="mt-2 max-h-40 overflow-y-auto rounded-[10px] bg-surface p-3 font-mono text-[11px] whitespace-pre-wrap text-ink-soft">{AI_PROMPT}</pre>
        </div>
      </CardContent>
    </Card>
  )
}
