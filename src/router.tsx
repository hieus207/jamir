import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
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
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'product/:slug', element: <ProductPage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: 'community', element: <CommunityPage /> },
      { path: 'wishlist', element: <WishlistPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
