import { useCart } from '../context/CartContext'

export default function NavBar({ onCartOpen }) {
  const { items } = useCart()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        <a
          href="/"
          className="text-lg font-bold text-[#1a1a1a] tracking-tight hover:opacity-70 transition-opacity"
        >
          Miso Art
        </a>

        <button
          onClick={onCartOpen}
          aria-label={`Open cart, ${itemCount} items`}
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff90e8]"
        >
          <svg
            className="w-6 h-6 text-[#1a1a1a]"
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
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#ff90e8] text-[#1a1a1a] text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1 leading-none">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
