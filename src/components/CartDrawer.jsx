import React from 'react'
import { useCart } from '../context/CartContext'
import { useCartProducts } from '../hooks/useCartProducts'

function CartLineItem({ item, onRemove, onQuantityChange }) {
  return (
    <li className="flex items-center gap-4 py-4 border-b border-gray-200">
      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-16 h-16 object-cover rounded"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-sm text-gray-500">
          ${(item.price / 100).toFixed(2)} each
        </p>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => onQuantityChange(item.id, item.quantity - 1)}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
            aria-label="Decrease quantity"
          >
            –
          </button>
          <span className="text-sm w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">
          ${((item.price * item.quantity) / 100).toFixed(2)}
        </p>
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs text-red-500 hover:underline mt-1"
          aria-label={`Remove ${item.name}`}
        >
          Remove
        </button>
      </div>
    </li>
  )
}

export default function CartDrawer({ isOpen, onClose }) {
  const { removeItem, updateQuantity, clearCart } = useCart()
  const { items, total, loading, error } = useCartProducts()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping cart">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <aside className="relative w-full max-w-md bg-white h-full flex flex-col shadow-xl">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close cart"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6">
          {loading && (
            <p className="text-gray-500 text-sm mt-6">Loading cart…</p>
          )}
          {error && (
            <p className="text-red-500 text-sm mt-6">Failed to load products: {error}</p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="text-gray-500 text-sm mt-6">Your cart is empty.</p>
          )}
          {!loading && (
            <ul>
              {items.map((item) => (
                <CartLineItem
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onQuantityChange={updateQuantity}
                />
              ))}
            </ul>
          )}
        </div>

        <footer className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between mb-4">
            <span className="font-medium text-gray-700">Subtotal</span>
            <span className="font-semibold text-gray-900">
              ${(total / 100).toFixed(2)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors mb-2"
          >
            Checkout
          </button>
          <button
            onClick={clearCart}
            className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear cart
          </button>
        </footer>
      </aside>
    </div>
  )
}
