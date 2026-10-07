import { cn, formatPrice } from '@/lib/utils'

export function ProductPrice({
  price,
  originalPrice,
  discount,
  size = 'lg',
  className,
}: {
  price: number
  originalPrice?: number
  discount?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const hasDiscount = !!originalPrice && originalPrice > price
  return (
    <div className={cn('flex flex-wrap items-center gap-x-2.5 gap-y-1', className)}>
      <span
        className={cn(
          'font-extrabold tracking-tight text-brand-700 tabular-nums',
          size === 'lg' && 'text-[32px] leading-none md:text-[34px]',
          size === 'md' && 'text-xl leading-none',
          size === 'sm' && 'text-[15px]',
        )}
      >
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <>
          <span className={cn('text-subtle line-through tabular-nums', size === 'lg' ? 'text-base' : 'text-xs')}>
            <span className="sr-only">Giá gốc </span>
            {formatPrice(originalPrice)}
          </span>
          {!!discount && (
            <span
              className={cn(
                'rounded-lg bg-danger-strong font-bold text-white',
                size === 'lg' ? 'px-2 py-1 text-sm' : 'px-1.5 py-0.5 text-[11px]',
              )}
            >
              -{discount}%
            </span>
          )}
        </>
      )}
    </div>
  )
}
