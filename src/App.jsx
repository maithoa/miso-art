import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Gallery from './pages/Gallery';
import Checkout from './pages/Checkout';
import ThankYou from './pages/ThankYou';
import Login from './pages/Login';
import AdminRoute from './components/AdminRoute';

const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));

function AdminSuspense({ children }) {
  return <Suspense fallback={<div className="p-8 text-gray-500">Loading…</div>}>{children}</Suspense>;
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/login" element={<Login />} />

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
      </BrowserRouter>
    </CartProvider>
  );
}
