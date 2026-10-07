import { useMutation } from '@tanstack/react-query'
import { MessageCircle, MessageCircleQuestion } from 'lucide-react'
import { useState } from 'react'
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from '@/components/ui/accordion'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { inputClass } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { useProductFaqs, useSettings } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import { ApiError, askQuestion } from '@/services'
import { useAuthDialog, useSession } from '../auth/authStore'
import { SectionError } from '../layout/PageStates'

/**
 * Q&A. Signed-in visitors can post a question (answered by the shop in the admin);
 * guests ask via Zalo or sign in.
 */
export function ProductFaq({ productId, total, className }: { productId: string; total: number; className?: string }) {
  const { data: faqs, isPending, isError, refetch } = useProductFaqs(productId)
  const { data: settings } = useSettings()
  const signedIn = useSession((s) => !!s.token)
  const showAuth = useAuthDialog((s) => s.show)
  const [asking, setAsking] = useState(false)
  const zalo = settings?.zalo ?? 'https://zalo.me'

  return (
    <Card id="faq" className={cn('scroll-mt-24', className)}>
      <CardHeader className="flex-wrap">
        <CardTitle>
          Hỏi đáp khách hàng <span className="text-brand-600">({faqs?.length ?? total})</span>
        </CardTitle>
        <div className="flex gap-1.5">
          {signedIn && (
            <Button variant="secondary" size="sm" onClick={() => setAsking(true)}>
              <MessageCircleQuestion aria-hidden="true" />
              Đặt câu hỏi
            </Button>
          )}
          <a href={zalo} target="_blank" rel="noreferrer" className={buttonVariants({ variant: signedIn ? 'ghost' : 'secondary', size: 'sm' })}>
            <MessageCircle aria-hidden="true" />
            Hỏi qua Zalo
          </a>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {!signedIn && (
          <p className="mb-2 rounded-[10px] bg-line-soft/70 px-3 py-2 text-xs text-muted">
            Muốn gửi câu hỏi công khai?{' '}
            <button type="button" onClick={() => showAuth('login')} className="cursor-pointer font-semibold text-brand-700 hover:underline">
              Đăng nhập
            </button>{' '}
            hoặc hỏi nhanh qua Zalo.
          </p>
        )}
        {isError ? (
          <SectionError onRetry={() => refetch()} />
        ) : isPending ? (
          <div className="flex flex-col gap-3 py-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !faqs?.length ? (
          <p className="py-4 text-center text-sm text-muted">Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
        ) : (
          <Accordion>
            {faqs.map((f, i) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger>
                  <span className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                    <span className="pt-0.5">{f.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionPanel className="pl-9">{f.answer}</AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
      <AskDialog productId={productId} open={asking} onClose={() => setAsking(false)} />
    </Card>
  )
}

function AskDialog({ productId, open, onClose }: { productId: string; open: boolean; onClose: () => void }) {
  const [text, setText] = useState('')
  const send = useMutation({
    mutationFn: () => askQuestion(productId, text.trim()),
    onSuccess: (r) => {
      toast.success('Đã gửi câu hỏi', r.message)
      setText('')
      onClose()
    },
    onError: (e) => toast.error('Chưa gửi được', e instanceof ApiError ? e.message : undefined),
  })
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-5 md:p-6" closeClassName="bg-line-soft text-ink-soft hover:bg-line">
        <DialogTitle>Đặt câu hỏi</DialogTitle>
        <DialogDescription className="mt-1">JAMIR sẽ trả lời và hiển thị câu hỏi cho mọi người cùng xem.</DialogDescription>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Ví dụ: Tai nghe có kết nối cùng lúc 2 thiết bị được không?"
          className={cn(inputClass, 'mt-4 h-auto min-h-28 py-2.5 leading-relaxed')}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={send.isPending} disabled={text.trim().length < 8} onClick={() => send.mutate()}>
            Gửi câu hỏi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
