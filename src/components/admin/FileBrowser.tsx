import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Copy, Download, ExternalLink, File, FileVideo, Folder, FolderPlus, HardDrive, Loader2, RefreshCw, Search, Trash2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { adminApi, type FileEntry } from '@/services/adminService'

const fmtSize = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${(n / 1024 ** 3).toFixed(2)} GB`
const fmtDate = (iso: string) => new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/**
 * File manager for the uploads folder (Admin → Tệp tải lên, and /uploads).
 * The current folder lives in ?path= so back/forward and links work.
 */
export function FileBrowser({ className }: { className?: string }) {
  const [params, setParams] = useSearchParams()
  const path = params.get('path') ?? ''
  const qc = useQueryClient()
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({ queryKey: ['admin-files', path], queryFn: () => adminApi.files(path) })
  const [q, setQ] = useState('')
  const [newDir, setNewDir] = useState<string | null>(null)
  const [preview, setPreview] = useState<FileEntry | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const open = (p: string) => {
    setQ('')
    setParams(p ? { path: p } : {}, { replace: false })
  }
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-files'] })

  const mkdir = useMutation({
    mutationFn: (name: string) => adminApi.mkdir(path, name),
    onSuccess: () => {
      setNewDir(null)
      refresh()
      toast.success('Đã tạo thư mục')
    },
    onError: (e) => toast.error((e as Error).message),
  })
  const remove = useMutation({
    mutationFn: (p: string) => adminApi.deleteFile(p),
    onSuccess: () => {
      refresh()
      toast.success('Đã xoá')
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const upload = async (list: FileList | null) => {
    const files = [...(list ?? [])]
    if (!files.length) return
    setProgress({ done: 0, total: files.length })
    let ok = 0
    for (const f of files) {
      try {
        await adminApi.uploadTo(path, f)
        ok++
      } catch (e) {
        toast.error(`${f.name}: ${(e as Error).message}`)
      }
      setProgress((p) => p && { ...p, done: p.done + 1 })
    }
    setProgress(null)
    refresh()
    if (ok) toast.success(`Đã tải lên ${ok}/${files.length} file`)
  }

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(`${location.origin}${url}`)
      toast.success('Đã sao chép link')
    } catch {
      toast.error('Không sao chép được')
    }
  }
  const del = (p: string, isDir: boolean) => {
    const msg = isDir
      ? `Xoá thư mục "${p}"? (chỉ xoá được khi thư mục trống)`
      : `Xoá file "${p}"?\nNếu file đang được dùng ở sản phẩm, banner, bài viết… thì ảnh/video ở đó sẽ bị mất.`
    if (window.confirm(msg)) remove.mutate(p)
  }

  const crumbs = path ? path.split('/') : []
  const match = (n: string) => !q || n.toLowerCase().includes(q.toLowerCase())
  const dirs = data?.dirs.filter((d) => match(d.name)) ?? []
  const files = data?.files.filter((f) => match(f.name)) ?? []

  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        void upload(e.dataTransfer.files)
      }}
    >
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <nav aria-label="Đường dẫn" className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-sm font-semibold">
          <button type="button" onClick={() => open('')} className={cn('flex cursor-pointer items-center gap-1.5 rounded-[8px] px-2 py-1 hover:bg-line-soft', !path && 'text-brand-700')}>
            <HardDrive className="size-4" aria-hidden="true" />
            uploads
          </button>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="size-4 text-subtle" aria-hidden="true" />
              <button type="button" onClick={() => open(crumbs.slice(0, i + 1).join('/'))} className={cn('cursor-pointer rounded-[8px] px-2 py-1 hover:bg-line-soft', i === crumbs.length - 1 && 'text-brand-700')}>
                {c}
              </button>
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => void refetch()} aria-label="Làm mới">
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
          </Button>
          <Button variant="secondary" size="md" onClick={() => setNewDir('')}>
            <FolderPlus className="size-4" />
            <span className="max-sm:hidden">Thư mục mới</span>
          </Button>
          <Button size="md" onClick={() => input.current?.click()} disabled={!!progress}>
            {progress ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {progress ? `${progress.done}/${progress.total}` : 'Tải lên'}
          </Button>
          <input ref={input} type="file" multiple hidden onChange={(e) => (void upload(e.target.files), (e.target.value = ''))} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lọc theo tên file…" aria-label="Lọc theo tên file" className="pl-9" />
        </label>
        {data && (
          <p className="text-sm text-muted">
            {data.dirs.length} thư mục · {data.files.length} file · {fmtSize(data.totalSize)}
          </p>
        )}
      </div>

      {newDir !== null && (
        <form
          className="flex items-center gap-2 rounded-card border border-line bg-surface p-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (newDir.trim()) mkdir.mutate(newDir)
          }}
        >
          <Folder className="size-5 shrink-0 text-amber-500" aria-hidden="true" />
          <Input autoFocus value={newDir} onChange={(e) => setNewDir(e.target.value)} placeholder="Tên thư mục, ví dụ: banner-tet" aria-label="Tên thư mục mới" />
          <Button type="submit" size="md" disabled={!newDir.trim() || mkdir.isPending}>
            Tạo
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={() => setNewDir(null)} aria-label="Huỷ">
            <X className="size-4" />
          </Button>
        </form>
      )}

      {/* listing */}
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        {isPending ? (
          <p className="flex items-center gap-2 p-6 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Đang tải…
          </p>
        ) : isError ? (
          <p className="p-6 text-sm text-danger">{(error as Error).message}</p>
        ) : !dirs.length && !files.length ? (
          <p className="p-8 text-center text-sm text-muted">{q ? 'Không có file nào khớp.' : 'Thư mục trống. Kéo thả file vào đây hoặc bấm "Tải lên".'}</p>
        ) : (
          <ul className="divide-y divide-line/70">
            {path && !q && (
              <li>
                <button type="button" onClick={() => open(crumbs.slice(0, -1).join('/'))} className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm text-muted hover:bg-canvas md:px-4">
                  <span className="flex size-10 items-center justify-center">..</span> Lên thư mục cha
                </button>
              </li>
            )}
            {dirs.map((d) => (
              <li key={d.path} className="group flex items-center gap-3 px-3 py-2.5 hover:bg-canvas md:px-4">
                <button type="button" onClick={() => open(d.path)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-amber-50 text-amber-500">
                    <Folder className="size-5 fill-amber-400/30" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{d.name}</span>
                    <span className="block text-xs text-muted">{d.items} mục</span>
                  </span>
                </button>
                {d.items === 0 && (
                  <IconBtn label={`Xoá thư mục ${d.name}`} onClick={() => del(d.path, true)} danger>
                    <Trash2 className="size-4" />
                  </IconBtn>
                )}
              </li>
            ))}
            {files.map((f) => (
              <li key={f.path} className="flex items-center gap-3 px-3 py-2 hover:bg-canvas md:px-4">
                <button type="button" onClick={() => setPreview(f)} className="size-10 shrink-0 cursor-pointer overflow-hidden rounded-[10px] bg-line-soft" aria-label={`Xem ${f.name}`}>
                  {f.kind === 'image' ? (
                    <img src={f.url} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-ink-soft">{f.kind === 'video' ? <FileVideo className="size-5" /> : <File className="size-5" />}</span>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink" title={f.name}>
                    {f.name}
                  </p>
                  <p className="text-xs text-muted">
                    {fmtSize(f.size)} · {fmtDate(f.mtime)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center">
                  <a href={f.url} download={f.name} aria-label={`Tải về ${f.name}`} title="Tải về" className="inline-flex size-9 items-center justify-center rounded-[8px] text-ink-soft hover:bg-line-soft hover:text-brand-700">
                    <Download className="size-4" />
                  </a>
                  <IconBtn label={`Sao chép link ${f.name}`} onClick={() => void copy(f.url)} className="max-sm:hidden">
                    <Copy className="size-4" />
                  </IconBtn>
                  <a href={f.url} target="_blank" rel="noreferrer" aria-label={`Mở ${f.name} ở tab mới`} title="Mở tab mới" className="inline-flex size-9 items-center justify-center rounded-[8px] text-ink-soft hover:bg-line-soft hover:text-brand-700 max-sm:hidden">
                    <ExternalLink className="size-4" />
                  </a>
                  <IconBtn label={`Xoá ${f.name}`} onClick={() => del(f.path, false)} danger>
                    <Trash2 className="size-4" />
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-subtle">Kéo thả file vào khung để tải lên. File được phục vụ tại /media/uploads/… và dùng được ngay cho sản phẩm, banner, bài viết.</p>

      {preview && (
        <div role="dialog" aria-modal="true" aria-label={preview.name} className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={() => setPreview(null)}>
          <div className="flex max-h-full w-full max-w-3xl flex-col gap-3 rounded-card bg-surface p-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">{preview.name}</p>
              <a href={preview.url} download={preview.name} className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-brand-600 px-3 text-sm font-semibold text-white">
                <Download className="size-4" /> Tải về
              </a>
              <IconBtn label="Đóng" onClick={() => setPreview(null)}>
                <X className="size-5" />
              </IconBtn>
            </div>
            <div className="flex min-h-0 items-center justify-center overflow-auto rounded-[10px] bg-canvas">
              {preview.kind === 'image' ? (
                <img src={preview.url} alt={preview.name} className="max-h-[70vh] object-contain" />
              ) : preview.kind === 'video' ? (
                <video src={preview.url} controls autoPlay playsInline className="max-h-[70vh] w-full" />
              ) : (
                <p className="p-8 text-sm text-muted">Không xem trước được loại file này. Bấm "Tải về".</p>
              )}
            </div>
            <p className="text-xs text-muted">
              {fmtSize(preview.size)} · {fmtDate(preview.mtime)} · {preview.url}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function IconBtn({ label, onClick, danger, className, children }: { label: string; onClick: () => void; danger?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn('inline-flex size-9 cursor-pointer items-center justify-center rounded-[8px] text-ink-soft hover:bg-line-soft', danger ? 'hover:text-danger' : 'hover:text-brand-700', className)}
    >
      {children}
    </button>
  )
}
