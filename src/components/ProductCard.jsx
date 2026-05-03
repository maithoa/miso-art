import { useState } from 'react'
import { useCart } from '../context/CartContext'

function formatEUR(cents) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const { name, description, price, image_url, tags, is_available } = product

  function handleAddToCart() {
    if (!is_available) return
    addItem(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <article
      className={`flex flex-col rounded-2xl overflow-hidden border border-[#e5e5e5] bg-white transition-opacity duration-200 ${
        is_available ? 'opacity-100' : 'opacity-50'
      }`}
    >
      {/* Full-bleed image — 4:3 aspect ratio */}
      <div className="relative w-full" style={{ paddingTop: '75%' }}>
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
            No image
          </div>
        )}
        {!is_available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="bg-white text-[#1a1a1a] text-xs font-semibold px-3 py-1 rounded-full">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h2 className="text-base font-bold text-[#1a1a1a] leading-snug line-clamp-2">{name}</h2>

        {description && (
          <p className="text-sm text-gray-500 line-clamp-3 flex-1">{description}</p>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-[#1a1a1a]">{formatEUR(price)}</span>
          <button
            onClick={handleAddToCart}
            disabled={!is_available}
            className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#ff90e8] ${
              is_available
                ? added
                  ? 'bg-green-500 text-white cursor-default'
                  : 'bg-[#ff90e8] text-[#1a1a1a] hover:opacity-80'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {added ? 'Added ✓' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  )
}
