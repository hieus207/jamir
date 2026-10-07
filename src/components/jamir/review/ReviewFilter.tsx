import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs'
import type { ReviewSort } from '@/types/domain'

const OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: 'featured', label: 'Nổi bật' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'media', label: 'Có hình ảnh / video' },
]

export function ReviewFilter({ value, onChange }: { value: ReviewSort; onChange: (v: ReviewSort) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ReviewSort)}>
      <TabsList aria-label="Lọc đánh giá" className="max-w-full overflow-x-auto scrollbar-none">
        {OPTIONS.map((o) => (
          <TabsTab key={o.value} value={o.value}>
            {o.label}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  )
}
