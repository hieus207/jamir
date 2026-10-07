import { CircleAlert, CircleCheck, Eye, EyeOff, Info } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { parseVideoUrl, VIDEO_SOURCES } from '@/lib/video'
import type { VideoSource } from '@/types/domain'
import { getPath, MediaInput, setPath } from './fields'

type Rec = Record<string, unknown>

/** Record paths a video field writes to. */
export interface VideoKeys {
  /** 'jamir' (upload) | 'youtube' | 'tiktok' | 'facebook' */
  source: string
  /** direct file (upload) */
  src: string
  /** iframe player URL generated from the link */
  embed: string
  /** the link the admin pasted (kept for editing) */
  url: string
  /** optional: frame, auto-set for Shorts / TikTok / Reels */
  aspect?: string
}

const ORDER: VideoSource[] = ['jamir', 'youtube', 'tiktok', 'facebook']

/** Pick a source, paste its link (with how-to) or upload; the embed URL is derived and previewable. */
export function VideoSourceField({ keys, record, onChange }: { keys: VideoKeys; record: Rec; onChange: (r: Rec) => void }) {
  const embed = String(getPath(record, keys.embed) ?? '')
  const stored = getPath(record, keys.source) as VideoSource | undefined
  const source: VideoSource = stored && stored in VIDEO_SOURCES ? stored : embed ? 'youtube' : 'jamir'
  const url = String(getPath(record, keys.url) ?? '')
  const [preview, setPreview] = useState(false)
  const parsed = source === 'jamir' ? {} : parseVideoUrl(source, url)
  const meta = VIDEO_SOURCES[source]

  const pick = (s: VideoSource) => {
    let r = setPath(record, keys.source, s)
    if (s === 'jamir') {
      r = setPath(setPath(r, keys.embed, undefined), keys.url, undefined)
    } else {
      const p = parseVideoUrl(s, url)
      r = setPath(r, keys.embed, p.embedUrl)
    }
    setPreview(false)
    onChange(r)
  }

  const paste = (value: string) => {
    const p = parseVideoUrl(source, value)
    let r = setPath(setPath(record, keys.url, value), keys.embed, p.embedUrl)
    if (p.aspect && keys.aspect) r = setPath(r, keys.aspect, p.aspect)
    onChange(r)
  }

  const aspect = String((keys.aspect && getPath(record, keys.aspect)) || parsed.aspect || '16:9')
  const vertical = aspect === '9:16' || aspect === '4:5'

  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] border border-line p-3">
      <div className="grid grid-cols-4 gap-1 rounded-[12px] bg-line-soft p-1" role="radiogroup" aria-label="Nguồn video">
        {ORDER.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={source === s}
            onClick={() => pick(s)}
            className={cn(
              'cursor-pointer rounded-[9px] px-2 py-1.5 text-xs font-bold transition-colors',
              source === s ? 'bg-surface text-brand-700 shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {VIDEO_SOURCES[s].label}
          </button>
        ))}
      </div>

      {source === 'jamir' ? (
        <MediaInput value={String(getPath(record, keys.src) ?? '')} onChange={(v) => onChange(setPath(record, keys.src, v))} accept="video" />
      ) : (
        <>
          <Input value={url} onChange={(e) => paste(e.target.value)} placeholder={meta.placeholder} />
          {url &&
            (parsed.error ? (
              <p className="flex items-start gap-1.5 text-xs font-medium text-danger">
                <CircleAlert className="mt-px size-3.5 shrink-0" /> {parsed.error}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <p className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-medium text-success-strong">
                  <CircleCheck className="size-3.5 shrink-0" /> Link hợp lệ · khung {aspect}
                </p>
                <Button variant="outline" size="sm" onClick={() => setPreview((v) => !v)}>
                  {preview ? <EyeOff /> : <Eye />}
                  {preview ? 'Ẩn' : 'Xem thử'}
                </Button>
              </div>
            ))}
          {preview && embed && (
            <div className={cn('overflow-hidden rounded-[12px] bg-black', vertical ? 'mx-auto aspect-[9/16] w-56' : 'aspect-video w-full')}>
              <iframe src={embed} title="Xem thử video" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen className="size-full border-0" />
            </div>
          )}
        </>
      )}

      <div className="rounded-[10px] bg-brand-50/60 p-2.5 text-xs text-ink-soft">
        <p className="mb-1 flex items-center gap-1 font-bold text-brand-700">
          <Info className="size-3.5" /> Cách lấy link {meta.label === 'Tải lên' ? 'video' : meta.label}
        </p>
        <ul className="ml-4 list-disc space-y-0.5">
          {meta.guide.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
