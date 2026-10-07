/**
 * HTTP client for the JAMIR REST API.
 *
 * Every service calls get/post/put/del with a path; the base URL comes from
 * VITE_API_BASE_URL (default "/api", proxied by Vite in dev and nginx in prod).
 * Swapping the Node/JSON backend for Spring Boot + MariaDB only requires the
 * new backend to serve the same endpoints.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Không tìm thấy dữ liệu') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

type Query = Record<string, string | number | boolean | undefined>

/** Session token provider (set by the auth store; avoids a circular import). */
let tokenProvider: () => string | null = () => null
export const setTokenProvider = (fn: () => string | null) => {
  tokenProvider = fn
}
let onUnauthorized: () => void = () => {}
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn
}

function buildUrl(path: string, query?: Query) {
  const qs = new URLSearchParams()
  if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== '') qs.set(k, String(v))
  const s = qs.toString()
  return `${API_BASE_URL.replace(/\/$/, '')}${path}${s ? `?${s}` : ''}`
}

export async function request<T>(
  method: string,
  path: string,
  opts: { query?: Query; body?: unknown; raw?: BodyInit; headers?: Record<string, string> } = {},
): Promise<T> {
  const token = tokenProvider()
  const res = await fetch(buildUrl(path, opts.query), {
    method,
    headers: {
      Accept: 'application/json',
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    body: opts.raw ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
  })
  if (res.status === 204) return undefined as T
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized()
    if (res.status === 404) throw new NotFoundError(data.error)
    throw new ApiError(data.error ?? `Lỗi ${res.status}`, res.status)
  }
  return data as T
}

export const get = <T>(path: string, query?: Query) => request<T>('GET', path, { query })
export const post = <T>(path: string, body?: unknown) => request<T>('POST', path, { body: body ?? {} })
export const put = <T>(path: string, body: unknown) => request<T>('PUT', path, { body })
export const del = (path: string) => request<void>('DELETE', path)
