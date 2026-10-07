import { Globe, Handshake, Heart, LayoutGrid, Mail, MessageCircle, Newspaper, Phone, UsersRound } from 'lucide-react'
import { Link } from 'react-router'
import type { ReactNode } from 'react'
import { useSettings } from '@/hooks/queries'
import { useWishlistStore } from '@/stores/wishlistStore'
import { cn } from '@/lib/utils'
import { LogoMark } from '../brand/Logo'

function FooterLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-brand-700"
    >
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-brand-50 text-brand-600">{icon}</span>
      {children}
    </a>
  )
}

function FooterNav({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-brand-700">
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-brand-50 text-brand-600">{icon}</span>
      {children}
    </Link>
  )
}

/** Compact footer — contact info comes from settings.json (editable in admin). */
export function Footer({ className }: { className?: string }) {
  const { data: s } = useSettings()
  const tel = s?.hotline.replace(/\s/g, '')
  const wishCount = useWishlistStore((x) => x.ids.length)
  return (
    <footer className={cn('mt-8 border-t border-line bg-surface', className)}>
      <div className="container-page grid gap-6 py-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <LogoMark className="size-7" />
            <span className="text-lg font-extrabold">Jamir</span>
          </div>
          <p className="max-w-xs text-sm text-muted">Mua sắm công nghệ qua video thật — xem trước, chọn đúng ngay lần đầu.</p>
          {s?.address && <p className="text-xs text-subtle">{s.address}</p>}
        </div>
        <nav aria-label="Khám phá" className="flex flex-col gap-2.5">
          <p className="text-sm font-bold">Khám phá</p>
          <FooterNav to="/news" icon={<Newspaper className="size-4" />}>
            Tin tức
          </FooterNav>
          <FooterNav to="/wishlist" icon={<Heart className="size-4" />}>
            Yêu thích{wishCount > 0 && <span className="rounded-full bg-danger-strong px-1.5 text-[11px] font-bold text-white">{wishCount}</span>}
          </FooterNav>
          <FooterNav to="/shop" icon={<LayoutGrid className="size-4" />}>
            Danh mục sản phẩm
          </FooterNav>
        </nav>
        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-bold">Liên hệ với chúng tôi</p>
          {s && (
            <>
              <FooterLink href={s.zalo} icon={<MessageCircle className="size-4" />}>
                Zalo: {s.hotline}
              </FooterLink>
              <FooterLink href={`tel:${tel}`} icon={<Phone className="size-4" />}>
                Hotline: {s.hotline}
              </FooterLink>
              <FooterLink href={`mailto:${s.email}`} icon={<Mail className="size-4" />}>
                {s.email}
              </FooterLink>
            </>
          )}
        </div>
        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-bold">Hợp tác KOC / KOL</p>
          <p className="text-sm text-muted">Review sản phẩm, nhận hoa hồng hấp dẫn cùng JAMIR.</p>
          {s && (
            <FooterLink href={s.kolContact} icon={<Handshake className="size-4" />}>
              Đăng ký hợp tác qua Zalo
            </FooterLink>
          )}
        </div>
        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-bold">Cộng đồng</p>
          {s && (
            <>
              <FooterLink href={s.community.zaloGroup} icon={<UsersRound className="size-4" />}>
                Nhóm Zalo JAMIR
              </FooterLink>
              <FooterLink href={s.community.facebook} icon={<Globe className="size-4" />}>
                Facebook Group
              </FooterLink>
            </>
          )}
        </div>
      </div>
      <p className="border-t border-line py-3 text-center text-xs text-subtle">© 2026 JAMIR</p>
    </footer>
  )
}
