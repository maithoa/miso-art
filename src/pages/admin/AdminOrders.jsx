import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminRoute from '../../components/AdminRoute';
import StatusBadge from '../../components/StatusBadge';
import { supabase } from '../../lib/supabase';
import { formatEUR } from '../../lib/currency';

function AdminOrdersInner() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, customer_name, status, total')
        // sort most-recent first
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setOrders(data);
      setLoading(false);
    })();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  className="hover:bg-indigo-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{order.customer_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatEUR(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminOrders() {
  return <AdminRoute><AdminOrdersInner /></AdminRoute>;
}
