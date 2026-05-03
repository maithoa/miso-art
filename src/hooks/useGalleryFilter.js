import { useState, useMemo } from 'react'

/**
 * Manages search query + selected tag state and derives a filtered product list.
 * Both filters compose: a product must match the search term AND every selected tag.
 *
 * @param {import('../hooks/useProducts').Product[]} products
 * @returns {{ searchQuery, setSearchQuery, selectedTags, toggleTag, filteredProducts, allTags }}
 */
export function useGalleryFilter(products) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])

  // Derive sorted union of all tags across every product
  const allTags = useMemo(() => {
    const tagSet = new Set()
    products.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => tagSet.add(t))
      }
    })
    return Array.from(tagSet).sort()
  }, [products])

  // Toggle a single tag in/out of the selected set
  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return products.filter((product) => {
      // Search filter: match against name and description (case-insensitive)
      const matchesSearch =
        query === '' ||
        product.name.toLowerCase().includes(query) ||
        (product.description ?? '').toLowerCase().includes(query)

      // Tag filter: product must contain ALL selected tags
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) =>
          Array.isArray(product.tags) && product.tags.includes(tag)
        )

      return matchesSearch && matchesTags
    })
  }, [products, searchQuery, selectedTags])

  return {
    searchQuery,
    setSearchQuery,
    selectedTags,
    toggleTag,
    filteredProducts,
    allTags,
  }
}
