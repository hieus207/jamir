import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff, ImagePlus, Plus, Trash2, Upload } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FormField, Input, inputClass } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { adminApi, ApiError, type AdminCollection } from '@/services'
import type { ProductGift, UspItem } from '@/types/domain'
import { DEFAULT_USPS } from '@/lib/brand'
import { Icon, ICON_NAMES } from '@/lib/icons'
import { type VideoKeys, VideoSourceField } from './VideoSourceField'
import { ChaptersEditor } from './ChaptersEditor'
import { HotspotField } from './HotspotEditor'

type Rec = Record<string, unknown>

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'switch'
  | 'select'
  | 'media'
  | 'tags'
  | 'datetime'
  | 'ref'
  | 'refs'
  | 'gifts'
  | 'json'
  | 'video'
  | 'chips'
  | 'chapters'
  | 'lines'
  | 'target'
  | 'usps'
  | 'hotspots'
  | 'icon'

export interface FieldDef {
  /** dot path into the record, e.g. "media.src" */
  key: string
  label: string
  type: FieldType
  required?: boolean
  help?: string
  placeholder?: string
  /** select options */
  options?: { value: string; label: string }[]
  /** select: store the chosen value as a number */
  numeric?: boolean
  /** ref/refs: collection to pick from, and which field identifies an item */
  ref?: {
    collection: AdminCollection
    valueKey?: string
    labelKey?: string
    /** only items whose `field` equals the record's value at `sameAs` (e.g. reviews of the chosen product) */
    where?: { field: string; sameAs: string }
  }
  /** video: record paths for source / file / embed / pasted link / frame */
  video?: VideoKeys
  /** media: what can be uploaded */
  accept?: 'image' | 'video' | 'any'
  /** span both columns */
  wide?: boolean
  /** hide the field unless this returns true for the record being edited */
  showIf?: (record: Rec) => boolean
}

/* ---- dot-path helpers ---- */

export function getPath(obj: Rec, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Rec)[k] : undefined), obj)
}

export function setPath(obj: Rec, path: string, value: unknown): Rec {
  const [head, ...rest] = path.split('.')
  if (!rest.length) return { ...obj, [head!]: value }
  const child = obj[head!] && typeof obj[head!] === 'object' ? (obj[head!] as Rec) : {}
  return { ...obj, [head!]: setPath(child, rest.join('.'), value) }
}

/** Cached admin list used by pickers and the panels. */
export const useAdminList = <T = Rec & { id: string },>(c: AdminCollection) =>
  useQuery({ queryKey: ['admin', c], queryFn: () => adminApi.list<T>(c) })

/* ---- small controls ---- */

export function Switch({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        checked ? 'bg-brand-600' : 'bg-line',
        className,
      )}
    >
      <span className={cn('size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5.5' : 'translate-x-0.5')} />
    </button>
  )
}

const textareaClass = cn(inputClass, 'h-auto min-h-24 py-2.5 leading-relaxed')

function toLocalInput(iso: unknown) {
  if (typeof iso !== 'string' || !iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const off = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

export function MediaInput({
  value,
  onChange,
  accept = 'image',
}: {
  value: string
  onChange: (v: string) => void
  accept?: FieldDef['accept']
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const isVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(value)
  const upload = async (file: File) => {
    setBusy(true)
    try {
      onChange((await adminApi.upload(file)).url)
      toast.success('Đã tải lên', file.name)
    } catch (e) {
      toast.error('Tải lên thất bại', e instanceof ApiError ? e.message : undefined)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-line-soft text-subtle ring-1 ring-line">
        {value ? (
          isVideo ? (
            <video src={value} muted className="size-full object-cover" />
          ) : (
            <img src={value} alt="" className="size-full object-cover" />
          )
        ) : (
          <ImagePlus className="size-5" />
        )}
      </span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/media/... hoặc https://..." className="min-w-0 flex-1" />
      <Button variant="outline" size="icon" loading={busy} onClick={() => fileRef.current?.click()} aria-label="Tải file lên">
        {!busy && <Upload />}
      </Button>
      <input
        ref={fileRef}
        type="file"
        hidden
        accept={accept === 'video' ? 'video/*' : accept === 'any' ? 'image/*,video/*' : 'image/*'}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void upload(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

/** List for a ref field, narrowed by `where` when set. */
function useRefItems(field: FieldDef, record?: Rec) {
  const { data } = useAdminList(field.ref!.collection)
  const w = field.ref!.where
  if (!w || !record) return data
  const want = getPath(record, w.sameAs)
  return want ? data?.filter((x) => (x as Rec)[w.field] === want) : []
}

function RefSelect({ field, value, onChange, record }: { field: FieldDef; value: string; onChange: (v: string) => void; record?: Rec }) {
  const data = useRefItems(field, record)
  const vk = field.ref!.valueKey ?? 'id'
  const lk = field.ref!.labelKey ?? 'name'
  const options = [
    ...(field.required ? [] : [{ value: '', label: '— Không chọn —' }]),
    ...(data ?? []).map((x) => ({ value: String((x as Rec)[vk]), label: String((x as Rec)[lk] ?? (x as Rec)[vk]) })),
  ]
  return <Select value={value || (field.required ? null : '')} onValueChange={onChange} options={options} placeholder="Chọn…" />
}

function RefMulti({ field, value, onChange, record }: { field: FieldDef; value: string[]; onChange: (v: string[]) => void; record?: Rec }) {
  const data = useRefItems(field, record)
  const vk = field.ref!.valueKey ?? 'id'
  const lk = field.ref!.labelKey ?? 'name'
  return (
    <div className="flex flex-wrap gap-1.5">
      {(data ?? []).map((x) => {
        const v = String((x as Rec)[vk])
        const on = value.includes(v)
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(on ? value.filter((y) => y !== v) : [...value, v])}
            className={cn(
              'cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink-soft hover:border-brand-300',
            )}
          >
            {String((x as Rec)[lk] ?? v)}
          </button>
        )
      })}
    </div>
  )
}

/** Gifts editor — each gift can be hidden without deleting it. */
function GiftsEditor({ value, onChange }: { value: ProductGift[]; onChange: (v: ProductGift[]) => void }) {
  const set = (i: number, patch: Partial<ProductGift>) => onChange(value.map((g, j) => (j === i ? { ...g, ...patch } : g)))
  return (
    <div className="flex flex-col gap-2">
      {value.map((g, i) => (
        <div key={g.id} className={cn('flex flex-col gap-2 rounded-[12px] border border-line p-2.5', g.hidden && 'bg-line-soft/60')}>
          <div className="flex items-center gap-2">
            <Input value={g.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="Tên quà tặng" className="min-w-0 flex-1" />
            <Input
              type="number"
              value={g.value || ''}
              onChange={(e) => set(i, { value: Number(e.target.value) || 0 })}
              placeholder="Trị giá"
              className="w-32"
            />
            <Button
              variant={g.hidden ? 'outline' : 'secondary'}
              size="icon"
              onClick={() => set(i, { hidden: !g.hidden })}
              aria-label={g.hidden ? 'Hiện quà này' : 'Ẩn quà này'}
              title={g.hidden ? 'Đang ẩn: bấm để hiện' : 'Đang hiện: bấm để ẩn'}
            >
              {g.hidden ? <EyeOff /> : <Eye />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Xóa quà">
              <Trash2 />
            </Button>
          </div>
          <MediaInput value={g.image ?? ''} onChange={(image) => set(i, { image })} />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => onChange([...value, { id: `g-${Date.now().toString(36)}`, name: '', image: '', value: 0 }])}
      >
        <Plus />
        Thêm quà tặng
      </Button>
    </div>
  )
}

function JsonInput({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? null, null, 2))
  const [error, setError] = useState('')
  return (
    <>
      <textarea
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value)
          try {
            onChange(JSON.parse(e.target.value))
            setError('')
          } catch {
            setError('JSON chưa hợp lệ')
          }
        }}
        className={cn(textareaClass, 'min-h-40 font-mono text-xs')}
      />
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </>
  )
}

/** One form control bound to a record path. */
export function FieldControl({ field, record, onChange }: { field: FieldDef; record: Rec; onChange: (r: Rec) => void }) {
  const id = useId()
  const value = getPath(record, field.key)
  const set = (v: unknown) => onChange(setPath(record, field.key, v))

  let control
  switch (field.type) {
    case 'textarea':
      control = <textarea id={id} value={String(value ?? '')} onChange={(e) => set(e.target.value)} placeholder={field.placeholder} className={textareaClass} />
      break
    case 'number':
      control = (
        <Input
          type="number"
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => set(e.target.value === '' ? undefined : Number(e.target.value))}
          placeholder={field.placeholder}
        />
      )
      break
    case 'switch':
      control = (
        <div className="flex h-11 items-center">
          <Switch checked={!!value} onChange={set} label={field.label} />
        </div>
      )
      break
    case 'select':
      control = <Select value={value == null ? null : String(value)} onValueChange={(v) => set(field.numeric ? Number(v) : v)} options={field.options ?? []} />
      break
    case 'media':
      control = <MediaInput value={String(value ?? '')} onChange={set} accept={field.accept} />
      break
    case 'tags':
      control = (
        <Input
          value={Array.isArray(value) ? value.join(', ') : ''}
          onChange={(e) => set(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          placeholder={field.placeholder ?? 'phân tách bằng dấu phẩy'}
        />
      )
      break
    case 'datetime':
      control = (
        <Input
          type="datetime-local"
          value={toLocalInput(value)}
          onChange={(e) => set(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
        />
      )
      break
    case 'ref':
      control = <RefSelect field={field} record={record} value={String(value ?? '')} onChange={(v) => set(v || undefined)} />
      break
    case 'refs':
      control = <RefMulti field={field} record={record} value={Array.isArray(value) ? (value as string[]) : []} onChange={set} />
      break
    case 'gifts':
      control = <GiftsEditor value={Array.isArray(value) ? (value as ProductGift[]) : []} onChange={set} />
      break
    case 'json':
      control = <JsonInput value={value} onChange={set} />
      break
    case 'video':
      control = <VideoSourceField keys={field.video!} record={record} onChange={onChange} />
      break
    case 'chapters':
      control = <ChaptersEditor record={record} onChange={onChange} />
      break
    case 'lines':
      control = (
        <textarea
          id={id}
          value={Array.isArray(value) ? value.join('\n') : ''}
          onChange={(e) => set(e.target.value.split('\n'))}
          onBlur={(e) => set(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
          placeholder={field.placeholder ?? 'Mỗi dòng một ý'}
          className={textareaClass}
        />
      )
      break
    case 'hotspots':
      control = <HotspotField record={record} onChange={onChange} />
      break
    case 'usps':
      control = <UspEditor value={Array.isArray(value) ? (value as UspItem[]) : DEFAULT_USPS} onChange={set} />
      break
    case 'icon':
      control = <IconPicker value={String(value ?? '')} onChange={set} />
      break
    case 'target':
      control = <TargetPicker value={(value as { type?: string; value?: string } | undefined) ?? {}} onChange={set} />
      break
    case 'chips': {
      const list = Array.isArray(value) ? (value as string[]) : []
      control = (
        <div className="flex flex-wrap gap-1.5">
          {(field.options ?? []).map((o) => {
            const on = list.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                onClick={() => set(on ? list.filter((x) => x !== o.value) : [...list, o.value])}
                className={cn(
                  'cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink-soft hover:border-brand-300',
                )}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )
      break
    }
    default:
      control = <Input value={String(value ?? '')} onChange={(e) => set(e.target.value)} placeholder={field.placeholder} />
  }

  return (
    <FormField label={field.required ? `${field.label} *` : field.label} className={cn(field.wide && 'md:col-span-2')}>
      {control}
      {field.help && <p className="text-xs text-muted">{field.help}</p>}
    </FormField>
  )
}

const TARGETS = [
  { value: 'product', label: 'Sản phẩm' },
  { value: 'news', label: 'Bài viết tin tức' },
  { value: 'video', label: 'Video KOL' },
  { value: 'url', label: 'Link khác' },
]
const TARGET_REF: Record<string, FieldDef['ref']> = {
  product: { collection: 'products', valueKey: 'slug' },
  news: { collection: 'news', valueKey: 'slug', labelKey: 'title' },
  video: { collection: 'kol-reviews', labelKey: 'title' },
}

/** Where a click goes: product / article / KOL video (picked from lists) or a URL. */
function TargetPicker({ value, onChange }: { value: { type?: string; value?: string }; onChange: (v: unknown) => void }) {
  const type = value.type ?? 'product'
  const ref = TARGET_REF[type]
  return (
    <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
      <Select value={type} onValueChange={(t) => onChange({ type: t, value: '' })} options={TARGETS} />
      {ref ? (
        <RefSelect
          field={{ key: 'target', label: '', type: 'ref', ref, required: true }}
          value={value.value ?? ''}
          onChange={(v) => onChange({ type, value: v })}
        />
      ) : (
        <Input value={value.value ?? ''} onChange={(e) => onChange({ type, value: e.target.value })} placeholder="https://... hoặc /explore" />
      )}
    </div>
  )
}

/** Grid of icons to pick from. */
function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto rounded-[12px] border border-line p-1.5">
      {ICON_NAMES.map((n) => (
        <button
          key={n}
          type="button"
          title={n}
          aria-pressed={value === n}
          onClick={() => onChange(n)}
          className={cn('flex size-9 cursor-pointer items-center justify-center rounded-[8px]', value === n ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-line-soft')}
        >
          <Icon name={n} className="size-5" />
        </button>
      ))}
    </div>
  )
}

/** Home "cam kết" tiles: icon, title, text, highlight; reorder by adding/removing. */
function UspEditor({ value, onChange }: { value: UspItem[]; onChange: (v: UspItem[]) => void }) {
  const set = (i: number, p: Partial<UspItem>) => onChange(value.map((u, j) => (j === i ? { ...u, ...p } : u)))
  return (
    <div className="flex flex-col gap-2">
      {value.map((u, i) => (
        <div key={i} className={cn('flex flex-col gap-2 rounded-[12px] border p-2.5', u.highlight ? 'border-brand-300 bg-brand-50/50' : 'border-line')}>
          <div className="flex items-center gap-2">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-brand-600">
              <Icon name={u.icon} className="size-5" />
            </span>
            <Input value={u.title} onChange={(e) => set(i, { title: e.target.value })} placeholder="Tiêu đề" className="min-w-0 flex-1" />
            <Switch checked={!!u.highlight} onChange={(v) => set(i, { highlight: v })} label="Nổi bật" />
            <span className="text-xs text-muted">Nổi bật</span>
            <Button variant="ghost" size="icon-sm" aria-label="Xóa" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <Trash2 className="text-danger" />
            </Button>
          </div>
          <Input value={u.text} onChange={(e) => set(i, { text: e.target.value })} placeholder="Mô tả ngắn" />
          <IconPicker value={u.icon} onChange={(icon) => set(i, { icon })} />
        </div>
      ))}
      {value.length < 4 && (
        <Button variant="outline" size="sm" className="self-start" onClick={() => onChange([...value, { icon: 'star', title: '', text: '' }])}>
          <Plus />
          Thêm ô cam kết
        </Button>
      )}
    </div>
  )
}
