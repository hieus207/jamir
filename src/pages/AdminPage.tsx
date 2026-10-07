import {
  Clapperboard,
  FolderTree,
  CalendarHeart,
  LayoutDashboard,
  Megaphone,
  type LucideIcon,
  MessageSquareText,
  MessagesSquare,
  Newspaper,
  Package,
  Receipt,
  Settings,
  ShieldAlert,
  Sparkles,
  TicketPercent,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import { type ReactNode, useEffect } from 'react'
import { NavLink, useParams } from 'react-router'
import { OverviewPanel, CustomersPanel, SettingsPanel, STORY_SAMPLE, StoriesConfigCard, StoryImportButton } from '@/components/admin/panels'
import { ResourcePanel } from '@/components/admin/ResourcePanel'
import * as R from '@/components/admin/resources'
import { useAuthDialog, useSession } from '@/components/jamir/auth/authStore'
import { StateBlock } from '@/components/jamir/layout/PageStates'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Section {
  id: string
  label: string
  icon: LucideIcon
  render: () => ReactNode
}

const SECTIONS: Section[] = [
  { id: '', label: 'Tổng quan', icon: LayoutDashboard, render: () => <OverviewPanel /> },
  { id: 'customers', label: 'Khách hàng', icon: Users, render: () => <CustomersPanel /> },
  { id: 'orders', label: 'Đơn hàng', icon: Receipt, render: () => <ResourcePanel config={R.orders} /> },
  { id: 'products', label: 'Sản phẩm', icon: Package, render: () => <ResourcePanel config={R.products} /> },
  {
    id: 'stories',
    label: 'Stories',
    icon: Sparkles,
    render: () => (
      <div className="flex flex-col gap-5">
        <StoriesConfigCard />
        <ResourcePanel config={{ ...R.stories, toolbar: <StoryImportButton /> }} />
        <details className="rounded-card border border-line bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Mẫu file JSON để import story</summary>
          <p className="mt-2 text-muted">
            File có thể là 1 story, một mảng story, hoặc {'{ "items": [...] }'}. Không ghi <code>priority</code> thì story mới được xếp lên đầu.
          </p>
          <pre className="mt-2 overflow-x-auto rounded-[10px] bg-line-soft p-3 font-mono text-xs">{STORY_SAMPLE}</pre>
        </details>
      </div>
    ),
  },
  { id: 'kol-reviews', label: 'Video KOL', icon: Clapperboard, render: () => <ResourcePanel config={R.kolReviews} /> },
  { id: 'kols', label: 'KOL / KOC', icon: UserRoundCheck, render: () => <ResourcePanel config={R.kols} /> },
  { id: 'reviews', label: 'Đánh giá', icon: MessageSquareText, render: () => <ResourcePanel config={R.reviews} /> },
  { id: 'faqs', label: 'Hỏi đáp', icon: MessagesSquare, render: () => <ResourcePanel config={R.faqs} /> },
  { id: 'news', label: 'Tin tức', icon: Newspaper, render: () => <ResourcePanel config={R.news} /> },
  { id: 'promotions', label: 'Khuyến mại', icon: TicketPercent, render: () => <ResourcePanel config={R.promotions} /> },
  { id: 'landing-pages', label: 'Landing page', icon: Megaphone, render: () => <ResourcePanel config={R.landingPages} /> },
  { id: 'events', label: 'Sự kiện & popup', icon: CalendarHeart, render: () => <ResourcePanel config={R.events} /> },
  { id: 'categories', label: 'Danh mục', icon: FolderTree, render: () => <ResourcePanel config={R.categories} /> },
  { id: 'settings', label: 'Cài đặt', icon: Settings, render: () => <SettingsPanel /> },
]

export default function AdminPage() {
  const { section = '' } = useParams()
  const user = useSession((s) => s.user)
  const showAuth = useAuthDialog((s) => s.show)
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0]!

  useEffect(() => {
    document.title = `${current.label} · Quản trị — JAMIR`
  }, [current])

  if (user?.role !== 'admin')
    return (
      <StateBlock
        icon={ShieldAlert}
        className="min-h-[60vh] justify-center"
        title={user ? 'Bạn không có quyền quản trị' : 'Đăng nhập để vào trang quản trị'}
        description={user ? 'Tài khoản này chưa được cấp quyền quản trị.' : 'Dùng tài khoản quản trị (ADMIN_EMAIL / ADMIN_PASSWORD trên máy chủ).'}
        action={!user && <Button onClick={() => showAuth('login')}>Đăng nhập</Button>}
      />
    )

  return (
    <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4 px-4 pt-4 pb-24 md:flex-row md:gap-6 md:px-6 md:pt-6 md:pb-10">
      <nav aria-label="Quản trị" className="md:sticky md:top-24 md:w-52 md:shrink-0 md:self-start">
        <p className="mb-2 hidden px-3 text-xs font-bold tracking-wide text-subtle uppercase md:block">Quản trị JAMIR</p>
        <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <NavLink
                to={s.id ? `/admin/${s.id}` : '/admin'}
                end
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
                    isActive ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-line-soft hover:text-ink',
                  )
                }
              >
                <s.icon className="size-4" aria-hidden="true" />
                {s.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <section className="min-w-0 flex-1">{current.render()}</section>
    </div>
  )
}
