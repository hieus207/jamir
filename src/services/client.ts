/**
 * Data source switch.
 *
 * - No VITE_API_BASE_URL → every service resolves against the bundled JSON mock
 *   (with a small artificial latency so loading states are visible).
 * - VITE_API_BASE_URL set (e.g. https://api.jamir.vn/v1) → the same service
 *   functions call the REST backend instead. The UI never knows the difference.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined
const MOCK_LATENCY = Number(import.meta.env.VITE_MOCK_LATENCY ?? 350)

export const isRemote = Boolean(API_BASE_URL)

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

function buildUrl(path: string, query?: Query) {
  const url = new URL(path.replace(/^\//, ''), API_BASE_URL!.replace(/\/?$/, '/'))
  if (query)
    for (const [key, value] of Object.entries(query))
      if (value !== undefined) url.searchParams.set(key, String(value))
  return url
}

async function http<T>(method: string, path: string, opts: { query?: Query; body?: unknown } = {}) {
  const res = await fetch(buildUrl(path, opts.query), {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
  if (res.status === 404) throw new NotFoundError()
  if (!res.ok) throw new ApiError(`Request failed: ${res.status}`, res.status)
  return (await res.json()) as T
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** structuredClone so callers can never mutate the in-memory "database". */
async function mock<T>(resolve: () => T | undefined, latency = MOCK_LATENCY): Promise<T> {
  await sleep(latency * (0.6 + Math.random() * 0.8))
  const value = resolve()
  if (value === undefined) throw new NotFoundError()
  return structuredClone(value)
}

/** GET from the backend, or resolve the same resource from mock JSON. */
export function get<T>(path: string, fallback: () => T | undefined, query?: Query): Promise<T> {
  return isRemote ? http<T>('GET', path, { query }) : mock(fallback)
}

/** POST to the backend, or run the mock mutation. */
export function post<T>(path: string, body: unknown, fallback: () => T): Promise<T> {
  return isRemote ? http<T>('POST', path, { body }) : mock(fallback, MOCK_LATENCY * 2)
}
