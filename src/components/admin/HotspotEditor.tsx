import { Copy, MousePointerClick, Play, ShoppingCart, SquareDashedMousePointer, Trash2 } from 'lucide-react'
import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { LandingHotspot } from '@/types/domain'
import { MediaInput, Switch, useAdminList } from './fields'

type Rec = Record<string, unknown>
type Spot = LandingHotspot

const ACTIONS: { value: Spot['action']; label: string }[] = [
  { value: 'buy', label: '🛒 Mua hàng (mở checkout)' },
  { value: 'video', label: '▶ Phát video (popup)' },
  { value: 'product', label: 'Mở trang sản phẩm' },
  { value: 'reviews', label: 'Xem đánh giá' },
  { value: 'color', label: 'Chọn màu' },
  { value: 'cart', label: 'Mở giỏ hàng' },
  { value: 'link', label: 'Mở link' },
]
const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n))
const round = (n: number) => Math.round(n * 10) / 10

/** Summary in the form + button that opens the full-screen editor. */
export function HotspotField({ record, onChange }: { record: Rec; onChange: (r: Rec) => void }) {
  const [open, setOpen] = useState(false)
  const spots = (record.hotspots as Spot[] | undefined) ?? []
  const image = (record.designImage as string | undefined) || ''
  const count = (a: Spot['action']) => spots.filter((s) => s.action === a).length
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-line p-3">
      <SquareDashedMousePointer className="size-6 text-brand-600" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">{spots.length} vùng bấm</p>
        <p className="text-xs text-muted">
          {count('buy')} nút mua · {count('video')} video · {spots.length - count('buy') - count('video')} khác
        </p>
      </div>
      <Button onClick={() => setOpen(true)} disabled={!image} title={image ? undefined : 'Up ảnh thiết kế trước'}>
        <MousePointerClick />
        Chỉnh vùng bấm trên ảnh
      </Button>
      {open && (
        <HotspotEditor
          image={image}
          productId={String(record.productId ?? '')}
          spots={spots}
          onClose={() => setOpen(false)}
          onSave={(hotspots) => {
            onChange({ ...record, hotspots })
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

/**
 * Full-screen editor: drag on the image to draw an area, drag an area to move
 * it, drag its corner to resize; the panel sets what a click does. Del removes,
 * arrow keys nudge (Shift = bigger steps).
 */
function HotspotEditor({
  image,
  productId,
  spots: initial,
  onSave,
  onClose,
}: {
  image: string
  productId: string
  spots: Spot[]
  onSave: (s: Spot[]) => void
  onClose: () => void
}) {
  const [spots, setSpots] = useState<Spot[]>(initial)
  const [sel, setSel] = useState<number | null>(initial.length ? 0 : null)
  const [draft, setDraft] = useState<Spot | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const drag = useRef<{ mode: 'draw' | 'move' | 'resize'; i: number; x: number; y: number; orig: Spot } | null>(null)
  const { data: products } = useAdminList<Rec & { id: string }>('products')
  const { data: kol } = useAdminList<Rec & { id: string }>('kol-reviews')
  const landingProduct = products?.find((p) => p.id === productId)
  const productVideos = (kol ?? []).filter((v) => v.productId === productId)

  const pct = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect()
    return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) }
  }
  const update = (i: number, p: Partial<Spot>) => setSpots((all) => all.map((s, j) => (j === i ? { ...s, ...p } : s)))

  const onDown = (e: ReactPointerEvent, i: number | null, mode: 'move' | 'resize' | 'draw') => {
    e.stopPropagation()
    e.preventDefault()
    box.current!.setPointerCapture(e.pointerId)
    const p = pct(e)
    if (mode === 'draw') {
      const d: Spot = { x: p.x, y: p.y, w: 0, h: 0, action: 'buy', label: '' }
      setDraft(d)
      drag.current = { mode, i: -1, x: p.x, y: p.y, orig: d }
    } else {
      setSel(i)
      drag.current = { mode, i: i!, x: p.x, y: p.y, orig: { ...spots[i!]! } }
    }
  }
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    const p = pct(e)
    if (d.mode === 'draw') {
      setDraft({ ...d.orig, x: Math.min(d.x, p.x), y: Math.min(d.y, p.y), w: Math.abs(p.x - d.x), h: Math.abs(p.y - d.y) })
    } else if (d.mode === 'move') {
      update(d.i, { x: round(clamp(d.orig.x + p.x - d.x, 0, 100 - d.orig.w)), y: round(clamp(d.orig.y + p.y - d.y, 0, 100 - d.orig.h)) })
    } else {
      update(d.i, { w: round(clamp(d.orig.w + p.x - d.x, 1, 100 - d.orig.x)), h: round(clamp(d.orig.h + p.y - d.y, 1, 100 - d.orig.y)) })
    }
  }
  const onUp = () => {
    const d = drag.current
    drag.current = null
    if (d?.mode === 'draw' && draft) {
      if (draft.w > 1.2 && draft.h > 0.8) {
        const s = { ...draft, x: round(draft.x), y: round(draft.y), w: round(draft.w), h: round(draft.h), label: `Vùng ${spots.length + 1}`, pulse: true, play: true }
        setSpots((all) => [...all, s])
        setSel(spots.length)
      }
      setDraft(null)
    }
  }

  const add = (action: 'buy' | 'video') => {
    const s: Spot =
      action === 'buy'
        ? { x: 60, y: 88, w: 34, h: 8, action, label: 'Mua ngay', pulse: true, productSlug: String(landingProduct?.slug ?? '') }
        : { x: 35, y: 35, w: 22, h: 22, action, label: 'Video', play: true, value: productVideos[0]?.id }
    setSpots((all) => [...all, s])
    setSel(spots.length)
  }

  // keyboard: delete / nudge
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sel === null || (e.target as HTMLElement).closest('input,textarea,select,[role=combobox]')) return
      const step = e.shiftKey ? 2 : 0.2
      const s = spots[sel]
      if (!s) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setSpots((all) => all.filter((_, j) => j !== sel))
        setSel(null)
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault()
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        update(sel, { x: round(clamp(s.x + dx, 0, 100 - s.w)), y: round(clamp(s.y + dy, 0, 100 - s.h)) })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel, spots])

  const s = sel !== null ? spots[sel] : undefined
  const productOpts = (products ?? []).map((p) => ({ value: String(p.slug), label: String(p.name) }))
  const colorOpts = ((landingProduct?.colors as { id: string; name: string }[] | undefined) ?? []).map((c) => ({ value: c.id, label: c.name }))

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-w-[min(1500px,100%)] flex-col" closeClassName="bg-line-soft text-ink-soft hover:bg-line">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3 pr-14">
          <DialogTitle>Vùng bấm trên ảnh</DialogTitle>
          <p className="text-xs text-muted">Kéo trên ảnh để vẽ vùng mới · kéo vùng để di chuyển · kéo góc để đổi cỡ · Del để xoá · phím mũi tên để nhích</p>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => add('video')}>
              <Play />
              Thêm vùng video
            </Button>
            <Button variant="outline" size="sm" onClick={() => add('buy')}>
              <ShoppingCart />
              Thêm nút mua
            </Button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* canvas */}
          <div className="min-h-0 overflow-auto bg-[#1a1a1d] p-4" onPointerDown={() => setSel(null)}>
            <div
              ref={box}
              className="relative mx-auto w-full max-w-[760px] cursor-crosshair touch-none select-none"
              onPointerDown={(e) => onDown(e, null, 'draw')}
              onPointerMove={onMove}
              onPointerUp={onUp}
            >
              <img src={image} alt="" draggable={false} className="pointer-events-none block w-full" />
              {spots.map((sp, i) => (
                <div
                  key={i}
                  onPointerDown={(e) => onDown(e, i, 'move')}
                  className={cn(
                    'absolute cursor-move rounded-[6px] border-2',
                    sp.action === 'buy' ? 'border-[#ff2d3d] bg-[#ff2d3d]/20' : sp.action === 'video' ? 'border-[#25f4ee] bg-[#25f4ee]/20' : 'border-[#ffe52e] bg-[#ffe52e]/20',
                    sel === i && 'ring-4 ring-white/80',
                  )}
                  style={{ left: `${sp.x}%`, top: `${sp.y}%`, width: `${sp.w}%`, height: `${sp.h}%` }}
                >
                  <span className="pointer-events-none absolute -top-5 left-0 rounded bg-black/80 px-1.5 text-[11px] font-bold whitespace-nowrap text-white">
                    {i + 1}. {sp.label || sp.action}
                  </span>
                  {sp.action === 'video' && sp.play !== false && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <Play className="size-6 fill-white text-white drop-shadow" />
                    </span>
                  )}
                  <span
                    onPointerDown={(e) => onDown(e, i, 'resize')}
                    className="absolute -right-1.5 -bottom-1.5 size-3.5 cursor-nwse-resize rounded-sm border-2 border-white bg-black"
                  />
                </div>
              ))}
              {draft && (
                <div className="pointer-events-none absolute border-2 border-dashed border-white bg-white/15" style={{ left: `${draft.x}%`, top: `${draft.y}%`, width: `${draft.w}%`, height: `${draft.h}%` }} />
              )}
            </div>
          </div>

          {/* panel */}
          <div className="flex min-h-0 flex-col border-l border-line">
            <div className="max-h-[38%] shrink-0 overflow-y-auto border-b border-line p-3">
              <p className="mb-2 text-xs font-bold text-muted uppercase">Các vùng ({spots.length})</p>
              <ul className="flex flex-col gap-1">
                {spots.map((sp, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setSel(i)}
                      className={cn('flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-sm', sel === i ? 'bg-brand-50 text-brand-700' : 'hover:bg-line-soft')}
                    >
                      <span className={cn('size-2.5 rounded-full', sp.action === 'buy' ? 'bg-[#ff2d3d]' : sp.action === 'video' ? 'bg-[#25f4ee]' : 'bg-[#ffe52e]')} />
                      <span className="min-w-0 flex-1 truncate">
                        {i + 1}. {sp.label || '—'}
                      </span>
                      <span className="text-xs text-muted">{ACTIONS.find((a) => a.value === sp.action)?.label.replace(/^\S+ /, '')}</span>
                    </button>
                  </li>
                ))}
                {!spots.length && <li className="text-sm text-muted">Chưa có vùng nào. Kéo chuột trên ảnh để vẽ.</li>}
              </ul>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {!s ? (
                <p className="text-sm text-muted">Chọn một vùng để chỉnh.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <Labeled label="Tên vùng (hiện khi rê chuột, đọc cho người khiếm thị)">
                    <Input value={s.label ?? ''} onChange={(e) => update(sel!, { label: e.target.value })} />
                  </Labeled>
                  <Labeled label="Khi bấm">
                    <Select value={s.action} onValueChange={(v) => update(sel!, { action: v as Spot['action'] })} options={ACTIONS} />
                  </Labeled>

                  {s.action === 'buy' && (
                    <>
                      <Labeled label="Sản phẩm sẽ mua">
                        <Select
                          value={s.productSlug || String(landingProduct?.slug ?? '') || null}
                          onValueChange={(v) => update(sel!, { productSlug: v })}
                          options={productOpts}
                        />
                      </Labeled>
                      <Toggle label="Hiệu ứng nhấp nháy thu hút" checked={s.pulse !== false} onChange={(v) => update(sel!, { pulse: v })} />
                    </>
                  )}

                  {s.action === 'video' && (
                    <>
                      <Labeled label="Video KOL của sản phẩm">
                        <Select
                          value={s.videoUrl ? '' : (s.value ?? '')}
                          onValueChange={(v) => update(sel!, { value: v || undefined, videoUrl: v ? undefined : s.videoUrl })}
                          options={[{ value: '', label: '— Dùng link / file bên dưới —' }, ...productVideos.map((v) => ({ value: v.id, label: String(v.title) }))]}
                        />
                      </Labeled>
                      <Labeled label="Hoặc link YouTube / TikTok / Facebook, hoặc tải file video">
                        <MediaInput value={s.videoUrl ?? ''} onChange={(v) => update(sel!, { videoUrl: v || undefined })} accept="video" />
                      </Labeled>
                      <Toggle label="Hiện nút ▶ trên vùng" checked={s.play !== false} onChange={(v) => update(sel!, { play: v })} />
                    </>
                  )}

                  {s.action === 'color' && (
                    <Labeled label="Màu">
                      <Select value={s.value ?? null} onValueChange={(v) => update(sel!, { value: v })} options={colorOpts} />
                    </Labeled>
                  )}
                  {s.action === 'link' && (
                    <Labeled label="Đường dẫn">
                      <Input value={s.value ?? ''} onChange={(e) => update(sel!, { value: e.target.value })} placeholder="https://… hoặc /san-pham/…" />
                    </Labeled>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                    {(['x', 'y', 'w', 'h'] as const).map((k) => (
                      <Labeled key={k} label={{ x: 'Trái %', y: 'Trên %', w: 'Rộng %', h: 'Cao %' }[k]}>
                        <Input type="number" step={0.1} value={s[k]} onChange={(e) => update(sel!, { [k]: round(clamp(Number(e.target.value) || 0)) })} />
                      </Labeled>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSpots((all) => [...all, { ...s, x: clamp(s.x + 2, 0, 100 - s.w), y: clamp(s.y + 2, 0, 100 - s.h), label: `${s.label ?? ''} (bản sao)` }])
                        setSel(spots.length)
                      }}
                    >
                      <Copy />
                      Nhân bản
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      onClick={() => {
                        setSpots((all) => all.filter((_, j) => j !== sel))
                        setSel(null)
                      }}
                    >
                      <Trash2 />
                      Xoá vùng
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
          <p className="mr-auto text-xs text-muted">
            <span className="mr-3 inline-flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#ff2d3d]" /> Mua hàng</span>
            <span className="mr-3 inline-flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#25f4ee]" /> Video</span>
            <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#ffe52e]" /> Khác</span>
          </p>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={() => onSave(spots)}>
            Áp dụng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <Switch checked={checked} onChange={onChange} label={label} />
      <span className="text-sm">{label}</span>
    </div>
  )
}
