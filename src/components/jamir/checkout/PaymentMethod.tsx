import { Controller, useFormContext } from 'react-hook-form'
import { RadioCard, RadioGroup } from '@/components/ui/radio-group'
import { Icon } from '@/lib/icons'
import { PAYMENT_METHODS } from '@/services'
import type { CheckoutForm } from './checkoutSchema'

export function PaymentMethod() {
  const { control } = useFormContext<CheckoutForm>()
  return (
    <Controller
      control={control}
      name="paymentMethod"
      render={({ field }) => (
        <RadioGroup aria-label="Phương thức thanh toán" value={field.value} onValueChange={field.onChange} className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_METHODS.map((m) => (
            <RadioCard key={m.id} value={m.id}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-brand-600">
                <Icon name={m.icon} className="size-5" />
              </span>
              <div className="min-w-0 text-sm">
                <p className="leading-tight font-semibold text-ink">{m.name}</p>
                <p className="truncate text-xs text-muted">{m.description}</p>
              </div>
            </RadioCard>
          ))}
        </RadioGroup>
      )}
    />
  )
}
