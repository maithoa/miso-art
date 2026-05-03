import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGalleryFilter } from './useGalleryFilter'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const products = [
  {
    id: '1',
    name: 'Red Apple',
    description: 'A fresh red apple',
    price: 100,
    image_url: 'apple.png',
    tags: ['fruit', 'red', 'fresh'],
    is_available: true,
  },
  {
    id: '2',
    name: 'Green Mango',
    description: 'A ripe green mango',
    price: 200,
    image_url: 'mango.png',
    tags: ['fruit', 'green', 'tropical'],
    is_available: true,
  },
  {
    id: '3',
    name: 'Carrot',
    description: 'An organic carrot',
    price: 50,
    image_url: 'carrot.png',
    tags: ['vegetable', 'orange', 'fresh'],
    is_available: true,
  },
  {
    id: '4',
    name: 'Blueberry',
    description: 'Wild blueberries',
    price: 300,
    image_url: 'blueberry.png',
    tags: ['fruit', 'blue', 'fresh'],
    is_available: false,
  },
  {
    id: '5',
    name: 'Mystery Box',
    description: '',
    price: 999,
    image_url: 'box.png',
    tags: [],
    is_available: true,
  },
]

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function setup(initialProducts = products) {
  return renderHook(() => useGalleryFilter(initialProducts))
}

// ---------------------------------------------------------------------------
// Tests — Issue 04 filtering combinations
// ---------------------------------------------------------------------------
describe('useGalleryFilter', () => {
  // --- allTags derivation ---------------------------------------------------
  it('derives a sorted union of all tags from products', () => {
    const { result } = setup()
    expect(result.current.allTags).toEqual([
      'blue',
      'fresh',
      'fruit',
      'green',
      'orange',
      'red',
      'tropical',
      'vegetable',
    ])
  })

  it('returns empty allTags when no products have tags', () => {
    const { result } = setup([products[4]]) // Mystery Box has []
    expect(result.current.allTags).toEqual([])
  })

  // --- No filters (initial state) ------------------------------------------
  it('returns all products when search is empty and no tags selected', () => {
    const { result } = setup()
    expect(result.current.filteredProducts).toHaveLength(products.length)
  })

  // --- Search-only filters -------------------------------------------------
  it('filters by search query matching product name (case-insensitive)', () => {
    const { result } = setup()
    act(() => result.current.setSearchQuery('apple'))
    expect(result.current.filteredProducts).toHaveLength(1)
    expect(result.current.filteredProducts[0].id).toBe('1')
  })

  it('filters by search query matching product description', () => {
    const { result } = setup()
    act(() => result.current.setSearchQuery('organic'))
    expect(result.current.filteredProducts).toHaveLength(1)
    expect(result.current.filteredProducts[0].id).toBe('3')
  })

  it('is case-insensitive for search', () => {
    const { result } = setup()
    act(() => result.current.setSearchQuery('MANGO'))
    expect(result.current.filteredProducts).toHaveLength(1)
    expect(result.current.filteredProducts[0].id).toBe('2')
  })

  it('returns empty array when search matches nothing', () => {
    const { result } = setup()
    act(() => result.current.setSearchQuery('zzznomatch'))
    expect(result.current.filteredProducts).toHaveLength(0)
  })

  it('returns all products when search query is only whitespace', () => {
    const { result } = setup()
    act(() => result.current.setSearchQuery('   '))
    expect(result.current.filteredProducts).toHaveLength(products.length)
  })

  it('handles product with empty description without throwing', () => {
    const { result } = setup()
    act(() => result.current.setSearchQuery('mystery'))
    expect(result.current.filteredProducts).toHaveLength(1)
    expect(result.current.filteredProducts[0].id).toBe('5')
  })

  // --- Tag-only filters ----------------------------------------------------
  it('filters by a single selected tag', () => {
    const { result } = setup()
    act(() => result.current.toggleTag('vegetable'))
    expect(result.current.filteredProducts).toHaveLength(1)
    expect(result.current.filteredProducts[0].id).toBe('3')
  })

  it('filters to multiple products sharing a tag', () => {
    const { result } = setup()
    act(() => result.current.toggleTag('fruit'))
    // apple, mango, blueberry
    expect(result.current.filteredProducts).toHaveLength(3)
  })

  it('composing two tags returns only products that have BOTH tags', () => {
    const { result } = setup()
    act(() => {
      result.current.toggleTag('fruit')
      result.current.toggleTag('fresh')
    })
    // apple (fruit+fresh) and blueberry (fruit+fresh); mango is fruit but not fresh
    const ids = result.current.filteredProducts.map((p) => p.id)
    expect(ids).toContain('1')
    expect(ids).toContain('4')
    expect(ids).not.toContain('2')
    expect(result.current.filteredProducts).toHaveLength(2)
  })

  it('returns empty when no product has all selected tags simultaneously', () => {
    const { result } = setup()
    act(() => {
      result.current.toggleTag('red')
      result.current.toggleTag('green')
    })
    expect(result.current.filteredProducts).toHaveLength(0)
  })

  it('deselecting a tag removes it from selectedTags', () => {
    const { result } = setup()
    act(() => result.current.toggleTag('fruit'))
    expect(result.current.selectedTags).toContain('fruit')
    act(() => result.current.toggleTag('fruit'))
    expect(result.current.selectedTags).not.toContain('fruit')
    expect(result.current.filteredProducts).toHaveLength(products.length)
  })

  it('product with empty tags array is excluded when any tag is selected', () => {
    const { result } = setup()
    act(() => result.current.toggleTag('fruit'))
    const ids = result.current.filteredProducts.map((p) => p.id)
    expect(ids).not.toContain('5') // Mystery Box has no tags
  })

  // --- Composed search + tag filters (Issue 04 core requirement) -----------
  it('composes search and single tag: product must match both', () => {
    const { result } = setup()
    act(() => {
      result.current.setSearchQuery('berry')
      result.current.toggleTag('fruit')
    })
    // blueberry matches "berry" AND has tag "fruit"
    expect(result.current.filteredProducts).toHaveLength(1)
    expect(result.current.filteredProducts[0].id).toBe('4')
  })

  it('composes search and tag where search matches but tag does not', () => {
    const { result } = setup()
    act(() => {
      result.current.setSearchQuery('carrot')
      result.current.toggleTag('fruit') // carrot is vegetable, not fruit
    })
    expect(result.current.filteredProducts).toHaveLength(0)
  })

  it('composes search and tag where tag matches but search does not', () => {
    const { result } = setup()
    act(() => {
      result.current.setSearchQuery('zzznomatch')
      result.current.toggleTag('fruit')
    })
    expect(result.current.filteredProducts).toHaveLength(0)
  })

  it('composes search with multiple tags: all three conditions must be met', () => {
    const { result } = setup()
    act(() => {
      result.current.setSearchQuery('apple')
      result.current.toggleTag('fruit')
      result.current.toggleTag('fresh')
    })
    expect(result.current.filteredProducts).toHaveLength(1)
    expect(result.current.filteredProducts[0].id).toBe('1')
  })

  it('clearing search while tags active re-shows all tag-matching products', () => {
    const { result } = setup()
    act(() => {
      result.current.setSearchQuery('apple')
      result.current.toggleTag('fruit')
    })
    expect(result.current.filteredProducts).toHaveLength(1)
    act(() => result.current.setSearchQuery(''))
    // Now only tag filter active: fruit → apple, mango, blueberry
    expect(result.current.filteredProducts).toHaveLength(3)
  })

  // --- Edge cases ----------------------------------------------------------
  it('handles empty products array gracefully', () => {
    const { result } = setup([])
    expect(result.current.filteredProducts).toHaveLength(0)
    expect(result.current.allTags).toHaveLength(0)
  })

  it('handles products where tags field is undefined without throwing', () => {
    const productWithoutTags = [
      { id: '99', name: 'NoTag', description: '', price: 0, image_url: '', is_available: true },
    ]
    const { result } = setup(productWithoutTags)
    act(() => result.current.toggleTag('fruit'))
    // Should not throw; product lacks tags so is excluded
    expect(result.current.filteredProducts).toHaveLength(0)
  })
})
