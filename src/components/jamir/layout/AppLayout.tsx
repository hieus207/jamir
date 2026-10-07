import { lazy, type ReactNode, Suspense, useState } from 'react'
import { motion } from 'motion/react'
import { Outlet, ScrollRestoration, useLocation, useMatch } from 'react-router'
import { useCheckoutStore } from '@/stores/checkoutStore'
import { useAuthDialog } from '../auth/authStore'
import { CartSheet } from '../checkout/CartSheet'
import { BottomNavigation } from '../navigation/BottomNavigation'
import { Header } from '../navigation/Header'
import { MobileHeader } from '../navigation/MobileHeader'
import { Footer } from './Footer'
import { PageFallback } from './PageStates'

// Form-heavy dialogs (react-hook-form + zod) load on first open.
const AuthDialog = lazy(() => import('../auth/AuthDialog'))
const CheckoutSheet = lazy(() => import('../checkout/CheckoutSheet'))

/** Mounts children the first time `when` becomes true, then keeps them mounted (exit animations). */
function MountOnce({ when, children }: { when: boolean; children: ReactNode }) {
  const [mounted, setMounted] = useState(when)
  if (when && !mounted) setMounted(true)
  return mounted ? <Suspense>{children}</Suspense> : null
}

export function AppLayout() {
  const authOpen = useAuthDialog((s) => s.mode !== null)
  const checkoutOpen = useCheckoutStore((s) => s.open)
  const { pathname } = useLocation()
  // product → product uses the swipe slide instead
  const onProduct = useMatch('/product/:slug')
  const pageKey = onProduct ? 'product' : pathname
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
          <motion.div
            key={pageKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </Suspense>
      </main>
      <Footer className={onProduct ? 'pb-28 lg:pb-0' : 'pb-20 md:pb-0'} />
      {!onProduct && <BottomNavigation />}
      <MountOnce when={authOpen}>
        <AuthDialog />
      </MountOnce>
      <CartSheet />
      <MountOnce when={checkoutOpen}>
        <CheckoutSheet />
      </MountOnce>
      <ScrollRestoration getKey={(location) => location.pathname} />
    </div>
  )
}
