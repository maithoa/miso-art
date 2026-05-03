import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

function formatEUR(cents) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function CheckoutForm({ clientSecret }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message)
      setLoading(false)
      return
    }

    if (paymentIntent) {
      window.location.href = `/thank-you?payment_intent=${paymentIntent.id}`
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {error && (
        <p className="text-red-600 text-sm border border-red-200 bg-red-50 rounded-xl px-4 py-2">{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[#ff90e8] text-[#1a1a1a] font-bold py-3 rounded-full transition-opacity hover:opacity-80 active:scale-95 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff90e8]"
      >
        {loading ? 'Processing…' : 'Pay now'}
      </button>
    </form>
  )
}

function OrderSummary({ items }) {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  return (
    <div className="border border-[#e5e5e5] rounded-2xl p-5 mb-6">
      <h2 className="text-sm font-bold text-[#1a1a1a] mb-3 uppercase tracking-wide">Order Summary</h2>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-[#1a1a1a] font-medium">{item.name} <span className="text-gray-400">× {item.quantity}</span></span>
            <span className="font-semibold text-[#1a1a1a]">{formatEUR(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-[#e5e5e5] mt-3 pt-3 flex justify-between">
        <span className="text-sm font-bold text-[#1a1a1a]">Total</span>
        <span className="text-sm font-bold text-[#1a1a1a]">{formatEUR(total)}</span>
      </div>
    </div>
  )
}

export default function Checkout() {
  const { items } = useCart()
  const [clientSecret, setClientSecret] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    supabase.functions
      .invoke('create-payment-intent', { body: { amount: total, items } })
      .then(({ data, error }) => {
        if (error) { setError(error.message); return }
        setClientSecret(data.clientSecret)
      })
  }, [])

  if (error) return (
    <div className="max-w-lg mx-auto px-4 md:px-8 py-16">
      <p className="text-red-600 border border-red-200 bg-red-50 rounded-2xl px-5 py-4">{error}</p>
    </div>
  )

  return (
    <main className="max-w-lg mx-auto px-4 md:px-8 py-12">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">Checkout</h1>

      {items.length > 0 && <OrderSummary items={items} />}

      {!clientSecret ? (
        <div className="flex items-center gap-3 text-gray-400 py-8">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#ff90e8]" />
          <span className="text-sm">Loading payment…</span>
        </div>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} />
        </Elements>
      )}
    </main>
  )
}
