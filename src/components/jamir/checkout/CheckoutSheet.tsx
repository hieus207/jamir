import { X } from 'lucide-react'
import { Drawer as BaseDrawer } from '@base-ui/react/drawer'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck, PackageCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { type ReactNode, useEffect, useState } from 'react'
import { ApiError } from '@/services'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { toast } from '@/components/ui/toast'
import { useCreateOrder, useCurrentUser } from '@/hooks/queries'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { cn, formatPrice } from '@/lib/utils'
import { getShippingFee, PAYMENT_METHODS, SHIPPING_METHODS } from '@/services'
import { useCartStore } from '@/stores/cartStore'
import { useCheckoutStore, useSavedVoucher } from '@/stores/checkoutStore'
import type { Order, PromotionCheck } from '@/types/domain'
import { PromoCodeField } from './PromoCodeField'
import { AddressSelector } from './AddressSelector'
import { type CheckoutForm, checkoutSchema, parseNewAddress } from './checkoutSchema'
import { OrderSummary } from './OrderSummary'
import { PaymentMethod } from './PaymentMethod'
import { PlaceOrderButton } from './PlaceOrderButton'
import { ProductSummary } from './ProductSummary'
import { ShippingMethod } from './ShippingMethod'

/**
 * Checkout without leaving the page.
 * Mobile: bottom sheet (swipe down). Desktop: right drawer (swipe right) — the product stays visible.
 */
export default function CheckoutSheet() {
  const isDesktop = useIsDesktop()
  const { open, setOpen } = useCheckoutStore()
  const [order, setOrder] = useState<Order | null>(null)

  const onOpenChange = (o: boolean) => {
    setOpen(o)
  }
  const onClosed = (o: boolean) => {
    if (!o) setOrder(null)
  }

  const body = order ? <OrderSuccess order={order} onDone={() => setOpen(false)} /> : <CheckoutBody onPlaced={setOrder} />

  if (isDesktop)
    return (
      <BaseDrawer.Root swipeDirection="right" open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onClosed}>
        <BaseDrawer.Portal>
          <BaseDrawer.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-ink opacity-[calc(0.45*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[400ms] ease-sheet data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[swiping]:duration-0" />
          <BaseDrawer.Viewport className="fixed inset-0 z-50 flex items-stretch justify-end">
            <BaseDrawer.Popup className="relative flex h-full w-[min(600px,100vw)] flex-col rounded-l-sheet bg-surface shadow-lift outline-none [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[400ms] ease-sheet data-[ending-style]:[transform:translateX(100%)] data-[starting-style]:[transform:translateX(100%)] data-[swiping]:select-none">
              <BaseDrawer.Close
                aria-label="Đóng"
                className="absolute top-3 right-3 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-line-soft text-ink-soft transition-colors hover:bg-line"
              >
                <X className="size-5" />
              </BaseDrawer.Close>
              <BaseDrawer.Content className="flex min-h-0 flex-1 flex-col">
                <Header Title={DrawerTitle} order={order} />
                {body}
              </BaseDrawer.Content>
            </BaseDrawer.Popup>
          </BaseDrawer.Viewport>
        </BaseDrawer.Portal>
      </BaseDrawer.Root>
    )

  return (
    <Drawer open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onClosed}>
      <BaseDrawer.VirtualKeyboardProvider>
        <DrawerContent>
          <Header Title={DrawerTitle} order={order} />
          {body}
        </DrawerContent>
      </BaseDrawer.VirtualKeyboardProvider>
    </Drawer>
  )
}

function Header({ Title, order }: { Title: typeof DialogTitle; order: Order | null }) {
  return (
    <div className="shrink-0 border-b border-line px-5 pt-2 pb-3 md:pt-5">
      <Title className="text-lg font-bold">{order ? 'Đặt hàng thành công' : 'Xác nhận đơn hàng'}</Title>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {children}
    </section>
  )
}

function CheckoutBody({ onPlaced }: { onPlaced: (o: Order) => void }) {
  const { lines, source, setQuantity } = useCheckoutStore()
  const clearCart = useCartStore((s) => s.clear)
  const { data: me } = useCurrentUser()
  const createOrder = useCreateOrder()
  const [promo, setPromo] = useState<PromotionCheck | null>(null)
  const hasSaved = !!me?.addresses?.length

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      addressMode: hasSaved ? 'saved' : 'new',
      addressId: undefined,
      newAddress: { recipient: me?.name ?? '', phone: me?.phone ?? '', line: '', district: '', city: '' },
      shippingMethod: 'express',
      paymentMethod: 'cod',
      note: '',
    },
  })

  // pick the default saved address once the profile loads
  useEffect(() => {
    const def = me?.addresses?.find((a) => a.isDefault) ?? me?.addresses?.[0]
    if (def && !form.getValues('addressId')) {
      form.setValue('addressId', def.id)
      form.setValue('addressMode', 'saved')
    }
  }, [me, form])

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.quantity, 0)
  const savings = lines.reduce((s, l) => s + Math.max(0, l.product.originalPrice - l.product.price) * l.quantity, 0)
  const baseFee = getShippingFee(form.watch('shippingMethod'), subtotal)
  const shippingFee = promo?.freeShipping ? 0 : baseFee
  const discount = promo && !promo.freeShipping ? promo.discount : 0
  const promoItems = lines.map((l) => ({ productId: l.product.id, quantity: l.quantity }))

  const onSubmit = form.handleSubmit(async (v) => {
    const saved = me?.addresses?.find((a) => a.id === v.addressId)
    const address =
      v.addressMode === 'saved' && saved
        ? { id: saved.id, recipient: saved.recipient, phone: saved.phone, line: saved.line, district: saved.district, city: saved.city }
        : parseNewAddress(v.newAddress)
    try {
      const order = await createOrder.mutateAsync({
        items: lines.map((l) => ({ productId: l.product.id, colorId: l.colorId, quantity: l.quantity, unitPrice: l.product.price })),
        address,
        shippingMethod: v.shippingMethod,
        paymentMethod: v.paymentMethod,
        note: v.note || undefined,
        promoCode: promo?.code,
      })
      if (source === 'cart') clearCart()
      useSavedVoucher.getState().save(null)
      onPlaced(order)
    } catch (e) {
      toast.error('Đặt hàng thất bại', e instanceof ApiError ? e.message : 'Vui lòng thử lại sau ít phút.')
    }
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <div className="flex flex-col gap-6">
            <Section title={`Sản phẩm (${lines.reduce((n, l) => n + l.quantity, 0)})`}>
              <ProductSummary lines={lines} onQuantityChange={setQuantity} />
            </Section>
            <Section title="Địa chỉ nhận hàng">
              <AddressSelector />
            </Section>
            <Section title="Phương thức giao hàng">
              <ShippingMethod subtotal={subtotal} />
            </Section>
            <Section title="Mã giảm giá">
              <PromoCodeField items={promoItems} shippingFee={baseFee} applied={promo} onChange={setPromo} />
            </Section>
            <Section title="Phương thức thanh toán">
              <PaymentMethod />
            </Section>
            <Section title="Ghi chú cho shop">
              <textarea
                {...form.register('note')}
                rows={2}
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao…"
                className="w-full resize-none rounded-btn border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-subtle focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none"
              />
            </Section>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-3 border-t border-line bg-surface px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_20px_-14px_rgb(17_24_39/0.2)]">
          <OrderSummary subtotal={subtotal} shippingFee={shippingFee} savings={savings} promo={promo ? { code: promo.code, discount, freeShipping: promo.freeShipping } : undefined} />
          <PlaceOrderButton total={subtotal + shippingFee - discount} loading={form.formState.isSubmitting} />
        </div>
      </form>
    </FormProvider>
  )
}

function OrderSuccess({ order, onDone }: { order: Order; onDone: () => void }) {
  const navigate = useNavigate()
  const shipping = SHIPPING_METHODS.find((s) => s.id === order.shippingMethod)
  const payment = PAYMENT_METHODS.find((p) => p.id === order.paymentMethod)
  return (
    <div className="flex flex-1 flex-col items-center gap-5 overflow-y-auto px-6 py-8 text-center">
      <motion.span
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        className="flex size-20 items-center justify-center rounded-full bg-success-50"
      >
        <CircleCheck className="size-11 text-success-strong" aria-hidden="true" />
      </motion.span>
      <div>
        <p className="text-xl font-extrabold text-ink">Cảm ơn bạn đã mua hàng!</p>
        <p className="mt-1 text-sm text-muted">
          Mã đơn <span className="font-bold text-ink">#{order.id}</span> · {shipping?.eta}
        </p>
      </div>
      <dl className="w-full max-w-sm divide-y divide-line rounded-card border border-line text-left text-sm">
        {[
          ['Giao hàng', shipping?.name],
          ['Thanh toán', payment?.name],
          ...(order.discount ? [['Giảm giá' + (order.promoCode ? ` (${order.promoCode})` : ''), `-${formatPrice(order.discount)}`]] : []),
          ['Tổng tiền', formatPrice(order.total)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 px-4 py-3">
            <dt className="text-muted">{k}</dt>
            <dd className={cn('text-right font-semibold', k === 'Tổng tiền' && 'text-brand-700')}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="flex-1" onClick={onDone}>
          Tiếp tục mua sắm
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            onDone()
            navigate('/account')
          }}
        >
          <PackageCheck aria-hidden="true" />
          Xem đơn hàng
        </Button>
      </div>
    </div>
  )
}
