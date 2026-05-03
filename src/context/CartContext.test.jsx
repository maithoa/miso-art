import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { CartProvider, useCart } from './CartContext'

const mockProduct = { id: 'p1', name: 'Sunrise Card', price: 1200, image_url: '/img/sunrise.jpg' }

let store = {}
const localStorageMock = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = String(value) },
  removeItem: (key) => { delete store[key] },
  clear: () => { store = {} },
}

beforeEach(() => {
  store = {}
  vi.stubGlobal('localStorage', localStorageMock)
})

afterEach(() => vi.unstubAllGlobals())

function TestConsumer({ fn }) {
  const cart = useCart()
  fn(cart)
  return null
}

function renderCart(fn) {
  render(<CartProvider><TestConsumer fn={fn} /></CartProvider>)
}

describe('CartContext', () => {
  describe('total', () => {
    it('is the sum of price × quantity across all items in cents', () => {
      let cart
      renderCart(c => { cart = c })

      act(() => cart.addItem(mockProduct, 2))
      act(() => cart.addItem({ id: 'p2', name: 'Moon Card', price: 800, image_url: '/img/moon.jpg' }))

      // 1200 × 2 + 800 × 1 = 3200
      expect(cart.total).toBe(3200)
    })
  })

  describe('removeItem', () => {
    it('eliminates the item from the cart', () => {
      let cart
      renderCart(c => { cart = c })

      act(() => cart.addItem(mockProduct))
      act(() => cart.removeItem('p1'))

      expect(cart.items).toHaveLength(0)
    })
  })

  describe('updateQuantity', () => {
    it('changes the quantity of an existing item', () => {
      let cart
      renderCart(c => { cart = c })

      act(() => cart.addItem(mockProduct))
      act(() => cart.updateQuantity('p1', 5))

      expect(cart.items[0].quantity).toBe(5)
    })

    it('removes the item when quantity is set to zero', () => {
      let cart
      renderCart(c => { cart = c })

      act(() => cart.addItem(mockProduct))
      act(() => cart.updateQuantity('p1', 0))

      expect(cart.items).toHaveLength(0)
    })
  })

  describe('clearCart', () => {
    it('empties all items', () => {
      let cart
      renderCart(c => { cart = c })

      act(() => cart.addItem(mockProduct))
      act(() => cart.addItem({ id: 'p2', name: 'Moon Card', price: 800, image_url: '/img/moon.jpg' }))
      act(() => cart.clearCart())

      expect(cart.items).toHaveLength(0)
      expect(cart.total).toBe(0)
    })
  })

  describe('localStorage', () => {
    it('writes cart to localStorage after a mutation', () => {
      let cart
      renderCart(c => { cart = c })

      act(() => cart.addItem(mockProduct))

      const stored = JSON.parse(localStorage.getItem('cart'))
      expect(stored).toHaveLength(1)
      expect(stored[0]).toMatchObject({ id: 'p1', quantity: 1 })
    })

    it('rehydrates cart from localStorage on mount', () => {
      localStorage.setItem('cart', JSON.stringify([{ ...mockProduct, quantity: 3 }]))

      let cart
      renderCart(c => { cart = c })

      expect(cart.items).toHaveLength(1)
      expect(cart.items[0]).toMatchObject({ id: 'p1', quantity: 3 })
    })

    it('starts with an empty cart when localStorage contains corrupt data', () => {
      localStorage.setItem('cart', 'not-valid-json{{')

      let cart
      renderCart(c => { cart = c })

      expect(cart.items).toHaveLength(0)
    })
  })

  describe('addItem', () => {
    it('creates a cart entry with correct product data and quantity', () => {
      let cart
      renderCart(c => { cart = c })

      act(() => cart.addItem(mockProduct))

      expect(cart.items).toHaveLength(1)
      expect(cart.items[0]).toMatchObject({ id: 'p1', name: 'Sunrise Card', price: 1200, quantity: 1 })
    })

    it('increments quantity when the same product is added twice', () => {
      let cart
      renderCart(c => { cart = c })

      act(() => cart.addItem(mockProduct))
      act(() => cart.addItem(mockProduct))

      expect(cart.items).toHaveLength(1)
      expect(cart.items[0].quantity).toBe(2)
    })
  })
})
