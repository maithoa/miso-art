import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Checkout from './pages/Checkout';
import ThankYou from './pages/ThankYou';
import Login from './pages/Login';
import AdminRoute from './components/AdminRoute';

// Lazy admin pages — create these as needed
import { lazy, Suspense } from 'react';
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/OrderDetail'));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/login" element={<Login />} />

        {/* All /admin/* routes are protected by AdminRoute */}
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <Suspense fallback={<div>Loading…</div>}>
                <AdminOrders />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <AdminRoute>
              <Suspense fallback={<div>Loading…</div>}>
                <AdminOrderDetail />
              </Suspense>
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
