import { describe, it, expect } from 'vitest'
import { normaliseProduct } from './products'

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
