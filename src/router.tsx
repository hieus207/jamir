import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useLocation, useParams } from 'react-router'
import { AppLayout } from '@/components/jamir/layout/AppLayout'
import { RouteError } from '@/components/jamir/layout/RouteError'

// Route-level code splitting
const HomePage = lazy(() => import('@/pages/HomePage'))
const ProductPage = lazy(() => import('@/pages/ProductPage'))
const ShopPage = lazy(() => import('@/pages/ShopPage'))
const SearchPage = lazy(() => import('@/pages/SearchPage'))
const ExplorePage = lazy(() => import('@/pages/ExplorePage'))
const CommunityPage = lazy(() => import('@/pages/CommunityPage'))
const WishlistPage = lazy(() => import('@/pages/WishlistPage'))
const AccountPage = lazy(() => import('@/pages/AccountPage'))
const NewsPage = lazy(() => import('@/pages/NewsPage'))
const NewsArticlePage = lazy(() => import('@/pages/NewsArticlePage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LandingPreviewPage = lazy(() => import('@/pages/LandingPreviewPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

/** Old URL → new SEO URL, keeping the slug and query. */
function Legacy({ to }: { to: (slug: string) => string }) {
  const { slug = '' } = useParams()
  const { search } = useLocation()
  return <Navigate to={`${to(slug)}${search}`} replace />
}

export const router = createBrowserRouter([
  // admin live preview (rendered in an iframe)
  {
    path: 'preview/landing',
    element: (
      <Suspense>
        <LandingPreviewPage />
      </Suspense>
    ),
  },
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'san-pham/:slug', element: <ProductPage /> },
      { path: 'product/:slug', element: <Legacy to={(s) => `/san-pham/${s}`} /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: 'cong-dong', element: <CommunityPage /> },
      { path: 'community', element: <Navigate to="/cong-dong" replace /> },
      { path: 'wishlist', element: <WishlistPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'tin-tuc', element: <NewsPage /> },
      { path: 'tin-tuc/:slug', element: <NewsArticlePage /> },
      { path: 'news', element: <Navigate to="/tin-tuc" replace /> },
      { path: 'news/:slug', element: <Legacy to={(s) => `/tin-tuc/${s}`} /> },
      { path: 'admin/:section?', element: <AdminPage /> },
      { path: 'uu-dai/:slug', element: <LandingPage /> },
      { path: 'lp/:slug', element: <Legacy to={(s) => `/uu-dai/${s}`} /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
