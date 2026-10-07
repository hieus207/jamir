import { MapPin, Package } from 'lucide-react'
import { useEffect } from 'react'
import { useAuthDialog } from '@/components/jamir/auth/AuthDialog'
import { PageHeader } from '@/components/jamir/layout/PageHeader'
import { StateBlock } from '@/components/jamir/layout/PageStates'
import { Avatar } from '@/components/ui/avatar'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser, useMyOrders, useProducts } from '@/hooks/queries'
import { formatPrice } from '@/lib/utils'
import { PAYMENT_METHODS, SHIPPING_METHODS } from '@/services'
import type { OrderStatus } from '@/types/domain'

const STATUS: Record<OrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
  pending: { label: 'Chờ xác nhận', variant: 'warning' },
  confirmed: { label: 'Đã xác nhận', variant: 'soft' },
  shipping: { label: 'Đang giao', variant: 'warning' },
  delivered: { label: 'Đã giao', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'danger-soft' },
}

const dateFmt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

export default function AccountPage() {
  const { data: me } = useCurrentUser()
  const { data: orders, isPending } = useMyOrders()
  const { data: products } = useProducts()
  const showAuth = useAuthDialog((s) => s.show)
  useEffect(() => {
    document.title = 'Tài khoản — JAMIR'
  }, [])
  const product = (id: string) => products?.find((p) => p.id === id)

  return (
    <div className="container-page flex flex-col gap-5 pt-4 pb-10 md:pt-6">
      <PageHeader title="Tài khoản" />
      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar src={me?.avatar} name={me?.name ?? 'J'} className="size-14" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold">{me?.name ?? '…'}</p>
            <p className="text-sm text-muted">{me?.phone} · Tài khoản demo</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => showAuth('login')}>
            Đăng nhập
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Đơn hàng của tôi</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isPending ? (
              Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-28 rounded-[14px]" />)
            ) : !orders?.length ? (
              <StateBlock icon={Package} title="Chưa có đơn hàng" />
            ) : (
              orders.map((o) => (
                <article key={o.id} className="rounded-[14px] border border-line p-4">
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold">#{o.id}</p>
                    <Badge variant={STATUS[o.status].variant}>{STATUS[o.status].label}</Badge>
                  </header>
                  <p className="mt-0.5 text-xs text-muted">{dateFmt.format(new Date(o.createdAt))}</p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {o.items.map((it) => {
                      const p = product(it.productId)
                      return (
                        <li key={it.productId + it.colorId} className="flex items-center gap-3">
                          <img src={p?.thumbnail} alt="" className="size-12 rounded-[10px] bg-canvas object-cover" />
                          <span className="min-w-0 flex-1 truncate text-sm">{p?.name}</span>
                          <span className="text-sm text-muted">× {it.quantity}</span>
                        </li>
                      )
                    })}
                  </ul>
                  <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm">
                    <span className="text-muted">
                      {SHIPPING_METHODS.find((s) => s.id === o.shippingMethod)?.name} · {PAYMENT_METHODS.find((p) => p.id === o.paymentMethod)?.name}
                    </span>
                    <span className="font-bold text-brand-700">{formatPrice(o.total)}</span>
                  </footer>
                </article>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Sổ địa chỉ</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {me?.addresses?.map((a) => (
              <div key={a.id} className="flex gap-3 rounded-[14px] bg-canvas p-3 text-sm">
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold">
                    {a.label} {a.isDefault && <Badge size="sm">Mặc định</Badge>}
                  </p>
                  <p className="text-muted">
                    {a.line}, {a.district}, {a.city}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
