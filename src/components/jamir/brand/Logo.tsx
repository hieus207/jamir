import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-8', className)} aria-hidden="true">
      <defs>
        <linearGradient id="jamir-g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#jamir-g)" />
      <path d="M37 14v24a10 10 0 0 1-17.3 6.8" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <circle cx="45" cy="18" r="4" fill="#C7D2FE" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" aria-label="JAMIR — Trang chủ" className={cn('flex shrink-0 items-center gap-2', className)}>
      <LogoMark />
      <span className="text-[22px] font-extrabold tracking-tight text-ink">
        Jamir
      </span>
    </Link>
  )
}
