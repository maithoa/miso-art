import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider, useCart } from './context/CartContext'
import NavBar from './components/NavBar'
import CartDrawer from './components/CartDrawer'

// TODO: replace these lazy imports with your actual page components
import Gallery from './pages/Gallery'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import ThankYou from './pages/ThankYou'
// TODO(dev2): import admin pages when available
// import AdminDashboard from './pages/admin/Dashboard'

// Public routes where NavBar should be visible
const PUBLIC_ROUTES = ['/', '/checkout']

// Wrapper so we can use hooks that depend on Router context
function AppShell() {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { items } = useCart()
  const prevItemCount = useRef(items.length)

  // Auto-open drawer when a new item is added to the cart
  useEffect(() => {
    const currentCount = items.reduce((s, i) => s + i.quantity, 0)
    const prevCount = prevItemCount.current
    if (currentCount > prevCount) {
      setDrawerOpen(true)
    }
    prevItemCount.current = currentCount
  }, [items])

  // Determine whether the current route is a public route
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname)

  return (
    <div className="min-h-screen bg-gray-50">
      {isPublicRoute && (
        <NavBar onCartOpen={() => setDrawerOpen(true)} />
      )}

      {/* Offset content below fixed NavBar on public routes */}
      <main className={isPublicRoute ? 'pt-16' : ''}>
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/thank-you" element={<ThankYou />} />
          {/* TODO(dev2): add admin routes here e.g. <Route path="/admin/*" element={<AdminDashboard />} /> */}
        </Routes>
      </main>

      {/* CartDrawer is always mounted so transitions work; isOpen controls visibility */}
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
