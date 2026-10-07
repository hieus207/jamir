import { Suspense } from 'react'
import { Outlet, ScrollRestoration, useMatch } from 'react-router'
import { AuthDialog } from '../auth/AuthDialog'
import { BottomNavigation } from '../navigation/BottomNavigation'
import { Header } from '../navigation/Header'
import { MobileHeader } from '../navigation/MobileHeader'
import { Footer } from './Footer'
import { PageFallback } from './PageStates'

export function AppLayout() {
  const onProduct = useMatch('/product/:slug')
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-[100] rounded-btn bg-brand-600 px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Bỏ qua đến nội dung chính
      </a>
      <Header />
      <MobileHeader />
      <main id="main" className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer className={onProduct ? 'pb-28 lg:pb-0' : 'pb-20 md:pb-0'} />
      {!onProduct && <BottomNavigation />}
      <AuthDialog />
      <ScrollRestoration getKey={(location) => location.pathname} />
    </div>
  )
}
