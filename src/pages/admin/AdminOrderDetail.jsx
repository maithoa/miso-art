import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminRoute from '../../components/AdminRoute';
import StatusBadge from '../../components/StatusBadge';
import { supabase } from '../../lib/supabase';
import { formatEUR } from '../../lib/currency';

function AdminOrderDetailInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = async () => {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    if (orderError) { setError(orderError.message); setLoading(false); return; }

    // join order_items with product name
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('id, quantity, price_at_purchase, product_id, products(name)')
      .eq('order_id', id);
    if (itemsError) { setError(itemsError.message); setLoading(false); return; }

    setOrder(orderData);
    setItems(itemsData);
    setLoading(false);
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const updateStatus = async (newStatus) => {
    setActionLoading(true);
    // optimistic update
    setOrder((prev) => ({ ...prev, status: newStatus }));
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      setError(error.message);
      // revert optimistic update on failure
      setOrder((prev) => ({ ...prev, status: order.status }));
    }
    setActionLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-600">Error: {error}</p>
    </div>
  );

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button onClick={() => navigate('/admin/orders')}
        className="text-indigo-600 hover:underline text-sm mb-4 inline-block">← Back to orders</button>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {new Date(order.created_at).toLocaleString('en-GB')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-1">Customer</p>
              <p className="text-gray-900">{order.customer_name}</p>
              <p className="text-gray-500">{order.customer_email}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Shipping Address</p>
              <p className="text-gray-900">{order.shipping_street}</p>
              <p className="text-gray-900">{order.shipping_postal_code} {order.shipping_city}</p>
              <p className="text-gray-900">{order.shipping_country}</p>
            </div>
          </div>

          {order.stripe_payment_id && (
            <p className="text-xs text-gray-400 mt-3">Stripe ID: {order.stripe_payment_id}</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Line Items</h2>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left pb-2 font-medium text-gray-600">Product</th>
                <th className="text-center pb-2 font-medium text-gray-600">Qty</th>
                <th className="text-right pb-2 font-medium text-gray-600">Unit Price</th>
                <th className="text-right pb-2 font-medium text-gray-600">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 text-gray-900">{item.products?.name || item.product_id}</td>
                  <td className="py-2 text-center text-gray-700">{item.quantity}</td>
                  <td className="py-2 text-right text-gray-700">{formatEUR(item.price_at_purchase)}</td>
                  <td className="py-2 text-right font-medium text-gray-900">
                    {formatEUR(item.price_at_purchase * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t">
              <tr>
                <td colSpan={3} className="pt-3 text-right font-semibold text-gray-700">Total</td>
                <td className="pt-3 text-right font-bold text-gray-900">{formatEUR(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          {order.status === 'payment_confirmed' && (
            <button onClick={() => updateStatus('order_confirmed')} disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {actionLoading ? 'Updating…' : 'Confirm Order'}
            </button>
          )}
          {order.status === 'order_confirmed' && (
            <button onClick={() => updateStatus('sent')} disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {actionLoading ? 'Updating…' : 'Mark as Sent'}
            </button>
          )}
          {/* Cancel always visible but disabled; tooltip via title attribute */}
          <div className="relative group">
            <button disabled
              title="Coming soon"
              className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
              Cancel
            </button>
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Coming soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderDetail() {
  return <AdminRoute><AdminOrderDetailInner /></AdminRoute>;
}
