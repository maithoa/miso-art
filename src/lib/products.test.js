import { describe, it, expect } from 'vitest'
import { normaliseProduct, filterProducts } from './products'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A complete, well-formed row as returned by the most_loved_products view. */
const fullRow = {
  product_id:  'abc-123',
  name:        'Croissant',
  description: 'Buttery and flaky',
  price:       350,            // integer cents
  image_url:   'https://cdn.example.com/croissant.jpg',
  tags:        ['bakery', 'pastry'],
  is_available: true,
  total_sold:  42,             // extra view column — should be ignored / not forwarded
}

// ---------------------------------------------------------------------------
// 1. Full row mapping correctness
// ---------------------------------------------------------------------------

describe('normaliseProduct — full row', () => {
  it('maps product_id to id', () => {
    const result = normaliseProduct(fullRow)
    expect(result.id).toBe('abc-123')
  })

  it('maps name to name', () => {
    const result = normaliseProduct(fullRow)
    expect(result.name).toBe('Croissant')
  })

  it('passes description through unchanged', () => {
    const result = normaliseProduct(fullRow)
    expect(result.description).toBe('Buttery and flaky')
  })

  it('passes price through unchanged (integer cents)', () => {
    const result = normaliseProduct(fullRow)
    expect(result.price).toBe(350)
  })

  it('passes image_url through unchanged', () => {
    const result = normaliseProduct(fullRow)
    expect(result.image_url).toBe('https://cdn.example.com/croissant.jpg')
  })

  it('passes tags array through unchanged', () => {
    const result = normaliseProduct(fullRow)
    expect(result.tags).toEqual(['bakery', 'pastry'])
  })

  it('passes is_available through unchanged', () => {
    const result = normaliseProduct(fullRow)
    expect(result.is_available).toBe(true)
  })

  it('does NOT forward total_sold (not part of ProductCard shape)', () => {
    const result = normaliseProduct(fullRow)
    // total_sold is a view-only aggregation — ProductCard never needs it
    expect(result).not.toHaveProperty('total_sold')
  })

  it('output has exactly the expected keys', () => {
    const result = normaliseProduct(fullRow)
    expect(Object.keys(result).sort()).toEqual(
      ['description', 'id', 'image_url', 'is_available', 'name', 'price', 'tags'].sort()
    )
  })
})

// ---------------------------------------------------------------------------
// 2. Missing optional fields default to safe values
// ---------------------------------------------------------------------------

describe('normaliseProduct — missing optional fields', () => {
  const minimalRow = {
    product_id:   'min-001',
    name:         'Plain Bagel',
    price:        200,
    is_available: true,
    // description, image_url, tags intentionally omitted
  }

  it('description defaults to empty string', () => {
    const result = normaliseProduct(minimalRow)
    expect(result.description).toBe('')
  })

  it('image_url defaults to null', () => {
    const result = normaliseProduct(minimalRow)
    expect(result.image_url).toBeNull()
  })

  it('tags defaults to empty array', () => {
    const result = normaliseProduct(minimalRow)
    expect(result.tags).toEqual([])
    expect(Array.isArray(result.tags)).toBe(true)
  })

  it('tags defaults to empty array when field is null (not just undefined)', () => {
    const result = normaliseProduct({ ...minimalRow, tags: null })
    expect(result.tags).toEqual([])
  })

  it('description defaults to empty string when field is null', () => {
    const result = normaliseProduct({ ...minimalRow, description: null })
    expect(result.description).toBe('')
  })
})

// ---------------------------------------------------------------------------
// 3. id and name are ALWAYS mapped from product_id and product_name / name
// ---------------------------------------------------------------------------

describe('normaliseProduct — id and name mapping', () => {
  it('id is always sourced from product_id', () => {
    const result = normaliseProduct({ ...fullRow, product_id: 'override-id' })
    expect(result.id).toBe('override-id')
  })

  it('name is sourced from name field (current view column)', () => {
    const result = normaliseProduct({ ...fullRow, name: 'Updated Name' })
    expect(result.name).toBe('Updated Name')
  })

  it('name falls back to product_name when name is absent (defensive forward-compat)', () => {
    const rowWithProductName = {
      product_id:   'def-456',
      product_name: 'Sourdough',  // hypothetical future alias
      price:        450,
      is_available: true,
    }
    const result = normaliseProduct(rowWithProductName)
    expect(result.name).toBe('Sourdough')
  })

  it('id falls back to row.id when product_id is absent (products table rows)', () => {
    const productTableRow = {
      id:           'ghi-789',
      name:         'Muffin',
      price:        180,
      is_available: true,
    }
    const result = normaliseProduct(productTableRow)
    expect(result.id).toBe('ghi-789')
  })

  it('id is empty string when both product_id and id are missing — never crashes', () => {
    const result = normaliseProduct({ name: 'Ghost', price: 0, is_available: false })
    expect(result.id).toBe('')
  })

  it('name is empty string when both name and product_name are missing — never crashes', () => {
    const result = normaliseProduct({ product_id: 'xyz', price: 0, is_available: false })
    expect(result.name).toBe('')
  })
})

// ---------------------------------------------------------------------------
// 4. Null / undefined input guard
// ---------------------------------------------------------------------------

describe('normaliseProduct — null/undefined input', () => {
  it('returns a safe empty object when passed null', () => {
    const result = normaliseProduct(null)
    expect(result.id).toBe('')
    expect(result.name).toBe('')
    expect(result.tags).toEqual([])
    expect(result.image_url).toBeNull()
  })

  it('returns a safe empty object when passed undefined', () => {
    const result = normaliseProduct(undefined)
    expect(result.is_available).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 5. CartContext alignment — output must satisfy CartContext item shape
// ---------------------------------------------------------------------------

describe('normaliseProduct — CartContext shape alignment', () => {
  it('output contains all fields required by CartContext addItem: id, name, price, image_url', () => {
    const result = normaliseProduct(fullRow)
    // CartContext items shape: [{id, name, price, image_url, quantity}]
    // quantity is added by CartContext itself; we only need to provide the product fields
    expect(result).toMatchObject({
      id:        expect.any(String),
      name:      expect.any(String),
      price:     expect.any(Number),
      // image_url is string | null per shared types
      image_url: expect.anything(),
    })
  })
})

// ---------------------------------------------------------------------------
// filterProducts — fixtures
// ---------------------------------------------------------------------------

/** Canonical product catalogue used across all filterProducts tests. */
const catalogue = [
  {
    id: '1',
    name: 'Almond Croissant',
    description: 'A flaky pastry with almond filling',
    price: 400,
    image_url: null,
    tags: ['bakery', 'pastry', 'nuts'],
    is_available: true,
  },
  {
    id: '2',
    name: 'Blueberry Muffin',
    description: 'Soft muffin loaded with blueberries',
    price: 300,
    image_url: null,
    tags: ['bakery', 'muffin'],
    is_available: true,
  },
  {
    id: '3',
    name: 'Green Tea Latte',
    description: 'Matcha latte with oat milk',
    price: 500,
    image_url: null,
    tags: ['drinks', 'matcha'],
    is_available: true,
  },
  {
    id: '4',
    name: 'Sourdough Loaf',
    description: 'Classic sourdough baked daily',
    price: 800,
    image_url: null,
    tags: ['bakery', 'bread'],
    is_available: false,
  },
  {
    id: '5',
    name: 'Vanilla Latte',
    description: 'Espresso with vanilla syrup and steamed milk',
    price: 480,
    image_url: null,
    tags: ['drinks', 'coffee'],
    is_available: true,
  },
]

// ---------------------------------------------------------------------------
// 6. filterProducts — no filters (pass-through)
// ---------------------------------------------------------------------------

describe('filterProducts — no filters', () => {
  it('returns the original array reference when no filters object is supplied', () => {
    const result = filterProducts(catalogue)
    expect(result).toBe(catalogue) // identity check — no unnecessary copy
  })

  it('returns the original array reference when both query and tag are undefined', () => {
    const result = filterProducts(catalogue, {})
    expect(result).toBe(catalogue)
  })

  it('returns the original array reference when query is null and tag is null', () => {
    const result = filterProducts(catalogue, { query: null, tag: null })
    expect(result).toBe(catalogue)
  })

  it('returns the original array reference when query is empty string and tag is empty string', () => {
    const result = filterProducts(catalogue, { query: '', tag: '' })
    expect(result).toBe(catalogue)
  })

  it('returns the original array reference when query is whitespace-only', () => {
    // Whitespace-only is treated as empty — no filter applied
    const result = filterProducts(catalogue, { query: '   ', tag: '' })
    expect(result).toBe(catalogue)
  })

  it('returns all products when the input array is empty', () => {
    const result = filterProducts([], { query: 'anything' })
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 7. filterProducts — query only
// ---------------------------------------------------------------------------

describe('filterProducts — query only (name match)', () => {
  it('matches products whose name contains the query (case-insensitive)', () => {
    const result = filterProducts(catalogue, { query: 'muffin' })
    expect(result.map((p) => p.id)).toEqual(['2'])
  })

  it('match is case-insensitive — uppercase query works', () => {
    const result = filterProducts(catalogue, { query: 'MUFFIN' })
    expect(result.map((p) => p.id)).toEqual(['2'])
  })

  it('match is case-insensitive — mixed-case query works', () => {
    const result = filterProducts(catalogue, { query: 'MuFfIn' })
    expect(result.map((p) => p.id)).toEqual(['2'])
  })

  it('matches by partial substring in name', () => {
    // "latte" appears in both Green Tea Latte and Vanilla Latte
    const result = filterProducts(catalogue, { query: 'latte' })
    expect(result.map((p) => p.id).sort()).toEqual(['3', '5'])
  })

  it('returns empty array when no name matches', () => {
    const result = filterProducts(catalogue, { query: 'xyz-no-match' })
    expect(result).toEqual([])
  })
})

describe('filterProducts — query only (description match)', () => {
  it('matches products whose description contains the query', () => {
    // "matcha" only in Green Tea Latte description
    const result = filterProducts(catalogue, { query: 'matcha' })
    expect(result.map((p) => p.id)).toEqual(['3'])
  })

  it('description match is case-insensitive', () => {
    const result = filterProducts(catalogue, { query: 'MATCHA' })
    expect(result.map((p) => p.id)).toEqual(['3'])
  })

  it('matches when query appears in description but not in name', () => {
    // "blueberries" is in the description of Blueberry Muffin but not in the name itself
    const result = filterProducts(catalogue, { query: 'blueberries' })
    expect(result.map((p) => p.id)).toEqual(['2'])
  })
})

describe('filterProducts — query only (tags match)', () => {
  it('matches products whose tags array contains an element with the query as a substring', () => {
    // "nut" is a substring of "nuts" tag on Almond Croissant
    const result = filterProducts(catalogue, { query: 'nut' })
    expect(result.map((p) => p.id)).toEqual(['1'])
  })

  it('tag substring match is case-insensitive', () => {
    const result = filterProducts(catalogue, { query: 'NUT' })
    expect(result.map((p) => p.id)).toEqual(['1'])
  })

  it('matches multiple products when query substring hits different tag elements', () => {
    // "matcha" appears as a tag on Green Tea Latte
    const result = filterProducts(catalogue, { query: 'matcha' })
    expect(result.map((p) => p.id)).toEqual(['3'])
  })

  it('matches product where query is the full tag string', () => {
    // "bread" is an exact tag on Sourdough Loaf
    const result = filterProducts(catalogue, { query: 'bread' })
    expect(result.map((p) => p.id)).toEqual(['4'])
  })

  it('returns empty array when no tag substring matches', () => {
    const result = filterProducts(catalogue, { query: 'zzzz' })
    expect(result).toEqual([])
  })
})

describe('filterProducts — query matches across multiple fields', () => {
  it('returns a product matched by name even if description and tags do not match', () => {
    const result = filterProducts(catalogue, { query: 'Vanilla' })
    expect(result.map((p) => p.id)).toEqual(['5'])
  })

  it('a query that matches both name and description still returns the product once', () => {
    // "sourdough" appears in both the name and description of product 4
    const result = filterProducts(catalogue, { query: 'sourdough' })
    expect(result.map((p) => p.id)).toEqual(['4'])
    expect(result).toHaveLength(1)
  })

  it('returns multiple products when query matches different fields on different products', () => {
    // "bakery" is a tag on products 1, 2, 4
    const result = filterProducts(catalogue, { query: 'bakery' })
    expect(result.map((p) => p.id).sort()).toEqual(['1', '2', '4'])
  })
})

// ---------------------------------------------------------------------------
// 8. filterProducts — tag only
// ---------------------------------------------------------------------------

describe('filterProducts — tag only (exact match)', () => {
  it('returns products whose tags array contains an exact match for the tag', () => {
    const result = filterProducts(catalogue, { tag: 'bakery' })
    expect(result.map((p) => p.id).sort()).toEqual(['1', '2', '4'])
  })

  it('returns only products with the exact tag — no substring matching for tag', () => {
    // "bake" is NOT an exact tag — should return nothing
    const result = filterProducts(catalogue, { tag: 'bake' })
    expect(result).toEqual([])
  })

  it('tag match is case-SENSITIVE — wrong case returns empty', () => {
    // tags stored as lowercase; 'Bakery' should NOT match 'bakery'
    const result = filterProducts(catalogue, { tag: 'Bakery' })
    expect(result).toEqual([])
  })

  it('returns correct products for a specific tag', () => {
    const result = filterProducts(catalogue, { tag: 'drinks' })
    expect(result.map((p) => p.id).sort()).toEqual(['3', '5'])
  })

  it('returns a single product when only one has the tag', () => {
    const result = filterProducts(catalogue, { tag: 'coffee' })
    expect(result.map((p) => p.id)).toEqual(['5'])
  })

  it('returns empty array when no product has the exact tag', () => {
    const result = filterProducts(catalogue, { tag: 'vegan' })
    expect(result).toEqual([])
  })

  it('null tag is treated as no filter — returns all products', () => {
    const result = filterProducts(catalogue, { tag: null })
    expect(result).toBe(catalogue)
  })

  it('empty-string tag is treated as no filter — returns all products', () => {
    const result = filterProducts(catalogue, { tag: '' })
    expect(result).toBe(catalogue)
  })
})

// ---------------------------------------------------------------------------
// 9. filterProducts — query AND tag (ANDed)
// ---------------------------------------------------------------------------

describe('filterProducts — query AND tag combined (AND logic)', () => {
  it('returns products matching BOTH query and tag', () => {
    // query "almond" matches Almond Croissant by name; tag "bakery" also matches it
    const result = filterProducts(catalogue, { query: 'almond', tag: 'bakery' })
    expect(result.map((p) => p.id)).toEqual(['1'])
  })

  it('returns empty when query matches but tag does not', () => {
    // Almond Croissant matches query "almond" but does NOT have tag "drinks"
    const result = filterProducts(catalogue, { query: 'almond', tag: 'drinks' })
    expect(result).toEqual([])
  })

  it('returns empty when tag matches but query does not', () => {
    // tag "bakery" matches 3 products, but query "latte" only matches drinks
    const result = filterProducts(catalogue, { query: 'latte', tag: 'bakery' })
    expect(result).toEqual([])
  })

  it('returns intersection when multiple products satisfy both conditions', () => {
    // query "latte" matches products 3 and 5; tag "drinks" matches products 3 and 5 — full overlap
    const result = filterProducts(catalogue, { query: 'latte', tag: 'drinks' })
    expect(result.map((p) => p.id).sort()).toEqual(['3', '5'])
  })

  it('returns only the subset satisfying both when query is broader than tag', () => {
    // query "a" would match many, tag "matcha" limits to product 3 only
    const result = filterProducts(catalogue, { query: 'a', tag: 'matcha' })
    expect(result.map((p) => p.id)).toEqual(['3'])
  })

  it('null query with a valid tag behaves as tag-only filter', () => {
    const tagOnly   = filterProducts(catalogue, { tag: 'bakery' })
    const nullQuery = filterProducts(catalogue, { query: null, tag: 'bakery' })
    expect(nullQuery).toEqual(tagOnly)
  })

  it('null tag with a valid query behaves as query-only filter', () => {
    const queryOnly = filterProducts(catalogue, { query: 'muffin' })
    const nullTag   = filterProducts(catalogue, { query: 'muffin', tag: null })
    expect(nullTag).toEqual(queryOnly)
  })
})

// ---------------------------------------------------------------------------
// 10. filterProducts — edge cases / robustness
// ---------------------------------------------------------------------------

describe('filterProducts — edge cases', () => {
  it('handles products with empty tags array gracefully', () => {
    const products = [
      { id: 'x', name: 'Ghost', description: '', price: 0, image_url: null, tags: [], is_available: true },
    ]
    // tag filter should not crash and should return no match
    const result = filterProducts(products, { tag: 'bakery' })
    expect(result).toEqual([])
  })

  it('handles products with null tags gracefully (defensive)', () => {
    const products = [
      { id: 'x', name: 'Ghost', description: '', price: 0, image_url: null, tags: null, is_available: true },
    ]
    const result = filterProducts(products, { query: 'ghost' })
    // name matches — tags being null should not crash, just not contribute matches
    expect(result.map((p) => p.id)).toEqual(['x'])
  })

  it('handles products with null description gracefully', () => {
    const products = [
      { id: 'x', name: 'Espresso', description: null, price: 0, image_url: null, tags: [], is_available: true },
    ]
    const result = filterProducts(products, { query: 'espresso' })
    expect(result.map((p) => p.id)).toEqual(['x'])
  })

  it('handles null products in the array without crashing', () => {
    // A null slot in the array should be skipped rather than throwing
    const products = [null, catalogue[0]]
    const result = filterProducts(products, { query: 'almond' })
    expect(result.map((p) => p.id)).toEqual(['1'])
  })

  it('does not mutate the original array', () => {
    const original = [...catalogue]
    filterProducts(catalogue, { query: 'latte', tag: 'drinks' })
    expect(catalogue).toEqual(original)
  })

  it('returns a new array instance (not the original) when a filter is active', () => {
    const result = filterProducts(catalogue, { query: 'latte' })
    expect(result).not.toBe(catalogue)
  })

  it('single-character query matches correctly', () => {
    // "e" appears in many product names — just check we don't crash and get results
    const result = filterProducts(catalogue, { query: 'e' })
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('very long query string that matches nothing returns empty array', () => {
    const result = filterProducts(catalogue, { query: 'a'.repeat(200) })
    expect(result).toEqual([])
  })

  it('works with an empty product catalogue', () => {
    const result = filterProducts([], { query: 'almond', tag: 'bakery' })
    expect(result).toEqual([])
  })

  it('is_available is not a filter dimension — returns unavailable products matching query', () => {
    // Sourdough Loaf (id:4) is is_available:false — filter should still return it if it matches
    const result = filterProducts(catalogue, { query: 'sourdough' })
    expect(result.map((p) => p.id)).toEqual(['4'])
  })
})
