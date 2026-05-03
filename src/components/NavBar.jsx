import { useEffect, useRef } from 'react'
import { useCart } from '../context/CartContext'

// NavBar receives onCartOpen callback to trigger drawer
export default function NavBar({ onCartOpen }) {
  const { items } = useCart()

  // Total item count across all quantities
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Site logo / name */}
        <a href="/" className="text-xl font-bold text-gray-900 tracking-tight hover:text-gray-700 transition-colors">
          🛍 MyShop
        </a>

        {/* Cart icon with badge */}
        <button
          onClick={onCartOpen}
          aria-label={`Open cart, ${itemCount} items`}
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>

          {/* Badge — only shown when cart has items */}
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1 leading-none">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
