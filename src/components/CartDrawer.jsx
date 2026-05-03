import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

// Format cents to EUR string e.g. "12.50 €"
function formatEUR(cents) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function CartItem({ item, onRemove }) {
  return (
    <li className="flex items-start gap-3 py-4 border-b border-gray-100 last:border-0">
      {/* Thumbnail */}
      <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🖼</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {item.quantity} × {formatEUR(item.price)}
        </p>
        {/* Line total */}
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatEUR(item.price * item.quantity)}</p>
      </div>

      <button
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.name} from cart`}
        className="flex-shrink-0 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  )
}

export default function CartDrawer({ isOpen, onClose }) {
  const { items, total, removeItem } = useCart()
  const navigate = useNavigate()
  const drawerRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleOverlayClick = useCallback((e) => {
    // Close only if click landed on the overlay, not inside the drawer panel
    if (drawerRef.current && !drawerRef.current.contains(e.target)) {
      onClose()
    }
  }, [onClose])

  const handleCheckout = () => {
    onClose()
    navigate('/checkout')
  }

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden={!isOpen}
        onClick={handleOverlayClick}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
              <span className="text-5xl">🛒</span>
              <p className="text-gray-500 text-sm">Your cart is empty.<br />Browse the gallery to add items!</p>
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <CartItem key={item.id} item={item} onRemove={removeItem} />
              ))}
            </ul>
          )}
        </div>

        {/* Footer — only shown when cart has items */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-gray-700">Total</span>
              <span className="text-base font-bold text-gray-900">{formatEUR(total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600"
            >
              Go to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  )
}
