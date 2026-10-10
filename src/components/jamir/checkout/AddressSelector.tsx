import { MapPin, Plus } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'
import { FormField, Input } from '@/components/ui/input'
import { RadioCard, RadioGroup } from '@/components/ui/radio-group'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import { CITIES, type CheckoutForm } from './checkoutSchema'

/** Saved addresses as radio cards + an inline "new address" form. */
export function AddressSelector() {
  // isLoading (not isPending): for guests the query is disabled and would stay pending forever
  const { data: me, isLoading } = useCurrentUser()
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CheckoutForm>()
  const mode = watch('addressMode')
  const addressId = watch('addressId')
  const value = mode === 'new' ? 'new' : (addressId ?? '')
  const e = errors.newAddress

  if (isLoading) return <Skeleton className="h-36 rounded-btn" />

  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        aria-label="Địa chỉ nhận hàng"
        value={value}
        onValueChange={(v) => {
          if (v === 'new') setValue('addressMode', 'new')
          else {
            setValue('addressMode', 'saved')
            setValue('addressId', v as string, { shouldValidate: true })
          }
        }}
      >
        {me?.addresses?.map((a) => (
          <RadioCard key={a.id} value={a.id} className="items-start">
            <MapPin className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-ink">
                {a.recipient} <span className="font-normal text-muted">· {a.phone}</span>
                <span className="ml-2 rounded-md bg-line-soft px-1.5 py-0.5 text-[11px] font-semibold text-ink-soft">{a.label}</span>
              </p>
              <p className="mt-0.5 text-muted">
                {a.line}, {a.district}, {a.city}
              </p>
            </div>
          </RadioCard>
        ))}
        <RadioCard value="new">
          <Plus className="size-5 shrink-0 text-brand-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink">Giao đến địa chỉ khác</span>
        </RadioCard>
      </RadioGroup>

      <div className={cn('grid gap-3 rounded-btn bg-canvas p-3 sm:grid-cols-2', mode !== 'new' && 'hidden')}>
        <FormField label="Họ tên người nhận" error={e?.recipient?.message}>
          <Input autoComplete="name" placeholder="Nguyễn Văn A" {...register('newAddress.recipient')} />
        </FormField>
        <FormField label="Số điện thoại" error={e?.phone?.message}>
          <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="0912 345 678" {...register('newAddress.phone')} />
        </FormField>
        <FormField label="Địa chỉ" error={e?.line?.message} className="sm:col-span-2">
          <Input autoComplete="street-address" placeholder="Số nhà, tên đường, phường/xã" {...register('newAddress.line')} />
        </FormField>
        <FormField label="Quận / Huyện" error={e?.district?.message}>
          <Input placeholder="Quận Cầu Giấy" {...register('newAddress.district')} />
        </FormField>
        <FormField label="Tỉnh / Thành phố" error={e?.city?.message}>
          <Controller
            control={control}
            name="newAddress.city"
            render={({ field }) => (
              <Select
                aria-label="Tỉnh / Thành phố"
                value={field.value ?? null}
                onValueChange={field.onChange}
                placeholder="Chọn tỉnh / thành"
                options={CITIES.map((c) => ({ value: c, label: c }))}
              />
            )}
          />
        </FormField>
      </div>
    </div>
  )
}
