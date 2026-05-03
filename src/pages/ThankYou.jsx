import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatEUR } from '../lib/currency'

const POLL_INTERVAL_MS = 2000
const TIMEOUT_MS = 30000

export default function ThankYou() {
  const [searchParams] = useSearchParams()
  const paymentIntentId = searchParams.get('payment_intent')

  const [order, setOrder] = useState(null)
  const [timedOut, setTimedOut] = useState(false)
  const [error, setError] = useState(null)

  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)

  const stopPolling = () => {
    clearInterval(intervalRef.current)
    clearTimeout(timeoutRef.current)
  }

  useEffect(() => {
    if (!paymentIntentId) { setError('Missing payment reference.'); return }

    const poll = async () => {
      const { data, error: dbError } = await supabase
        .from('orders')
        .select('id, stripe_payment_id, status, customer_name, total')
        .eq('stripe_payment_id', paymentIntentId)
        .eq('status', 'payment_confirmed')
        .maybeSingle()

      if (dbError) { setError(dbError.message); stopPolling(); return }
      if (data) { setOrder(data); stopPolling() }
    }

    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)
    timeoutRef.current = setTimeout(() => { stopPolling(); setTimedOut(true) }, TIMEOUT_MS)
    return () => stopPolling()
  }, [paymentIntentId])

  if (error) return (
    <main className="max-w-lg mx-auto px-4 md:px-8 py-16">
      <div className="border border-red-200 bg-red-50 rounded-2xl px-5 py-4">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    </main>
  )

  if (order) return (
    <main className="max-w-lg mx-auto px-4 md:px-8 py-16 text-center">
      <div className="border border-[#e5e5e5] rounded-2xl p-8 space-y-4">
        <div className="text-5xl mb-2">🎉</div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Order Confirmed!</h1>
        <p className="text-gray-500">
          Thank you, <span className="font-bold text-[#1a1a1a]">{order.customer_name}</span>!
        </p>
        <p className="text-gray-500">
          Order total: <span className="font-bold text-[#1a1a1a]">{formatEUR(order.total)}</span>
        </p>
        <p className="text-xs text-gray-400">Order ID: {order.id}</p>
        <Link
          to="/"
          className="inline-block mt-4 bg-[#1a1a1a] text-white font-bold px-6 py-3 rounded-full hover:opacity-80 transition-opacity"
        >
          Back to shop
        </Link>
      </div>
    </main>
  )

  if (timedOut) return (
    <main className="max-w-lg mx-auto px-4 md:px-8 py-16 text-center">
      <div className="border border-[#e5e5e5] rounded-2xl p-8 space-y-4">
        <div className="text-4xl">⏳</div>
        <h1 className="text-xl font-bold text-[#1a1a1a]">Still processing…</h1>
        <p className="text-gray-500 text-sm">
          We haven't received confirmation yet. Please check your email or contact support.
        </p>
        <Link
          to="/"
          className="inline-block mt-4 bg-[#1a1a1a] text-white font-bold px-6 py-3 rounded-full hover:opacity-80 transition-opacity"
        >
          Back to shop
        </Link>
      </div>
    </main>
  )

  return (
    <main className="max-w-lg mx-auto px-4 md:px-8 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff90e8]" />
        <p className="text-gray-500 text-sm">Confirming your order, please wait…</p>
      </div>
    </main>
  )
}
