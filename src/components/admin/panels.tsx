import { useQuery } from '@tanstack/react-query'
import { FileJson, MapPin, Search, ShoppingBag } from 'lucide-react'
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
