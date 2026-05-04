import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CartDrawer from './CartDrawer'
import { CartProvider } from '../context/CartContext'

// Stub useCartProducts so CartDrawer doesn't need Supabase
jest.mock('../hooks/useCartProducts', () => ({
  useCartProducts: jest.fn(),
}))

import { useCartProducts } from '../hooks/useCartProducts'

const ENRICHED_ITEMS = [
  { id: 'p1', name: 'Alpha', price: 1000, image_url: 'alpha.png', quantity: 2 },
  { id: 'p2', name: 'Beta', price: 2500, image_url: 'beta.png', quantity: 1 },
]

function setup(isOpen = true, overrides = {}) {
  useCartProducts.mockReturnValue({
    items: ENRICHED_ITEMS,
    total: 4500, // 2*1000 + 1*2500
    loading: false,
    error: null,
    ...overrides,
  })

  const onClose = jest.fn()
  render(
    <CartProvider>
      <CartDrawer isOpen={isOpen} onClose={onClose} />
    </CartProvider>
  )
  return { onClose }
}

describe('CartDrawer', () => {
  test('renders nothing when isOpen=false', () => {
    setup(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('renders item names and quantities', () => {
    setup()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  test('renders correct line item price (price * qty)', () => {
    setup()
    // Alpha: 2 * $10.00 = $20.00
    expect(screen.getByText('$20.00')).toBeInTheDocument()
    // Beta: 1 * $25.00 = $25.00
    expect(screen.getByText('$25.00')).toBeInTheDocument()
  })

  test('renders correct subtotal', () => {
    setup()
    // total = 4500 cents = $45.00
    expect(screen.getByText('$45.00')).toBeInTheDocument()
  })

  test('calls onClose when close button clicked', async () => {
    const { onClose } = setup()
    await userEvent.click(screen.getByLabelText('Close cart'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('shows loading state', () => {
    setup(true, { items: [], total: 0, loading: true })
    expect(screen.getByText('Loading cart…')).toBeInTheDocument()
  })

  test('shows error state', () => {
    setup(true, { items: [], total: 0, error: 'Network error' })
    expect(screen.getByText(/Network error/)).toBeInTheDocument()
  })

  test('shows empty cart message when no items', () => {
    setup(true, { items: [], total: 0, loading: false, error: null })
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
  })
})
