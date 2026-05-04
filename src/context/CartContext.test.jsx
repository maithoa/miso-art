import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartProvider, useCart } from './CartContext'
import { useCartProducts } from '../hooks/useCartProducts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Stub useProducts so tests don't hit Supabase
jest.mock('../hooks/useProducts', () => ({
  useProducts: jest.fn(),
}))

import { useProducts } from '../hooks/useProducts'

const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Alpha', price: 1000, image_url: 'alpha.png', is_available: true },
  { id: 'p2', name: 'Beta', price: 2500, image_url: 'beta.png', is_available: true },
]

function setupUseProducts(overrides = {}) {
  useProducts.mockReturnValue({
    products: MOCK_PRODUCTS,
    loading: false,
    error: null,
    ...overrides,
  })
}

// A component that exposes cart state via data attributes for easy querying
function CartInspector() {
  const { items, addItem, removeItem, updateQuantity, clearCart, itemCount } = useCart()
  return (
    <div>
      <span data-testid="item-count">{itemCount}</span>
      <span data-testid="items">{JSON.stringify(items)}</span>
      <button onClick={() => addItem({ id: 'p1', name: 'Alpha', price: 1000, image_url: 'alpha.png' })}>
        add-p1
      </button>
      <button onClick={() => addItem({ id: 'p2', name: 'Beta', price: 2500, image_url: 'beta.png' })}>
        add-p2
      </button>
      <button onClick={() => removeItem('p1')}>remove-p1</button>
      <button onClick={() => updateQuantity('p1', 3)}>set-p1-qty-3</button>
      <button onClick={() => updateQuantity('p1', 0)}>set-p1-qty-0</button>
      <button onClick={clearCart}>clear</button>
    </div>
  )
}

function CartProductsInspector() {
  const { items, total, loading, error } = useCartProducts()
  return (
    <div>
      <span data-testid="cp-items">{JSON.stringify(items)}</span>
      <span data-testid="cp-total">{total}</span>
      <span data-testid="cp-loading">{String(loading)}</span>
      <span data-testid="cp-error">{String(error)}</span>
    </div>
  )
}

function Wrapper({ children }) {
  return <CartProvider>{children}</CartProvider>
}

// ---------------------------------------------------------------------------
// useCart — stored shape tests
// ---------------------------------------------------------------------------

describe('CartContext stored shape', () => {
  test('items start empty', () => {
    render(<CartInspector />, { wrapper: Wrapper })
    expect(JSON.parse(screen.getByTestId('items').textContent)).toEqual([])
  })

  test('addItem stores only { id, quantity }', async () => {
    render(<CartInspector />, { wrapper: Wrapper })
    await userEvent.click(screen.getByText('add-p1'))
    const stored = JSON.parse(screen.getByTestId('items').textContent)
    expect(stored).toEqual([{ id: 'p1', quantity: 1 }])
    // Must NOT contain name, price, image_url
    expect(stored[0]).not.toHaveProperty('name')
    expect(stored[0]).not.toHaveProperty('price')
    expect(stored[0]).not.toHaveProperty('image_url')
  })

  test('addItem increments quantity for duplicate id', async () => {
    render(<CartInspector />, { wrapper: Wrapper })
    await userEvent.click(screen.getByText('add-p1'))
    await userEvent.click(screen.getByText('add-p1'))
    const stored = JSON.parse(screen.getByTestId('items').textContent)
    expect(stored).toEqual([{ id: 'p1', quantity: 2 }])
  })

  test('removeItem removes the item', async () => {
    render(<CartInspector />, { wrapper: Wrapper })
    await userEvent.click(screen.getByText('add-p1'))
    await userEvent.click(screen.getByText('remove-p1'))
    expect(JSON.parse(screen.getByTestId('items').textContent)).toEqual([])
  })

  test('updateQuantity sets quantity', async () => {
    render(<CartInspector />, { wrapper: Wrapper })
    await userEvent.click(screen.getByText('add-p1'))
    await userEvent.click(screen.getByText('set-p1-qty-3'))
    const stored = JSON.parse(screen.getByTestId('items').textContent)
    expect(stored).toEqual([{ id: 'p1', quantity: 3 }])
  })

  test('updateQuantity with 0 removes item', async () => {
    render(<CartInspector />, { wrapper: Wrapper })
    await userEvent.click(screen.getByText('add-p1'))
    await userEvent.click(screen.getByText('set-p1-qty-0'))
    expect(JSON.parse(screen.getByTestId('items').textContent)).toEqual([])
  })

  test('clearCart empties items', async () => {
    render(<CartInspector />, { wrapper: Wrapper })
    await userEvent.click(screen.getByText('add-p1'))
    await userEvent.click(screen.getByText('add-p2'))
    await userEvent.click(screen.getByText('clear'))
    expect(JSON.parse(screen.getByTestId('items').textContent)).toEqual([])
  })

  test('itemCount reflects total units', async () => {
    render(<CartInspector />, { wrapper: Wrapper })
    await userEvent.click(screen.getByText('add-p1'))
    await userEvent.click(screen.getByText('add-p1'))
    await userEvent.click(screen.getByText('add-p2'))
    expect(screen.getByTestId('item-count').textContent).toBe('3')
  })
})

// ---------------------------------------------------------------------------
// useCartProducts — join logic tests
// ---------------------------------------------------------------------------

describe('useCartProducts', () => {
  beforeEach(() => {
    setupUseProducts()
  })

  test('happy path: enriches items with product data', async () => {
    render(
      <Wrapper>
        <CartInspector />
        <CartProductsInspector />
      </Wrapper>
    )
    await userEvent.click(screen.getByText('add-p1'))
    await userEvent.click(screen.getByText('add-p2'))

    const enriched = JSON.parse(screen.getByTestId('cp-items').textContent)
    expect(enriched).toHaveLength(2)
    expect(enriched[0]).toEqual({ id: 'p1', name: 'Alpha', price: 1000, image_url: 'alpha.png', quantity: 1 })
    expect(enriched[1]).toEqual({ id: 'p2', name: 'Beta', price: 2500, image_url: 'beta.png', quantity: 1 })
  })

  test('total is sum of price * quantity in cents', async () => {
    render(
      <Wrapper>
        <CartInspector />
        <CartProductsInspector />
      </Wrapper>
    )
    await userEvent.click(screen.getByText('add-p1')) // 1000
    await userEvent.click(screen.getByText('add-p1')) // 2000
    await userEvent.click(screen.getByText('add-p2')) // 4500

    // p1 qty=2 => 2000, p2 qty=1 => 2500, total=4500
    expect(screen.getByTestId('cp-total').textContent).toBe('4500')
  })

  test('missing product is gracefully omitted from enriched items', async () => {
    // Cart has an item whose id does not exist in products
    const { addItem } = (() => {
      let capturedAddItem
      function Capture() {
        const ctx = useCart()
        capturedAddItem = ctx.addItem
        return null
      }
      render(
        <Wrapper>
          <Capture />
          <CartProductsInspector />
        </Wrapper>
      )
      return { addItem: capturedAddItem }
    })()

    act(() => {
      addItem({ id: 'ghost-id' })
    })

    const enriched = JSON.parse(screen.getByTestId('cp-items').textContent)
    expect(enriched).toEqual([])
    expect(screen.getByTestId('cp-total').textContent).toBe('0')
  })

  test('returns loading=true while products are loading', () => {
    setupUseProducts({ products: [], loading: true, error: null })
    render(
      <Wrapper>
        <CartProductsInspector />
      </Wrapper>
    )
    expect(screen.getByTestId('cp-loading').textContent).toBe('true')
  })

  test('returns error string when useProducts errors', () => {
    setupUseProducts({ products: [], loading: false, error: 'DB offline' })
    render(
      <Wrapper>
        <CartProductsInspector />
      </Wrapper>
    )
    expect(screen.getByTestId('cp-error').textContent).toBe('DB offline')
  })
})
