import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

function formatEUR(cents) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
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

function Field({ label, id, type = 'text', value, onChange, placeholder, required = true }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#1a1a1a] mb-1">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border border-[#e5e5e5] rounded-xl px-3 py-2 text-sm text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff90e8] focus:border-transparent"
      />
    </div>
  )
}

// Step 2: Stripe Payment Element — only mounted after clientSecret is ready
function PaymentStep({ clientSecret, onBack }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handlePay = async (e) => {
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
    <form onSubmit={handlePay} className="space-y-5">
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
      <button type="button" onClick={onBack} className="w-full text-sm text-gray-400 hover:text-gray-600 py-1">
        ← Back to details
      </button>
    </form>
  )
}

export default function Checkout() {
  const { items } = useCart()
  const [clientSecret, setClientSecret] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', street: '', city: '', postal_code: '', country: '',
  })

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleContinue = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        customer: form,
      },
    })

    setLoading(false)
    if (fnError) { setError(fnError.message); return }
    setClientSecret(data.clientSecret)
  }

  if (items.length === 0) return (
    <main className="max-w-lg mx-auto px-4 md:px-8 py-16 text-center">
      <p className="text-gray-500">Your cart is empty.</p>
    </main>
  )

  return (
    <main className="max-w-lg mx-auto px-4 md:px-8 py-12">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">Checkout</h1>
      <OrderSummary items={items} />

      {!clientSecret ? (
        // Step 1: collect customer info
        <form onSubmit={handleContinue} className="space-y-4">
          <Field label="Full name" id="name" value={form.name} onChange={set('name')} placeholder="Jane Smith" />
          <Field label="Email" id="email" type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" />
          <Field label="Street address" id="street" value={form.street} onChange={set('street')} placeholder="123 Main St" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" id="city" value={form.city} onChange={set('city')} placeholder="Amsterdam" />
            <Field label="Postal code" id="postal_code" value={form.postal_code} onChange={set('postal_code')} placeholder="1234 AB" />
          </div>
          <Field label="Country" id="country" value={form.country} onChange={set('country')} placeholder="Netherlands" />

          {error && (
            <p className="text-red-600 text-sm border border-red-200 bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1a1a] text-white font-bold py-3 rounded-full transition-opacity hover:opacity-80 active:scale-95 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a1a1a]"
          >
            {loading ? 'Loading payment…' : 'Continue to payment →'}
          </button>
        </form>
      ) : (
        // Step 2: Stripe Payment Element
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentStep clientSecret={clientSecret} onBack={() => setClientSecret(null)} />
        </Elements>
      )}
    </main>
  )
}
