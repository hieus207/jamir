import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

export function PlaceOrderButton({ total, loading }: { total: number; loading: boolean }) {
  return (
    <Button type="submit" size="lg" className="h-[52px] w-full text-base" loading={loading}>
      {!loading && <Lock aria-hidden="true" />}
      {loading ? 'Đang đặt hàng…' : `Đặt hàng · ${formatPrice(total)}`}
    </Button>
  )
}
