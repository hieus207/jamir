import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/jamir/layout/AppLayout'

const ProductPage = lazy(() => import('@/pages/ProductPage'))

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/product/tai-nghe-airbuds" replace /> },
      { path: 'product/:slug', element: <ProductPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
