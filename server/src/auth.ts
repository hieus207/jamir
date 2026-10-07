import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { Customer } from '../../src/types/domain'
import { config } from './config'
import type { CustomerRecord } from './types'

const scrypt = promisify(scryptCb) as (pw: string, salt: string, len: number) => Promise<Buffer>

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const key = await scrypt(password, salt, 64)
  return `scrypt$${salt}$${key.toString('hex')}`
}

export async function verifyPassword(password: string, stored?: string) {
  if (!stored?.startsWith('scrypt$')) return false
  const [, salt, hex] = stored.split('$')
  const key = await scrypt(password, salt!, 64)
  const expected = Buffer.from(hex!, 'hex')
  return expected.length === key.length && timingSafeEqual(expected, key)
}

/* ---- stateless signed tokens: base64url(payload).hmac ---- */

interface TokenPayload {
  sub: string
  role: Customer['role']
  exp: number
}

const sign = (data: string) => createHmac('sha256', config.authSecret).update(data).digest('base64url')

export function issueToken(user: Pick<Customer, 'id' | 'role'>) {
  const payload: TokenPayload = { sub: user.id, role: user.role, exp: Date.now() + config.tokenTtlDays * 86400_000 }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

export function readToken(token: string | undefined): TokenPayload | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = sign(body)
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload
    return p.exp > Date.now() ? p : null
  } catch {
    return null
  }
}

/* ---- Google Sign-In (ID token from Google Identity Services) ---- */

export interface GoogleProfile {
  sub: string
  email: string
  name: string
  picture?: string
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  if (!config.googleClientId) throw new Error('Google login chưa được cấu hình (GOOGLE_CLIENT_ID)')
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`)
  if (!res.ok) throw new Error('Token Google không hợp lệ')
  const t = (await res.json()) as Record<string, string>
  if (t.aud !== config.googleClientId) throw new Error('Token Google không dành cho ứng dụng này')
  if (t.email_verified !== 'true') throw new Error('Email Google chưa được xác minh')
  return { sub: t.sub!, email: t.email!, name: t.name ?? t.email!, picture: t.picture }
}

/** Strip secrets before sending a customer to any client. */
export function toCustomer(r: CustomerRecord): Customer {
  const { passwordHash: _p, googleSub: _g, ...rest } = r
  return { ...rest, addresses: rest.addresses ?? [] }
}
