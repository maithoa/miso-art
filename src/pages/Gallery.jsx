import { useState, useMemo } from 'react'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/ProductCard'
import MostLoved from '../components/MostLoved'
import SeasonalBanner from '../components/SeasonalBanner'
import { SearchBar } from '../components/SearchBar'
import { TagPills } from '../components/TagPills'

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#e5e5e5] bg-white animate-pulse">
      <div style={{ paddingTop: '75%' }} className="relative bg-gray-100 w-full" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-5/6" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-5 bg-gray-100 rounded-full w-16" />
          <div className="h-8 bg-gray-100 rounded-full w-24" />
        </div>
      </div>
    </div>
  )
}

export default function Gallery() {
  const { products, loading, error } = useProducts()
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState([])

  const allTags = useMemo(() => {
    const set = new Set()
    products.forEach(p => (p.tags || []).forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase())
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(t => (p.tags || []).includes(t))
      return matchesSearch && matchesTags
    })
  }, [products, search, selectedTags])

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-8 py-12">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1a1a] tracking-tight">Handmade Postcards</h1>
        <p className="text-gray-500 mt-1 text-sm">Small-batch art, sent with love.</p>
      </div>

      <SeasonalBanner />
      <MostLoved />

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-8">
        <SearchBar value={search} onChange={setSearch} />
        <TagPills tags={allTags} selectedTags={selectedTags} onToggle={toggleTag} />
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 px-5 py-4 mb-6">
          <p className="font-bold">Failed to load products</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center text-gray-400 py-20">
          <p className="text-lg font-bold text-[#1a1a1a]">No postcards found.</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
    </main>
  )
}
