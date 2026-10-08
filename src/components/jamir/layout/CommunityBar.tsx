import { MessageCircleHeart } from 'lucide-react'
import { Link } from 'react-router'
import { Avatar } from '@/components/ui/avatar'
import { useCommunityFeed, useSettings } from '@/hooks/queries'
import { cn } from '@/lib/utils'

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="currentColor" d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
    </svg>
  )
}
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="currentColor" d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z" />
    </svg>
  )
}
/** Zalo app icon: blue squircle edge, white chat bubble with tail, blue wordmark (transparent background). */
function ZaloIcon() {
  return (
    <svg viewBox="0 0 64 64" className="size-7" aria-hidden="true">
      <path fill="#0068ff" d="M17 1h30c10.5 0 16 5.5 16 16v30c0 10.5-5.5 16-16 16H17C6.5 63 1 57.5 1 47V17C1 6.5 6.5 1 17 1Z" />
      <path fill="#fff" d="M24 2.6h23c9.4 0 14.4 5 14.4 14.4V39c0 9.4-5 14.4-14.4 14.4H28c-4 3.4-9.6 5.6-15.6 5.6 3-2 4.9-4.6 5.4-7.4-4.8-2.6-7.7-7.2-7.7-12.6V17c0-9.4 5-14.4 13.9-14.4Z" />
      <text x="36.2" y="35.5" textAnchor="middle" fill="#0068ff" fontFamily="Arial Rounded MT Bold, Arial, Helvetica, sans-serif" fontWeight="700" fontSize="19" letterSpacing="-0.4">Zalo</text>
    </svg>
  )
}

/**
 * "Tham gia cộng đồng Jamir": warm invitation above the footer — real faces
 * from recent reviews, one line of why, three clear buttons.
 */
export function CommunityBar({ className }: { className?: string }) {
  const { data: s } = useSettings()
  const { data: feed } = useCommunityFeed()
  if (!s) return null
  const faces = (feed ?? []).filter((p) => !p.anonymous && p.user.avatar).slice(0, 5)
  const links = [
    { label: 'Facebook', href: s.community.facebook, icon: <FacebookIcon />, className: 'bg-[#1877f2] text-white hover:bg-[#1468d8]' },
    { label: 'TikTok', href: s.community.tiktok, icon: <TikTokIcon />, className: 'bg-ink text-white hover:bg-ink-soft' },
    { label: 'Zalo', href: s.community.zaloGroup || s.zalo, icon: <ZaloIcon />, className: 'bg-white text-[#0068ff] ring-1 ring-[#cfe1ff] hover:bg-[#f2f7ff]' },
  ].filter((l) => !!l.href)
  if (!links.length) return null

  return (
    <section aria-labelledby="community-title" className={cn('container-page', className)}>
      <div className="relative overflow-hidden rounded-[24px] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-pink-50 px-5 py-7 md:px-10 md:py-9">
        <span aria-hidden="true" className="absolute -top-16 -right-10 size-56 rounded-full bg-accent-200/40 blur-3xl" />
        <span aria-hidden="true" className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
          <div className="min-w-0 flex-1">
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
              <MessageCircleHeart className="size-4" aria-hidden="true" />
              Cộng đồng người dùng thật
            </p>
            <h2 id="community-title" className="text-[22px] leading-tight font-extrabold tracking-tight md:text-[28px]">
              Tham gia cộng đồng{' '}
              <span className="bg-gradient-to-r from-brand-600 via-accent-600 to-pink-500 bg-clip-text text-transparent">Jamir</span>
            </h2>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              Nơi mọi người chia sẻ review thật, hỏi nhanh trước khi mua và nhận ưu đãi chỉ dành cho thành viên.
            </p>
            {faces.length > 0 && (
              <Link to="/cong-dong" className="mt-4 inline-flex items-center gap-3 text-sm text-muted hover:text-brand-700">
                <span className="flex -space-x-2.5">
                  {faces.map((p) => (
                    <Avatar key={p.id} src={p.user.avatar} name={p.user.name} className="size-9 ring-2 ring-white" />
                  ))}
                </span>
                Xem khoảnh khắc mới nhất từ cộng đồng →
              </Link>
            )}
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3 md:w-[420px] md:grid-cols-1 lg:w-auto lg:grid-cols-3">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold shadow-sm transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
                  l.className,
                )}
              >
                {l.icon}
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
