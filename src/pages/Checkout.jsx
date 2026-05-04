import React, { useState } from 'react'
import { useCartProducts } from '../hooks/useCartProducts'
import { useCart } from '../context/CartContext'

function OrderSummary() {
  const { items, total, loading, error } = useCartProducts()

  if (loading) {
    return <p className="text-gray-500 text-sm">Loading order summary…</p>
  }

  if (error) {
    return <p className="text-red-500 text-sm">Error loading products: {error}</p>
  }

  return (
    <section aria-labelledby="order-summary-heading">
      <h2
        id="order-summary-heading"
        className="text-lg font-semibold text-gray-900 mb-4"
      >
        Order Summary
      </h2>

      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No items in your cart.</p>
      ) : (
        <ul className="divide-y divide-gray-200 mb-4">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between py-3">
              <div>
                <p className="font-medium text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity} × ${(item.price / 100).toFixed(2)}
                </p>
              </div>
              <p className="font-semibold text-gray-900">
                ${((item.price * item.quantity) / 100).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between border-t border-gray-200 pt-4">
        <span className="font-medium text-gray-700">Total</span>
        <span className="font-bold text-gray-900 text-lg">
          ${(total / 100).toFixed(2)}
        </span>
      </div>
    </section>
  )
}

export default function Checkout() {
  const { clearCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // TODO(dev2): need endpoint POST /api/create-checkout-session that accepts cart items
  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      // Placeholder — integrate Stripe.js redirect here
      throw new Error('Stripe checkout not yet wired up')
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          {submitError && (
            <p className="text-red-500 text-sm">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {submitting ? 'Processing…' : 'Place Order'}
          </button>
        </form>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <OrderSummary />
      </div>
    </main>
  )
}
