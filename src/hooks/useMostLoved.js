import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useMostLoved
 *
 * Queries the most_loved_products view, ordered by total_sold desc.
 * Returns top products (all rows in the view, sorted by popularity).
 *
 * Hook is intentionally pure — it does NOT import ToastContext or any
 * UI-layer concern. Callers are responsible for surfacing the error field.
 *
 * @returns {{ products: MostLovedProduct[] | null, loading: boolean, error: string | null }}
 */
export function useMostLoved() {
  // null initial state lets callers distinguish "not yet fetched" from "empty"
  const [products, setProducts] = useState(null)
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
        // NOTE: Do NOT call console.error here — callers surface errors via the
        // returned error field. Keeping the hook pure makes it unit-testable
        // without mocking any UI context.
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
