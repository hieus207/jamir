import { MessageCircleQuestion } from 'lucide-react'
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { useProductFaqs } from '@/hooks/queries'

export function ProductFaq({ productId, total, className }: { productId: string; total: number; className?: string }) {
  const { data: faqs, isPending } = useProductFaqs(productId)
  return (
    <Card id="faq" className={className}>
      <CardHeader>
        <CardTitle>
          Hỏi đáp khách hàng <span className="text-brand-600">({total})</span>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-brand-700"
          onClick={() => toast.info('Gửi câu hỏi', 'Tính năng đặt câu hỏi sẽ có khi kết nối backend.')}
        >
          <MessageCircleQuestion aria-hidden="true" />
          Đặt câu hỏi
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        {isPending ? (
          <div className="flex flex-col gap-3 py-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <Accordion>
            {faqs?.map((f, i) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger
                  aside={
                    <span className="shrink-0 text-xs font-medium text-muted tabular-nums" aria-label={`${f.answerCount} trả lời`}>
                      {f.answerCount}
                    </span>
                  }
                >
                  <span className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{f.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionPanel className="pl-9">{f.answer}</AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
