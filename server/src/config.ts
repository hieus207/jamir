import { randomBytes } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const env = process.env

export const config = {
  port: Number(env.PORT ?? 3001),
  host: env.HOST ?? '127.0.0.1',
  /** where the live JSON "database" files live (created from ./seed on first run) */
  dataDir: resolve(env.DATA_DIR ?? resolve(here, '../data')),
  seedDir: resolve(env.SEED_DIR ?? resolve(here, '../seed')),
  /** uploaded images/videos are written here and served by nginx at mediaUrl */
  mediaDir: resolve(env.MEDIA_DIR ?? resolve(here, '../../public/media/uploads')),
  mediaUrl: env.MEDIA_URL ?? '/media/uploads',
  authSecret: env.AUTH_SECRET ?? randomBytes(32).toString('hex'),
  tokenTtlDays: Number(env.TOKEN_TTL_DAYS ?? 30),
  adminEmail: env.ADMIN_EMAIL ?? 'admin@jamir.vn',
  adminPassword: env.ADMIN_PASSWORD,
  googleClientId: env.GOOGLE_CLIENT_ID ?? '',
  maxUploadMb: Number(env.MAX_UPLOAD_MB ?? 200),
}

if (!env.AUTH_SECRET) console.warn('[config] AUTH_SECRET not set — sessions reset on restart')
