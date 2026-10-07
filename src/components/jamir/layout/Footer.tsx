import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { LogoMark } from '../brand/Logo'

const COLS = [
  { title: 'Mua sắm', links: [['Cửa hàng', '/shop'], ['Khám phá video', '/explore'], ['Yêu thích', '/wishlist']] },
  { title: 'Hỗ trợ', links: [['Chính sách đổi trả', '/'], ['Bảo hành', '/'], ['Giao hàng', '/']] },
  { title: 'JAMIR', links: [['Về chúng tôi', '/'], ['Cộng đồng', '/community'], ['Hợp tác KOL', '/']] },
] as const

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn('mt-6 border-t border-line bg-surface', className)}>
      <div className="container-page grid gap-8 py-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <LogoMark className="size-7" />
            <span className="text-lg font-extrabold">Jamir</span>
          </div>
          <p className="max-w-xs text-sm text-muted">
            Mua sắm công nghệ qua video thật từ KOL và khách hàng. Xem trước khi mua — chọn đúng ngay lần đầu.
          </p>
        </div>
        {COLS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2.5">
            <p className="text-sm font-bold">{col.title}</p>
            {col.links.map(([label, to]) => (
              <Link key={label} to={to} className="text-sm text-muted hover:text-brand-700">
                {label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-subtle">
        © 2026 JAMIR · Bản prototype — dữ liệu và hình ảnh chỉ mang tính minh họa
      </p>
    </footer>
  )
}
