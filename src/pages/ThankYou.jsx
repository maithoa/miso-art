import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 30000;

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');

  const [order, setOrder] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const stopPolling = () => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    if (!paymentIntentId) {
      setError('Missing payment reference.');
      return;
    }

    const poll = async () => {
      const { data, error: dbError } = await supabase
        .from('orders')
        .select('id, stripe_payment_id, status, customer_name, total')
        // Match on the Stripe PI id — stripe_payment_id is the join key
        .eq('stripe_payment_id', paymentIntentId)
        .eq('status', 'payment_confirmed')
        .maybeSingle();

      if (dbError) { setError(dbError.message); stopPolling(); return; }
      if (data) {
        setOrder(data);
        stopPolling();
      }
    };

    // Start polling immediately then repeat
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    // Fallback: stop polling after 30 s and show timeout message
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setTimedOut(true);
    }, TIMEOUT_MS);

    return () => stopPolling();
  }, [paymentIntentId]);

  if (error) {
    return (
      <div className="max-w-lg mx-auto p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (order) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-600">Order Confirmed!</h1>
        <p className="text-lg">Thank you, <strong>{order.customer_name}</strong>!</p>
        <p className="text-gray-600">
          Order total: <strong>£{(order.total / 100).toFixed(2)}</strong>
        </p>
        <p className="text-sm text-gray-400">Order ID: {order.id}</p>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-yellow-600">Still processing…</h1>
        <p className="text-gray-600">
          We haven't received confirmation yet. Please check your email or contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-8 text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
      <p className="text-gray-600">Confirming your order, please wait…</p>
    </div>
  );
}
