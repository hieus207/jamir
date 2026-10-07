import { Truck, Zap } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'
import { RadioCard, RadioGroup } from '@/components/ui/radio-group'
import { formatPrice } from '@/lib/utils'
import { getShippingFee, SHIPPING_METHODS } from '@/services'
import type { CheckoutForm } from './checkoutSchema'

export function ShippingMethod({ subtotal }: { subtotal: number }) {
  const { control } = useFormContext<CheckoutForm>()
  return (
    <Controller
      control={control}
      name="shippingMethod"
      render={({ field }) => (
        <RadioGroup aria-label="Phương thức giao hàng" value={field.value} onValueChange={field.onChange}>
          {SHIPPING_METHODS.map((m) => {
            const fee = getShippingFee(m.id, subtotal)
            return (
              <RadioCard key={m.id} value={m.id}>
                {m.id === 'express' ? (
                  <Zap className="size-5 shrink-0 fill-amber-300 text-orange-500" aria-hidden="true" />
                ) : (
                  <Truck className="size-5 shrink-0 text-brand-600" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-ink">{m.name}</p>
                  <p className="text-xs text-muted">
                    {m.eta} · {m.description}
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink tabular-nums">{fee === 0 ? <span className="text-success">Miễn phí</span> : formatPrice(fee)}</span>
              </RadioCard>
            )
          })}
        </RadioGroup>
      )}
    />
  )
}
