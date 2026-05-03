import { useMostLoved } from '../hooks/useMostLoved'
import ProductCard from './ProductCard'
import { normaliseProduct } from '../lib/products'

// Medal labels for top-3 ranking positions
const RANK_LABELS = ['🥇', '🥈', '🥉']

// Excluded statuses: products not available are still shown but marked
// We filter nothing — ProductCard handles unavailable styling internally

function MostLovedSkeleton() {
  return (
    <div className="animate-pulse flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="min-w-[220px] rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden"
        >
          <div className="bg-gray-200" style={{ paddingTop: '75%' }} />
          <div className="p-4 flex flex-col gap-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="flex justify-between items-center mt-2">
              <div className="h-5 bg-gray-200 rounded w-16" />
              <div className="h-8 bg-gray-200 rounded-xl w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MostLoved() {
  const { products, loading, error } = useMostLoved()

  if (loading) {
    return (
      <section className="mb-10" aria-label="Most Loved Products">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💛 Most Loved</h2>
        <MostLovedSkeleton />
      </section>
    )
  }

  if (error) {
    return (
      <section className="mb-10" aria-label="Most Loved Products">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💛 Most Loved</h2>
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-5 py-4">
          <p className="font-medium">Could not load most loved products</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </section>
    )
  }

  // Null / empty state
  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="mb-10" aria-label="Most Loved Products">
      <h2 className="text-xl font-bold text-gray-900 mb-4">💛 Most Loved</h2>
      {/* Horizontal scroll on small screens, wraps on larger */}
      <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
        {products.map((product, index) => {
          // Delegate all field mapping to normaliseProduct — single source of truth
          const cardProduct = normaliseProduct(product)

          return (
            <div key={cardProduct.id} className="relative min-w-[220px] sm:min-w-0">
              {/* Show rank medal for top-3 */}
              {index < 3 && (
                <span
                  className="absolute top-2 left-2 z-10 text-xl leading-none"
                  aria-label={`Rank ${index + 1}`}
                >
                  {RANK_LABELS[index]}
                </span>
              )}
              <ProductCard product={cardProduct} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
