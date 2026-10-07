import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/components/jamir/auth/authStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input, inputClass } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { ApiError, createReview } from '@/services'
import type { Product, ReviewerDisplay } from '@/types/domain'

/** Same masking as the server: last 3 characters hidden. */
export const maskName = (name: string) => {
  const n = name.trim()
  return n.length <= 4 ? `${n.charAt(0) || '*'}***` : `${n.slice(0, -3)}***`
}

const LABELS = ['', 'Rất tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời']

export function WriteReviewDialog({ product, open, onClose }: { product: Product; open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const user = useSession((s) => s.user)
  const name = user?.name ?? 'Bạn'
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [content, setContent] = useState('')
  const [colorId, setColorId] = useState<string | null>(product.colors[0]?.id ?? null)
  const [display, setDisplay] = useState<ReviewerDisplay>('full')
  const [nickname, setNickname] = useState('')

  const send = useMutation({
    mutationFn: () => createReview(product.id, { rating, content, colorId: colorId ?? undefined, display, nickname: nickname || undefined }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reviews', product.id] })
      void qc.invalidateQueries({ queryKey: ['review-eligibility', product.id] })
      toast.success('Cảm ơn bạn đã đánh giá!', 'Đánh giá của bạn đã được đăng.')
      onClose()
    },
    onError: (e) => toast.error('Chưa gửi được', e instanceof ApiError ? e.message : undefined),
  })

  const shown = display === 'anonymous' ? maskName(name) : display === 'nickname' ? nickname.trim() || 'Biệt danh của bạn' : name
  const options: { value: ReviewerDisplay; title: string; sub: string }[] = [
    { value: 'full', title: 'Tên đầy đủ', sub: name },
    { value: 'nickname', title: 'Biệt danh', sub: 'Tên bạn tự đặt' },
    { value: 'anonymous', title: 'Ẩn danh', sub: maskName(name) },
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg overflow-y-auto p-5 md:p-6" closeClassName="bg-line-soft text-ink-soft hover:bg-line">
        <DialogTitle>Đánh giá {product.name}</DialogTitle>
        <DialogDescription className="mt-1">Chia sẻ trải nghiệm thật giúp người khác chọn đúng.</DialogDescription>

        <div className="mt-4 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-label={`${n} sao`} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} className="cursor-pointer p-0.5">
              <Star className={cn('size-8 transition-transform hover:scale-110', n <= (hover || rating) ? 'fill-star text-star' : 'text-line')} />
            </button>
          ))}
          <span className="ml-2 text-sm font-semibold text-ink-soft">{LABELS[hover || rating]}</span>
        </div>

        {product.colors.length > 1 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold text-ink-soft">Phân loại đã mua</p>
            <Select value={colorId} onValueChange={setColorId} options={product.colors.map((c) => ({ value: c.id, label: c.name }))} />
          </div>
        )}

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-ink-soft">Nội dung đánh giá</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            placeholder="Bạn dùng sản phẩm trong hoàn cảnh nào? Điểm thích và chưa thích là gì?"
            className={cn(inputClass, 'h-auto min-h-28 py-2.5 leading-relaxed')}
          />
          <p className="mt-1 text-right text-xs text-subtle">{content.trim().length}/2000 (tối thiểu 10)</p>
        </div>

        <div className="mt-2">
          <p className="mb-1.5 text-xs font-semibold text-ink-soft">Hiển thị tên</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Hiển thị tên">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={display === o.value}
                onClick={() => setDisplay(o.value)}
                className={cn(
                  'cursor-pointer rounded-[12px] border p-2.5 text-left transition-colors',
                  display === o.value ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-brand-300',
                )}
              >
                <span className="block text-sm font-semibold">{o.title}</span>
                <span className="block truncate text-xs text-muted">{o.sub}</span>
              </button>
            ))}
          </div>
          {display === 'nickname' && (
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={40} placeholder="Ví dụ: Long Audio" className="mt-2" />
          )}
          <p className="mt-2 text-xs text-muted">
            Sẽ hiện là: <span className="font-semibold text-ink">{shown}</span>
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={send.isPending} disabled={content.trim().length < 10 || (display === 'nickname' && !nickname.trim())} onClick={() => send.mutate()}>
            Đăng đánh giá
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
