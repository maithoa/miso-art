import { useMemo } from 'react'
import { useCart } from '../context/CartContext'
import { useProducts } from './useProducts'

/**
 * Joins lean cart items [{ id, quantity }] against live products
 * to produce enriched display items and a total in cents.
 */
export function useCartProducts() {
  const { items } = useCart()
  const { products, loading, error } = useProducts()

  const { items: enrichedItems, total } = useMemo(() => {
    // Build a quick lookup map to avoid O(n*m) scan
    const productMap = new Map(products.map((p) => [p.id, p]))

    const enriched = []
    let runningTotal = 0

    for (const cartItem of items) {
      const product = productMap.get(cartItem.id)
      // Gracefully omit cart items whose product is no longer found
      if (!product) continue

      const enrichedItem = {
        id: product.id,
        name: product.name,
        price: product.price, // integer cents
        image_url: product.image_url,
        quantity: cartItem.quantity,
      }

      enriched.push(enrichedItem)
      runningTotal += product.price * cartItem.quantity
    }

    return { items: enriched, total: runningTotal }
  }, [items, products])

  return { items: enrichedItems, total, loading, error }
}
