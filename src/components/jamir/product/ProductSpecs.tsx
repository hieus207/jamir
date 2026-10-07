import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProductSpec } from '@/types/domain'
import { SpecGrid } from './SpecGrid'

/** "Thông số nổi bật" card. */
export function ProductSpecs({ specs, className }: { specs: ProductSpec[]; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle id="specs-title">Thông số nổi bật</CardTitle>
      </CardHeader>
      <CardContent>
        <SpecGrid specs={specs} />
      </CardContent>
    </Card>
  )
}
