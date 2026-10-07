import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const vnd = new Intl.NumberFormat('vi-VN')

/** 299000 → "299.000đ" */
export const formatPrice = (value: number) => `${vnd.format(value)}đ`

/** 12500 → "12.5K", 1200000 → "1.2M" */
export function formatCompact(value: number) {
  if (value >= 1_000_000) return `${trim(value / 1_000_000)}M`
  if (value >= 1_000) return `${trim(value / 1_000)}K`
  return String(value)
}
const trim = (n: number) => (n >= 100 ? Math.round(n).toString() : n.toFixed(1).replace(/\.0$/, ''))

/** 86 → "01:26" */
export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })
/** ISO date → "3 ngày trước" (relative to the given "now", default today) */
export function formatRelative(iso: string, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000
  const abs = Math.abs(diff)
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day')
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / (86400 * 7)), 'week')
  return rtf.format(Math.round(diff / (86400 * 30)), 'month')
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** Lowercase + strip Vietnamese diacritics so "tai nghe" matches "Tài nghe". */
export const normalizeText = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').trim()
