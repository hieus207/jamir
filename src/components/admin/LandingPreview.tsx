import { ExternalLink, Monitor, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { paths } from '@/lib/paths'
import { PREVIEW_MESSAGE } from '@/lib/preview'

type Rec = Record<string, unknown>

const DEVICES = {
  desktop: { w: 1440, h: 900, label: 'Máy tính', icon: Monitor },
  mobile: { w: 390, h: 844, label: 'Điện thoại', icon: Smartphone },
} as const

/**
 * Live preview of the landing page being edited: the real page renders in an
 * iframe at device size (so one-screen layouts, vh units and sticky bars behave)
 * and is scaled down to fit; every edit is posted to it.
 */
export function LandingPreview({ draft }: { draft: Rec }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [device, setDevice] = useState<keyof typeof DEVICES>('desktop')
  const [width, setWidth] = useState(0)
  const [ready, setReady] = useState(false)
  const d = DEVICES[device]

  // fit the device frame into the column
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e!.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const scale = width ? Math.min(width / d.w, device === 'mobile' ? 0.8 : 1) : 0

  // the iframe says when it's listening
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === `${PREVIEW_MESSAGE}:ready`) setReady(true)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // push edits (lightly debounced)
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, page: draft }, window.location.origin), 150)
    return () => clearTimeout(t)
  }, [draft, ready, device])

  const slug = typeof draft.slug === 'string' ? draft.slug : ''
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold">Xem trước</p>
        <div className="ml-auto flex rounded-[10px] bg-line-soft p-0.5">
          {(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map((k) => {
            const D = DEVICES[k]
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setReady(false)
                  setDevice(k)
                }}
                aria-pressed={device === k}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-xs font-semibold',
                  device === k ? 'bg-surface text-brand-700 shadow-sm' : 'text-muted hover:text-ink',
                )}
              >
                <D.icon className="size-3.5" />
                {D.label}
              </button>
            )
          })}
        </div>
        {slug && (
          <a href={paths.landing(slug)} target="_blank" rel="noreferrer" title="Mở trang đã lưu" className="inline-flex size-7 items-center justify-center rounded-[8px] text-muted hover:bg-line-soft hover:text-ink">
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>
      <div ref={box} className="min-h-0 flex-1 overflow-auto rounded-[12px] bg-line-soft/70 p-2">
        {scale > 0 && (
          <div className="mx-auto overflow-hidden rounded-[10px] shadow-lift ring-1 ring-line" style={{ width: d.w * scale, height: d.h * scale }}>
            <iframe
              key={device}
              ref={frame}
              src="/preview/landing"
              title="Xem trước landing page"
              style={{ width: d.w, height: d.h, transform: `scale(${scale})`, transformOrigin: '0 0' }}
              className="border-0 bg-white"
            />
          </div>
        )}
      </div>
      <p className="text-[11px] text-subtle">Xem trước dùng video và đánh giá thật của sản phẩm. Thay đổi chỉ áp dụng cho khách sau khi bấm Lưu.</p>
    </div>
  )
}
