import { useState, useContext } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripePromise } from '../lib/stripe'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'

// --- PaymentStep: mounts Stripe PaymentElement after clientSecret is obtained ---
function PaymentStep({ clientSecret, paymentIntentId, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { clearCart } = useCart()
  const navigate = useNavigate()

  const handlePay = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError('')
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      // Redirect is handled manually below via redirect: 'if_required'
      redirect: 'if_required',
    })
    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.')
      setLoading(false)
      return
    }
    clearCart()
    navigate(`/thank-you?payment_intent=${paymentIntentId}`)
  }

  return (
    <form onSubmit={handlePay} className="mt-6 space-y-4">
      <PaymentElement />
      {error && (
        <p role="alert" className="text-red-600 text-sm">{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Processing…' : 'Pay Now'}
      </button>
    </form>
  )
}

// --- CheckoutForm: collects customer info and calls the Edge Function ---
function CheckoutForm() {
  const { items } = useCart()
  const [form, setForm] = useState({
    name: '', email: '', street: '', city: '', postal_code: '', country: '',
  })
  const [fieldError, setFieldError] = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [paymentIntentId, setPaymentIntentId] = useState('')

  const allFilled = Object.values(form).every((v) => v.trim() !== '')

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldError('')
    setApiError('')

    if (!allFilled) {
      setFieldError('All fields are required.')
      return
    }

    setLoading(true)
    try {
      // Do not send prices — Edge Function fetches authoritative prices server-side
      const body = {
        items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          street: form.street.trim(),
          city: form.city.trim(),
          postal_code: form.postal_code.trim(),
          country: form.country.trim(),
        },
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(body),
        }
      )

      const data = await res.json()

      if (res.status === 400) {
        setApiError('One or more items are no longer available.')
        setLoading(false)
        return
      }

      if (!res.ok) {
        setApiError(data?.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Extract paymentIntentId from clientSecret (format: pi_xxx_secret_yyy)
      const piId = data.clientSecret.split('_secret_')[0]
      setPaymentIntentId(piId)
      setClientSecret(data.clientSecret)
    } catch {
      setApiError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', autoComplete: 'name' },
    { name: 'email', label: 'Email Address', type: 'email', autoComplete: 'email' },
    { name: 'street', label: 'Street Address', type: 'text', autoComplete: 'street-address' },
    { name: 'city', label: 'City', type: 'text', autoComplete: 'address-level2' },
    { name: 'postal_code', label: 'Postal Code', type: 'text', autoComplete: 'postal-code' },
    { name: 'country', label: 'Country', type: 'text', autoComplete: 'country-name' },
  ]

  return (
    <div className="max-w-lg mx-auto">
      {!clientSecret ? (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {fields.map(({ name, label, type, autoComplete }) => (
            <div key={name}>
              <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                autoComplete={autoComplete}
                value={form[name]}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}

          {fieldError && (
            <p role="alert" className="text-red-600 text-sm">{fieldError}</p>
          )}
          {apiError && (
            <p role="alert" className="text-red-600 text-sm">{apiError}</p>
          )}

          <button
            type="submit"
            disabled={!allFilled || loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Please wait…' : 'Continue to Payment'}
          </button>
        </form>
      ) : (
        // Mount Stripe Elements only after clientSecret is available
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentStep
            clientSecret={clientSecret}
            paymentIntentId={paymentIntentId}
            onError={setApiError}
          />
        </Elements>
      )}
    </div>
  )
}

export default function Checkout() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>
        <CheckoutForm />
      </div>
    </main>
  )
}
