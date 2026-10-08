import { Monitor, Smartphone, X } from 'lucide-react'
import { useState } from 'react'
import { BannerBody, ImageBody, popupWidth } from '@/components/jamir/layout/EventPopup'
import { PosterPopup } from '@/components/jamir/layout/PosterPopup'
import { cn } from '@/lib/utils'
import type { SiteEvent } from '@/types/domain'

type Rec = Record<string, unknown>

/** Live preview of the promo popup being edited, on a dimmed page like shoppers see it. */
export function EventPreview({ draft }: { draft: Rec }) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const event = {
    title: 'Tiêu đề sự kiện',
    image: '',
    active: true,
    priority: 0,
    frequency: 'daily',
    target: { type: 'product', value: '' },
    ...draft,
  } as SiteEvent
  const poster = event.style === 'poster'
  const width = device === 'mobile' ? 360 : popupWidth(event)

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold">Xem trước popup</p>
        <div className="ml-auto flex rounded-[10px] bg-line-soft p-0.5">
          {(
            [
              ['desktop', 'Máy tính', Monitor],
              ['mobile', 'Điện thoại', Smartphone],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setDevice(k)}
              aria-pressed={device === k}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-xs font-semibold',
                device === k ? 'bg-surface text-brand-700 shadow-sm' : 'text-muted hover:text-ink',
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* dimmed page behind the popup */}
      <div className="relative min-h-0 flex-1 overflow-auto rounded-[12px] bg-ink/70 p-6 [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0_1px,transparent_1px_40px)]">
        <div className="relative mx-auto" style={{ width, maxWidth: '100%' }}>
          <span className="absolute -top-3 -right-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/60 text-white">
            <X className="size-5" />
          </span>
          {poster ? (
            <PosterPopup event={event} onGo={() => {}} />
          ) : event.style === 'image' ? (
            <ImageBody event={event} onGo={() => {}} />
          ) : (
            <div className="overflow-hidden rounded-sheet bg-surface shadow-lift">
              <BannerBody event={event} onGo={() => {}} onLater={() => {}} />
            </div>
          )}
        </div>
      </div>
      <p className="text-[11px] text-subtle">Rộng {device === 'mobile' ? '360px (điện thoại)' : `${popupWidth(event)}px`}. Popup thật hiện sau khoảng 1,5 giây khi khách vào web, theo tần suất bạn chọn. Thay đổi chỉ áp dụng sau khi bấm Lưu.</p>
    </div>
  )
}
