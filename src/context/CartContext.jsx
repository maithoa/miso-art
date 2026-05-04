import React, { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  // Items stored as lean shape: [{ id, quantity }]
  const [items, setItems] = useState([])

  // Accepts full product object but discards everything except id
  const addItem = useCallback((product) => {
    const { id } = product
    setItems((prev) => {
      const existing = prev.find((item) => item.id === id)
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { id, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { id, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    } else {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { id, quantity } : item))
      )
    }
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  // Total count of individual units in cart
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
