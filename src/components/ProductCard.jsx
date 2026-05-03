import { useState } from 'react'
import { useCart } from '../context/CartContext'
import './ProductCard.css'

// Format integer cents to EUR display string
function formatEUR(cents) {
  return `€${(cents / 100).toFixed(2)}`
}

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const { name, description, price, image_url, tags, is_available } = product

  function handleAddToCart() {
    if (!is_available) return
    addItem(product, 1)
    // Show brief confirmation feedback
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <article
      className={`product-card flex flex-col rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-white transition-opacity duration-200 ${
        is_available ? 'opacity-100' : 'opacity-50'
      }`}
    >
      {/* Fixed aspect-ratio image container */}
      <div className="product-card__image-wrapper">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="product-card__image object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400 text-sm">
            No image
          </div>
        )}
        {!is_available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h2 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">{name}</h2>

        {description && (
          <p className="text-sm text-gray-500 line-clamp-3 flex-1">{description}</p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-gray-900">{formatEUR(price)}</span>
          <button
            onClick={handleAddToCart}
            disabled={!is_available}
            className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 ${
              is_available
                ? added
                  ? 'bg-green-500 text-white cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {added ? 'Added ✓' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  )
}
