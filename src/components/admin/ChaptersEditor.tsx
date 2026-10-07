import { Camera, Info, Play, Plus, Scissors, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { adminApi, ApiError } from '@/services'
import type { VideoChapter } from '@/types/domain'
import { getPath, MediaInput, setPath } from './fields'

type Rec = Record<string, unknown>

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
/** "1:05" / "65" → 65 */
const parse = (v: string) => {
  const parts = v.split(':').map((x) => Number(x.trim()))
  if (parts.some((n) => Number.isNaN(n))) return null
  return parts.reduce((acc, n) => acc * 60 + n, 0)
}

function seek(video: HTMLVideoElement, t: number) {
  return new Promise<void>((resolve) => {
    const done = () => {
      video.removeEventListener('seeked', done)
      resolve()
    }
    video.addEventListener('seeked', done)
    video.currentTime = Math.max(0, Math.min(t, (video.duration || t) - 0.05))
  })
}

/** Grab the frame at `t` seconds and upload it as a JPEG thumbnail. */
async function captureFrame(video: HTMLVideoElement, t: number) {
  video.pause()
  await seek(video, t)
  const w = Math.min(640, video.videoWidth || 640)
  const h = Math.round((w / (video.videoWidth || 16)) * (video.videoHeight || 9))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(video, 0, 0, w, h)
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82))
  if (!blob) throw new Error('capture')
  return (await adminApi.upload(new File([blob], `chuong-${Math.round(t)}s.jpg`, { type: 'image/jpeg' }))).url
}

/** Sort by start; each chapter ends where the next begins (last one at the video's end). */
function normalize(list: VideoChapter[], duration: number) {
  const sorted = [...list].sort((a, b) => a.start - b.start)
  return sorted.map((c, i) => ({ ...c, end: sorted[i + 1]?.start ?? Math.max(duration, c.start + 1) }))
}

/**
 * Chapter strip under the product video ("Giới thiệu", "Thiết kế", "Hình ảnh 2K"…).
 * Uploaded videos: scrub the preview and add a chapter at the current time — the
 * frame becomes the thumbnail. Embedded videos (YouTube/TikTok/Facebook) can't be
 * captured, so thumbnails are uploaded and times typed.
 */
export function ChaptersEditor({ record, onChange }: { record: Rec; onChange: (r: Rec) => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [now, setNow] = useState(0)
  const src = String(getPath(record, 'video.src') ?? '')
  const embed = String(getPath(record, 'video.embedUrl') ?? '')
  const source = String(getPath(record, 'video.source') ?? '')
  const canCapture = !!src && !embed
  const duration = Number(getPath(record, 'video.duration')) || 0
  const chapters = ((getPath(record, 'chapters') as VideoChapter[] | undefined) ?? []).slice()

  const save = (list: VideoChapter[], r: Rec = record) => onChange(setPath(r, 'chapters', normalize(list, Number(getPath(r, 'video.duration')) || duration)))
  const set = (id: string, patch: Partial<VideoChapter>) => save(chapters.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const withFrame = async (label: string, t: number) => {
    setBusy(label)
    try {
      return await captureFrame(ref.current!, t)
    } catch (e) {
      toast.error(
        'Không chụp được ảnh từ video',
        e instanceof ApiError ? e.message : 'Video ở tên miền khác không cho chụp ảnh. Hãy tải ảnh thumbnail lên.',
      )
      return ''
    } finally {
      setBusy(null)
    }
  }

  const addAtCurrent = async () => {
    const t = Math.floor(ref.current?.currentTime ?? 0)
    if (chapters.some((c) => Math.abs(c.start - t) < 1)) return toast.info('Đã có chương ở thời điểm này')
    const thumbnail = await withFrame('add', t)
    save([...chapters, { id: `ch-${Date.now().toString(36)}`, title: `Chương ${chapters.length + 1}`, start: t, end: t + 1, thumbnail }])
  }

  const autoSplit = async () => {
    const v = ref.current
    if (!v?.duration) return
    const n = Math.max(2, Math.min(12, Number(prompt('Chia thành bao nhiêu chương?', '6')) || 0))
    if (!n) return
    const step = v.duration / n
    const list: VideoChapter[] = []
    for (let i = 0; i < n; i++) {
      const start = Math.floor(i * step)
      list.push({ id: `ch-${Date.now().toString(36)}-${i}`, title: chapters[i]?.title ?? `Chương ${i + 1}`, start, end: start + 1, thumbnail: await withFrame(`split-${i}`, start + 0.5) })
    }
    save(list)
    toast.success(`Đã tạo ${n} chương`, 'Đặt tên cho từng chương nhé.')
  }

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-line p-3">
      {canCapture ? (
        <>
          <video
            ref={ref}
            src={src}
            controls
            preload="metadata"
            crossOrigin="anonymous"
            onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              const d = Math.round(e.currentTarget.duration)
              if (d && d !== duration) save(chapters, setPath(record, 'video.duration', d))
            }}
            className="aspect-video w-full rounded-[10px] bg-black"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={busy === 'add'} onClick={addAtCurrent}>
              {busy !== 'add' && <Camera />}
              Thêm chương tại {fmt(now)}
            </Button>
            <Button size="sm" variant="outline" loading={!!busy?.startsWith('split')} onClick={autoSplit}>
              {!busy?.startsWith('split') && <Scissors />}
              Tự chia N chương
            </Button>
          </div>
        </>
      ) : (
        <p className="flex items-start gap-2 rounded-[10px] bg-amber-50 p-2.5 text-xs text-amber-900">
          <Info className="mt-px size-4 shrink-0" />
          {embed
            ? `Video nhúng từ ${source || 'nền tảng khác'} không cho chụp ảnh tự động: hãy tải ảnh thumbnail cho từng chương và nhập thời gian (mm:ss).${source === 'youtube' ? ' Khách bấm vào chương sẽ phát YouTube từ đúng giây đó.' : ' Với TikTok/Facebook, chương chỉ để giới thiệu nội dung.'}`
            : 'Chọn video sản phẩm ở trên trước, sau đó thêm chương.'}
        </p>
      )}

      {chapters.length > 0 && (
        <ul className="flex flex-col gap-2">
          {chapters.map((c, i) => (
            <li key={c.id} className="flex flex-col gap-2 rounded-[12px] bg-line-soft/50 p-2.5 sm:flex-row sm:items-center">
              <span className="text-xs font-bold text-muted sm:w-5">{i + 1}</span>
              <div className="w-full sm:w-auto sm:min-w-[240px]">
                <MediaInput value={c.thumbnail} onChange={(thumbnail) => set(c.id, { thumbnail })} />
              </div>
              <Input value={c.title} onChange={(e) => set(c.id, { title: e.target.value })} placeholder="Tên chương, ví dụ: Thiết kế" className="min-w-0 flex-1" />
              <div className="flex items-center gap-1.5">
                <Input
                  key={`${c.id}-${c.start}`}
                  defaultValue={fmt(c.start)}
                  onBlur={(e) => {
                    const t = parse(e.target.value)
                    if (t !== null) set(c.id, { start: t })
                  }}
                  aria-label="Bắt đầu (mm:ss)"
                  className="w-20 text-center tabular-nums"
                />
                <span className="w-14 text-xs text-muted tabular-nums">→ {fmt(c.end)}</span>
                {canCapture && (
                  <>
                    <Button variant="ghost" size="icon-sm" aria-label="Phát từ đây" title="Phát từ đây" onClick={() => ref.current && seek(ref.current, c.start).then(() => ref.current?.play())}>
                      <Play />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Chụp lại ảnh"
                      title="Chụp lại ảnh ở giây bắt đầu"
                      loading={busy === c.id}
                      onClick={async () => {
                        const url = await withFrame(c.id, c.start + 0.5)
                        if (url) set(c.id, { thumbnail: url })
                      }}
                    >
                      {busy !== c.id && <Camera />}
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon-sm" aria-label="Xóa chương" onClick={() => save(chapters.filter((x) => x.id !== c.id))}>
                  <Trash2 className="text-danger" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!canCapture && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => {
            const last = chapters[chapters.length - 1]
            const start = last ? last.start + 10 : 0
            save([...chapters, { id: `ch-${Date.now().toString(36)}`, title: `Chương ${chapters.length + 1}`, start, end: start + 1, thumbnail: '' }])
          }}
        >
          <Plus />
          Thêm chương
        </Button>
      )}
    </div>
  )
}
