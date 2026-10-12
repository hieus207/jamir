import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, readdir, rmdir, stat, unlink } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { config } from '../config'
import { HttpError, requireAdmin, type Router } from '../http'
import { slugify } from '../logic'

/**
 * Admin file manager over the uploads folder (MEDIA_DIR, served by nginx at
 * MEDIA_URL). Admin only: list, upload, new folder, delete. Paths are confined
 * to the uploads root; active content (html/svg/js…) is refused because nginx
 * serves these files from the site's own origin.
 */
const ALLOWED = /^\.(jpe?g|png|webp|gif|avif|mp4|webm|mov|m4v|mp3|m4a|wav|pdf|zip|rar|7z|txt|csv|json|docx?|xlsx?|pptx?)$/
const VIDEO = /\.(mp4|webm|mov|m4v)$/i
const IMAGE = /\.(jpe?g|png|webp|gif|avif)$/i

export interface FileEntry {
  name: string
  path: string
  size: number
  mtime: string
  url: string
  kind: 'image' | 'video' | 'file'
}
export interface DirEntry {
  name: string
  path: string
  items: number
  mtime: string
}
export interface FileListing {
  path: string
  dirs: DirEntry[]
  files: FileEntry[]
  totalSize: number
}

const root = () => resolve(config.mediaDir)

/** relative path from the client → absolute path inside the uploads root */
function inside(rel: string | null | undefined) {
  const clean = (rel ?? '').replace(/\\/g, '/').split('/').filter(Boolean)
  if (clean.some((s) => s === '..' || s.startsWith('.'))) throw new HttpError(400, 'Đường dẫn không hợp lệ')
  const abs = resolve(root(), ...clean)
  if (abs !== root() && !abs.startsWith(root() + sep)) throw new HttpError(400, 'Đường dẫn không hợp lệ')
  return { abs, rel: clean.join('/') }
}

const urlOf = (rel: string) => `${config.mediaUrl}/${rel.split('/').map(encodeURIComponent).join('/')}`

export function fileRoutes(r: Router) {
  r.get('/admin/files', async (ctx) => {
    requireAdmin(ctx)
    const { abs, rel } = inside(ctx.query.get('path'))
    await mkdir(root(), { recursive: true })
    const st = await stat(abs).catch(() => null)
    if (!st?.isDirectory()) throw new HttpError(404, 'Không tìm thấy thư mục')
    const dirs: DirEntry[] = []
    const files: FileEntry[] = []
    for (const d of await readdir(abs, { withFileTypes: true })) {
      if (d.name.startsWith('.')) continue
      const childRel = rel ? `${rel}/${d.name}` : d.name
      const s = await stat(join(abs, d.name)).catch(() => null)
      if (!s) continue
      if (d.isDirectory()) {
        const items = (await readdir(join(abs, d.name)).catch(() => [])).filter((n) => !n.startsWith('.')).length
        dirs.push({ name: d.name, path: childRel, items, mtime: s.mtime.toISOString() })
      } else if (d.isFile()) {
        files.push({ name: d.name, path: childRel, size: s.size, mtime: s.mtime.toISOString(), url: urlOf(childRel), kind: VIDEO.test(d.name) ? 'video' : IMAGE.test(d.name) ? 'image' : 'file' })
      }
    }
    dirs.sort((a, b) => b.name.localeCompare(a.name)) // 2026-10 before 2026-09
    files.sort((a, b) => b.mtime.localeCompare(a.mtime))
    return { path: rel, dirs, files, totalSize: files.reduce((n, f) => n + f.size, 0) } satisfies FileListing
  })

  r.post('/admin/files/mkdir', async (ctx) => {
    requireAdmin(ctx)
    const b = (ctx.body ?? {}) as { path?: string; name?: string }
    const { abs, rel } = inside(b.path)
    const name = slugify(String(b.name ?? '')).slice(0, 60)
    if (!b.name?.trim()) throw new HttpError(400, 'Nhập tên thư mục')
    const target = join(abs, name)
    if (existsSync(target)) throw new HttpError(409, 'Thư mục đã tồn tại')
    await mkdir(target, { recursive: true })
    return { path: rel ? `${rel}/${name}` : name }
  })

  r.on(
    'POST',
    '/admin/files/upload',
    async (ctx) => {
      requireAdmin(ctx)
      const { abs, rel } = inside(ctx.query.get('path'))
      const original = ctx.query.get('filename') ?? 'file'
      const ext = extname(original).toLowerCase()
      if (!ALLOWED.test(ext)) throw new HttpError(400, `Không nhận file ${ext || 'không có đuôi'} (cho phép ảnh, video, âm thanh, pdf, zip, office, txt/csv/json)`)
      const len = Number(ctx.req.headers['content-length'] ?? 0)
      const max = config.maxUploadMb * 1024 * 1024
      if (len > max) throw new HttpError(413, `File tối đa ${config.maxUploadMb}MB`)
      await mkdir(abs, { recursive: true })
      const base = slugify(original.replace(/\.[^.]+$/, '')).slice(0, 60)
      let name = `${base}${ext}`
      for (let n = 1; existsSync(join(abs, name)); n++) name = `${base}-${n}${ext}`
      const target = join(abs, name)
      let size = 0
      ctx.req.on('data', (c: Buffer) => {
        size += c.length
        if (size > max) ctx.req.destroy(new Error('too large'))
      })
      try {
        await pipeline(ctx.req, createWriteStream(target, { flags: 'wx' }))
      } catch {
        await unlink(target).catch(() => {})
        throw new HttpError(413, 'Tải lên thất bại hoặc file quá lớn')
      }
      const childRel = rel ? `${rel}/${name}` : name
      return { name, path: childRel, size, url: urlOf(childRel) }
    },
    { raw: true },
  )

  r.on('DELETE', '/admin/files', async (ctx) => {
    requireAdmin(ctx)
    const { abs, rel } = inside(ctx.query.get('path'))
    if (!rel) throw new HttpError(400, 'Không thể xoá thư mục gốc')
    const st = await stat(abs).catch(() => null)
    if (!st) throw new HttpError(404, 'Không tìm thấy')
    if (st.isDirectory()) {
      if ((await readdir(abs)).some((n) => !n.startsWith('.'))) throw new HttpError(409, 'Thư mục còn file, xoá hết file bên trong trước')
      await rmdir(abs)
    } else await unlink(abs)
    return { ok: true }
  })
}
