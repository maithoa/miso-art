import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function formatEUR(cents) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function QtyButton({ onClick, disabled, children, ariaLabel }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="w-7 h-7 flex items-center justify-center rounded-full border border-[#e5e5e5] text-[#1a1a1a] text-base font-bold transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#ff90e8]"
    >
      {children}
    </button>
  )
}

function CartItem({ item, onRemove, onUpdateQty }) {
  return (
    <li className="flex items-start gap-3 py-4 border-b border-[#e5e5e5] last:border-0">
      <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🖼</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1a1a1a] truncate">{item.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{formatEUR(item.price)} each</p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <QtyButton
            onClick={() => onUpdateQty(item.id, item.quantity - 1)}
            disabled={item.quantity === 1}
            ariaLabel={`Decrease quantity of ${item.name}`}
          >
            −
          </QtyButton>
          <span className="text-sm font-semibold text-[#1a1a1a] w-5 text-center" aria-live="polite">
            {item.quantity}
          </span>
          <QtyButton
            onClick={() => onUpdateQty(item.id, item.quantity + 1)}
            ariaLabel={`Increase quantity of ${item.name}`}
          >
            +
          </QtyButton>
        </div>

        {/* Line total */}
        <p className="text-sm font-bold text-[#1a1a1a] mt-1">{formatEUR(item.price * item.quantity)}</p>
      </div>

      <button
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.name} from cart`}
        className="flex-shrink-0 p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  )
}

export default function CartDrawer({ isOpen, onClose }) {
  const { items, total, removeItem, updateQuantity } = useCart()
  const navigate = useNavigate()
  const drawerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleOverlayClick = useCallback((e) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose()
  }, [onClose])

  const handleCheckout = () => {
    onClose()
    navigate('/checkout')
  }

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={handleOverlayClick}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5]">
          <h2 className="text-base font-bold text-[#1a1a1a]">Your Cart</h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#1a1a1a] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
              <span className="text-5xl">🛒</span>
              <p className="text-gray-500 text-sm">Your cart is empty.<br />Browse the gallery to add items!</p>
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onUpdateQty={updateQuantity}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#e5e5e5] px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">Total</span>
              <span className="text-base font-bold text-[#1a1a1a]" aria-live="polite">{formatEUR(total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-[#ff90e8] text-[#1a1a1a] py-3 rounded-full font-bold hover:opacity-80 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff90e8]"
            >
              Go to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  )
}
