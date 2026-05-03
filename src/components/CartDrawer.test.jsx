import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CartProvider } from '../context/CartContext'
import CartDrawer from './CartDrawer'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrap CartDrawer in the real CartProvider so context is live. */
function renderDrawer(initialItems = []) {
  // Seed localStorage so CartProvider hydrates with our fixture data.
  localStorage.setItem('cart', JSON.stringify(initialItems))

  return render(
    <CartProvider>
      <CartDrawer isOpen={true} onClose={vi.fn()} />
    </CartProvider>
  )
}

/** One product fixture (price in integer cents). */
const PRODUCT_A = {
  id: 'prod-1',
  name: 'Test Widget',
  price: 1500, // $15.00
  image_url: 'https://example.com/widget.jpg',
  quantity: 1,
}

const PRODUCT_A_QTY2 = { ...PRODUCT_A, quantity: 2 }

// ---------------------------------------------------------------------------
// Reset between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// Quantity control — disabled state
// ---------------------------------------------------------------------------

describe('CartDrawer — decrement button disabled state', () => {
  it('renders the − button with the HTML disabled attribute when quantity is 1', () => {
    renderDrawer([PRODUCT_A])

    const decrementBtn = screen.getByRole('button', { name: /decrement|decrease|−|-/i })
    expect(decrementBtn).toBeDisabled()
  })

  it('does NOT have the disabled attribute on − when quantity is 2', () => {
    renderDrawer([PRODUCT_A_QTY2])

    const decrementBtn = screen.getByRole('button', { name: /decrement|decrease|−|-/i })
    expect(decrementBtn).not.toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Quantity control — increment
// ---------------------------------------------------------------------------

describe('CartDrawer — increment button', () => {
  it('increases displayed quantity by 1 when + is clicked', async () => {
    const user = userEvent.setup()
    renderDrawer([PRODUCT_A]) // starts at qty 1

    const incrementBtn = screen.getByRole('button', { name: /increment|increase|\+/i })
    await user.click(incrementBtn)

    // After clicking + once the displayed quantity should be 2.
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('increments quantity multiple times correctly', async () => {
    const user = userEvent.setup()
    renderDrawer([PRODUCT_A]) // starts at qty 1

    const incrementBtn = screen.getByRole('button', { name: /increment|increase|\+/i })
    await user.click(incrementBtn)
    await user.click(incrementBtn)

    expect(screen.getByText('3')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Quantity control — decrement
// ---------------------------------------------------------------------------

describe('CartDrawer — decrement button', () => {
  it('decreases displayed quantity by 1 when − is clicked at qty 2', async () => {
    const user = userEvent.setup()
    renderDrawer([PRODUCT_A_QTY2]) // starts at qty 2

    const decrementBtn = screen.getByRole('button', { name: /decrement|decrease|−|-/i })
    await user.click(decrementBtn)

    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('disables − after decrementing from qty 2 to qty 1', async () => {
    const user = userEvent.setup()
    renderDrawer([PRODUCT_A_QTY2])

    const decrementBtn = screen.getByRole('button', { name: /decrement|decrease|−|-/i })
    await user.click(decrementBtn)

    expect(decrementBtn).toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Line total — reactive display
// ---------------------------------------------------------------------------

describe('CartDrawer — line total', () => {
  it('displays the correct line total for initial quantity', () => {
    renderDrawer([PRODUCT_A]) // price=1500 cents, qty=1 → $15.00

    // Accept either "$15.00" or "15.00" formatted string.
    expect(screen.getByText(/\$?15\.00/)).toBeInTheDocument()
  })

  it('updates line total reactively when + is clicked', async () => {
    const user = userEvent.setup()
    renderDrawer([PRODUCT_A]) // price=1500 cents, qty=1

    const incrementBtn = screen.getByRole('button', { name: /increment|increase|\+/i })
    await user.click(incrementBtn) // qty → 2, line total → $30.00

    expect(screen.getByText(/\$?30\.00/)).toBeInTheDocument()
  })

  it('updates line total reactively when − is clicked', async () => {
    const user = userEvent.setup()
    renderDrawer([PRODUCT_A_QTY2]) // price=1500 cents, qty=2 → $30.00

    const decrementBtn = screen.getByRole('button', { name: /decrement|decrease|−|-/i })
    await user.click(decrementBtn) // qty → 1, line total → $15.00

    expect(screen.getByText(/\$?15\.00/)).toBeInTheDocument()
  })

  it('line total equals price × quantity (integer cents rendered as dollars)', () => {
    // qty=3, price=1500 → line total = 4500 cents = $45.00
    renderDrawer([{ ...PRODUCT_A, quantity: 3 }])

    expect(screen.getByText(/\$?45\.00/)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Cart total — reactive display
// ---------------------------------------------------------------------------

describe('CartDrawer — cart total', () => {
  it('displays the correct cart total for a single item', () => {
    renderDrawer([PRODUCT_A]) // total = 1500 cents = $15.00

    // There may be multiple "$15.00" nodes (line total + cart total).
    const matches = screen.getAllByText(/\$?15\.00/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('updates cart total when quantity changes', async () => {
    const user = userEvent.setup()
    renderDrawer([PRODUCT_A]) // total $15.00

    const incrementBtn = screen.getByRole('button', { name: /increment|increase|\+/i })
    await user.click(incrementBtn) // total → $30.00

    expect(screen.getByText(/\$?30\.00/)).toBeInTheDocument()
  })
})
