import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchProducts() {
      setLoading(true)
      setError(null)

      const { data, error: sbError } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, tags, is_available')
        .order('name', { ascending: true })

      if (cancelled) return

      if (sbError) {
        setError(sbError.message)
      } else {
        setProducts(data ?? [])
      }

      setLoading(false)
    }

    fetchProducts()

    // Cleanup to avoid state updates on unmounted component
    return () => { cancelled = true }
  }, [])

  return { products, loading, error }
}
