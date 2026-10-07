/** Minimal dependency-free router over node:http. */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Role } from '../../src/types/domain'
import { readToken } from './auth'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export interface Ctx {
  req: IncomingMessage
  res: ServerResponse
  params: Record<string, string>
  query: URLSearchParams
  body: unknown
  auth: { sub: string; role: Role } | null
}

type Handler = (ctx: Ctx) => Promise<unknown> | unknown
interface Route {
  method: string
  re: RegExp
  keys: string[]
  handler: Handler
  raw: boolean
}

export class Router {
  private routes: Route[] = []

  /** `raw` routes receive the request stream unparsed (uploads). */
  on(method: string, pattern: string, handler: Handler, opts: { raw?: boolean } = {}) {
    const keys: string[] = []
    const re = new RegExp(
      '^' +
        pattern.replace(/\/:([a-zA-Z]+)/g, (_, k: string) => {
          keys.push(k)
          return '/([^/]+)'
        }) +
        '/?$',
    )
    this.routes.push({ method, re, keys, handler, raw: !!opts.raw })
    return this
  }
  get = (p: string, h: Handler) => this.on('GET', p, h)
  post = (p: string, h: Handler) => this.on('POST', p, h)
  put = (p: string, h: Handler) => this.on('PUT', p, h)
  delete = (p: string, h: Handler) => this.on('DELETE', p, h)

  async handle(req: IncomingMessage, res: ServerResponse, prefix = '/api') {
    const url = new URL(req.url ?? '/', 'http://x')
    const path = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) || '/' : url.pathname
    try {
      const match = this.match(req.method ?? 'GET', path)
      if (!match) throw new HttpError(404, 'Không tìm thấy')
      const { route, params } = match
      const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '')
      const token = readToken(bearer)
      const ctx: Ctx = {
        req,
        res,
        params,
        query: url.searchParams,
        body: route.raw ? undefined : await readJson(req),
        auth: token ? { sub: token.sub, role: token.role } : null,
      }
      const out = await route.handler(ctx)
      if (res.writableEnded) return
      send(res, out === undefined ? 204 : 200, out)
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500
      if (status === 500) console.error(e)
      send(res, status, { error: e instanceof Error && status !== 500 ? e.message : 'Lỗi máy chủ' })
    }
  }

  private match(method: string, path: string) {
    for (const route of this.routes) {
      if (route.method !== method) continue
      const m = route.re.exec(path)
      if (m) {
        const params: Record<string, string> = {}
        route.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]!)))
        return { route, params }
      }
    }
    return null
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  if (status === 204) {
    res.writeHead(204).end()
    return
  }
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

const MAX_JSON = 5 * 1024 * 1024

async function readJson(req: IncomingMessage): Promise<unknown> {
  if (req.method === 'GET' || req.method === 'DELETE') return undefined
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > MAX_JSON) throw new HttpError(413, 'Dữ liệu quá lớn')
    chunks.push(chunk as Buffer)
  }
  if (!size) return undefined
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'JSON không hợp lệ')
  }
}

export function requireAuth(ctx: Ctx) {
  if (!ctx.auth) throw new HttpError(401, 'Vui lòng đăng nhập')
  return ctx.auth
}

export function requireAdmin(ctx: Ctx) {
  const a = requireAuth(ctx)
  if (a.role !== 'admin') throw new HttpError(403, 'Bạn không có quyền quản trị')
  return a
}
