import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider, useCart } from './context/CartContext'
import NavBar from './components/NavBar'
import CartDrawer from './components/CartDrawer'
import AdminRoute from './components/AdminRoute'
import Gallery from './pages/Gallery'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import ThankYou from './pages/ThankYou'

const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'))

const PUBLIC_ROUTES = ['/', '/checkout']

function AdminSuspense({ children }) {
  return <Suspense fallback={<div className="p-8 text-gray-500">Loading…</div>}>{children}</Suspense>
}

function AppShell() {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { items } = useCart()
  const prevItemCount = useRef(items.reduce((s, i) => s + i.quantity, 0))

  // Auto-open drawer when a new item is added
  useEffect(() => {
    const currentCount = items.reduce((s, i) => s + i.quantity, 0)
    if (currentCount > prevItemCount.current) setDrawerOpen(true)
    prevItemCount.current = currentCount
  }, [items])

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname)

  return (
    <div className="min-h-screen bg-gray-50">
      {isPublicRoute && <NavBar onCartOpen={() => setDrawerOpen(true)} />}

      <main className={isPublicRoute ? 'pt-16' : ''}>
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/thank-you" element={<ThankYou />} />

          <Route path="/admin/orders" element={
            <AdminRoute><AdminSuspense><AdminOrders /></AdminSuspense></AdminRoute>
          } />
          <Route path="/admin/orders/:id" element={
            <AdminRoute><AdminSuspense><AdminOrderDetail /></AdminSuspense></AdminRoute>
          } />
          <Route path="/admin/products" element={
            <AdminRoute><AdminSuspense><AdminProducts /></AdminSuspense></AdminRoute>
          } />
          <Route path="/admin/banners" element={
            <AdminRoute><AdminSuspense><AdminBanners /></AdminSuspense></AdminRoute>
          } />
        </Routes>
      </main>

      <CartDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <AppShell />
      </CartProvider>
    </BrowserRouter>
  )
}
