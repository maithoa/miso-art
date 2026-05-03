import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/ProductCard'
import MostLoved from '../components/MostLoved'
import SeasonalBanner from '../components/SeasonalBanner'

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-white animate-pulse">
      {/* Image placeholder maintaining 4:3 ratio */}
      <div style={{ paddingTop: '75%' }} className="relative bg-gray-200 w-full" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-8 bg-gray-200 rounded-xl w-24" />
        </div>
      </div>
    </div>
  )
}

export default function Gallery() {
  const { products, loading, error } = useProducts()

  return (
    <main className="px-4 py-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Our Products</h1>

      {/* Seasonal banner — non-critical, renders null when no active banner */}
      <SeasonalBanner />

      {/* Most loved products section — renders null when no data */}
      <MostLoved />

      {/* Error state */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-5 py-4 mb-6">
          <p className="font-medium">Failed to load products</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Responsive grid: 1 col < 640px, 2 col 640-1023px, 3 col >= 1024px */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? // Show 6 skeleton cards while loading
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {/* Empty state — only show when done loading with no error */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center text-gray-500 py-16">
          <p className="text-lg font-medium">No products available yet.</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}
    </main>
  )
}
