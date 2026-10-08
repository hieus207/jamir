import { useId } from 'react'
import { Link } from 'react-router'
import { useSettings } from '@/hooks/queries'
import { cn } from '@/lib/utils'

/** Square brand mark: the icon from settings (Admin → Cài đặt → Logo), else the built-in mark. */
export function LogoMark({ className }: { className?: string }) {
  // unique per instance: a hidden duplicate (display:none) would otherwise own the gradient
  const id = useId()
  const icon = useSettings().data?.logo?.icon
  if (icon) return <img src={icon} alt="" className={cn('size-8 rounded-[9px] object-contain', className)} />
  return (
    <svg viewBox="0 0 64 64" className={cn('size-8', className)} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id})`} />
      <path d="M37 14v24a10 10 0 0 1-17.3 6.8" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <circle cx="45" cy="18" r="4" fill="#C7D2FE" />
    </svg>
  )
}

/** Header logo: full logo image if set, else mark + name. */
export function Logo({ className }: { className?: string }) {
  const logo = useSettings().data?.logo
  const name = logo?.text || 'Jamir'
  return (
    <Link to="/" aria-label={`${name} — Trang chủ`} className={cn('flex shrink-0 items-center gap-2', className)}>
      {logo?.image ? (
        <img src={logo.image} alt={name} className="w-auto max-w-[180px] object-contain" style={{ height: logo.height || 32 }} />
      ) : (
        <>
          <LogoMark />
          <span className="text-[22px] font-extrabold tracking-tight text-ink">{name}</span>
        </>
      )}
    </Link>
  )
}
