import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useMostLoved
 *
 * Queries the most_loved_products view, ordered by total_sold desc.
 * Returns top products (all rows in the view, sorted by popularity).
 *
 * @returns {{ products: MostLovedProduct[], loading: boolean, error: string|null }}
 */
export function useMostLoved() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false // guard against state updates after unmount

    async function fetchMostLoved() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('most_loved_products')
        .select('*')
        // Most sold products first
        .order('total_sold', { ascending: false })

      if (cancelled) return

      if (fetchError) {
        console.error('[useMostLoved] fetch error:', fetchError.message)
        setError(fetchError.message)
        setProducts([])
      } else {
        setProducts(data ?? [])
      }

      setLoading(false)
    }

    fetchMostLoved()

    return () => {
      cancelled = true
    }
  }, [])

  return { products, loading, error }
}
