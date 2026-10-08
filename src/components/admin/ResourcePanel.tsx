import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { SectionError } from '@/components/jamir/layout/PageStates'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { cn, normalizeText as normalize } from '@/lib/utils'
import { adminApi, ApiError, type AdminCollection } from '@/services'
import { FieldControl, type FieldDef, getPath, Switch, useAdminList } from './fields'

export type Rec = Record<string, unknown> & { id: string }

export interface Column {
  label: string
  render: (row: Rec, patch: (p: Partial<Rec>) => void) => ReactNode
  className?: string
}

export interface ResourceConfig {
  collection: AdminCollection
  title: string
  /** "sản phẩm", "story"… used in buttons */
  noun: string
  columns: Column[]
  fields: FieldDef[]
  /** values for a new record */
  defaults?: Record<string, unknown> | (() => Record<string, unknown>)
  /** text searched by the filter box */
  search: (row: Rec) => string
  sort?: (a: Rec, b: Rec) => number
  /** quick on/off switch shown on each row */
  toggle?: { key: string; label: string }
  /** extra UI above the table (e.g. import buttons) */
  toolbar?: ReactNode
  /** hide "Thêm mới" (e.g. orders come from checkout) */
  readonlyCreate?: boolean
  /** live preview next to the form (desktop) */
  preview?: (draft: Rec) => ReactNode
}

/** Invalidate admin lists and every public query (shop pages must reflect edits). */
export function useAdminMutation<A>(fn: (a: A) => Promise<unknown>, success?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries()
      if (success) toast.success(success)
    },
    onError: (e) => toast.error('Không lưu được', e instanceof ApiError ? e.message : String(e)),
  })
}

export function ResourcePanel({ config }: { config: ResourceConfig }) {
  const { data, isPending, isError, refetch } = useAdminList<Rec>(config.collection)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Rec | null>(null)
  const [isNew, setIsNew] = useState(false)

  const save = useAdminMutation(
    (r: Rec) => (isNew ? adminApi.create(config.collection, r) : adminApi.update(config.collection, r.id, r)),
    'Đã lưu',
  )
  const patch = useAdminMutation(({ id, p }: { id: string; p: Partial<Rec> }) => adminApi.update(config.collection, id, p))
  const remove = useAdminMutation((id: string) => adminApi.remove(config.collection, id), 'Đã xóa')

  const rows = useMemo(() => {
    const list = [...(data ?? [])]
    if (config.sort) list.sort(config.sort)
    const n = normalize(q)
    return n ? list.filter((r) => normalize(config.search(r)).includes(n)) : list
  }, [data, q, config])

  const openNew = () => {
    const d = typeof config.defaults === 'function' ? config.defaults() : config.defaults
    setIsNew(true)
    setEditing({ ...(d ?? {}), id: '' })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-xl font-bold">
          {config.title} <span className="text-sm font-medium text-muted">({data?.length ?? 0})</span>
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm…" className="pl-9" />
        </div>
        {config.toolbar}
        {!config.readonlyCreate && (
          <Button onClick={openNew}>
            <Plus />
            Thêm {config.noun}
          </Button>
        )}
      </div>

      {isError ? (
        <SectionError onRetry={() => void refetch()} />
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-line-soft/60 text-xs font-semibold text-muted">
              <tr>
                {config.columns.map((c) => (
                  <th key={c.label} className={cn('px-3 py-2.5', c.className)}>
                    {c.label}
                  </th>
                ))}
                {config.toggle && <th className="px-3 py-2.5">{config.toggle.label}</th>}
                <th className="w-24 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {isPending
                ? Array.from({ length: 4 }, (_, i) => (
                    <tr key={i} className="border-t border-line">
                      <td colSpan={config.columns.length + 2} className="px-3 py-3">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-t border-line transition-colors hover:bg-brand-50/40"
                      onClick={() => {
                        setIsNew(false)
                        setEditing(row)
                      }}
                    >
                      {config.columns.map((c) => (
                        <td key={c.label} className={cn('px-3 py-2.5 align-middle', c.className)}>
                          {c.render(row, (p) => patch.mutate({ id: row.id, p }))}
                        </td>
                      ))}
                      {config.toggle && (
                        <td className="px-3 py-2.5">
                          <Switch
                            checked={!!getPath(row, config.toggle.key)}
                            onChange={(v) => patch.mutate({ id: row.id, p: { [config.toggle!.key]: v } })}
                            label={config.toggle.label}
                          />
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" aria-label="Sửa">
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Xóa"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Xóa ${config.noun} này?`)) remove.mutate(row.id)
                            }}
                          >
                            <Trash2 className="text-danger" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              {!isPending && !rows.length && (
                <tr>
                  <td colSpan={config.columns.length + 2} className="px-3 py-10 text-center text-muted">
                    Chưa có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <RecordDialog
          key={editing.id || 'new'}
          title={isNew ? `Thêm ${config.noun}` : `Sửa ${config.noun}`}
          record={editing}
          fields={config.fields}
          preview={config.preview}
          saving={save.isPending}
          onClose={() => setEditing(null)}
          onSave={(r) => {
            const { id, ...rest } = r
            save.mutate((isNew && !id ? rest : r) as Rec, { onSuccess: () => setEditing(null) })
          }}
        />
      )}
    </div>
  )
}

/** Form + raw JSON editor for one record. */
export function RecordDialog({
  title,
  record,
  fields,
  saving,
  onSave,
  onClose,
  preview,
}: {
  title: string
  record: Rec
  fields: FieldDef[]
  preview?: (draft: Rec) => ReactNode
  saving: boolean
  onSave: (r: Rec) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<Rec>(record)
  const [tab, setTab] = useState<'form' | 'json'>('form')
  const [json, setJson] = useState('')
  const [jsonError, setJsonError] = useState('')

  const switchTab = (t: 'form' | 'json') => {
    if (t === 'json') setJson(JSON.stringify(draft, null, 2))
    if (t === 'form' && jsonError) return
    setTab(t)
  }
  const visible = fields.filter((f) => !f.showIf || f.showIf(draft))
  const missing = visible.filter((f) => f.required && [undefined, null, ''].includes(getPath(draft, f.key) as never))

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn('flex flex-col', preview ? 'h-[calc(100dvh-2rem)] max-w-[min(1600px,100%)] md:h-[calc(100dvh-4rem)]' : 'max-w-3xl')}
        closeClassName="bg-line-soft text-ink-soft hover:bg-line"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 pt-5 pb-3 pr-14">
          <DialogTitle>{title}</DialogTitle>
          <Tabs value={tab} onValueChange={(v) => switchTab(v as 'form' | 'json')} className="ml-auto">
            <TabsList>
              <TabsTab value="form">Biểu mẫu</TabsTab>
              <TabsTab value="json">JSON</TabsTab>
            </TabsList>
          </Tabs>
        </div>
        <div className={cn('min-h-0 flex-1', preview ? 'overflow-hidden lg:grid lg:grid-cols-[minmax(420px,1fr)_minmax(0,1.35fr)]' : 'overflow-y-auto overscroll-contain')}>
        <div className={cn('min-h-0 px-5 py-4', preview && 'h-full overflow-y-auto overscroll-contain')}>
          {tab === 'form' ? (
            <div className={cn('grid gap-3.5', preview ? 'xl:grid-cols-2' : 'md:grid-cols-2')}>
              {visible.map((f) => (
                <FieldControl key={f.key} field={f} record={draft} onChange={(r) => setDraft(r as Rec)} />
              ))}
            </div>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted">Sửa trực tiếp mọi trường, kể cả các trường lồng nhau như thông số, màu sắc, chương video.</p>
              <textarea
                value={json}
                spellCheck={false}
                onChange={(e) => {
                  setJson(e.target.value)
                  try {
                    setDraft(JSON.parse(e.target.value) as Rec)
                    setJsonError('')
                  } catch {
                    setJsonError('JSON chưa hợp lệ')
                  }
                }}
                className="h-[55vh] w-full rounded-btn border border-line bg-surface p-3 font-mono text-xs leading-relaxed focus:border-brand-500 focus:outline-none"
              />
              {jsonError && <p className="mt-1 text-xs font-medium text-danger">{jsonError}</p>}
            </>
          )}
        </div>
        {preview && <div className="hidden min-h-0 border-l border-line p-4 lg:block">{preview(draft)}</div>}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-surface px-5 py-3">
          {missing.length > 0 && <p className="mr-auto text-xs text-danger">Thiếu: {missing.map((f) => f.label).join(', ')}</p>}
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={saving} disabled={!!jsonError || missing.length > 0} onClick={() => onSave(draft)}>
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
