import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useSeasonalBanner
 *
 * Queries seasonal_banners for a single active banner whose date window
 * contains today. Returns the first match (ordered by start_date desc so
 * the most-recently-started banner wins when ranges overlap).
 *
 * @returns {{ banner: SeasonalBanner|null, loading: boolean }}
 *
 * SeasonalBanner shape:
 *   { id, title, image_url, start_date, end_date, active }
 */
export function useSeasonalBanner() {
  const [banner, setBanner] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false // guard against state updates after unmount

    async function fetchBanner() {
      setLoading(true)

      // today as an ISO date string 'YYYY-MM-DD' — Postgres date columns
      // compare correctly against this format without time-zone ambiguity
      const today = new Date().toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('seasonal_banners')
        .select('id, title, image_url, start_date, end_date, active')
        .eq('active', true)
        // start_date <= today
        .lte('start_date', today)
        // end_date >= today
        .gte('end_date', today)
        // most-recently-started banner wins when multiple ranges overlap
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle() // returns null (not an error) when no rows match

      if (cancelled) return

      if (error) {
        // Log for visibility but don't crash the page — banner is non-critical UI
        console.error('[useSeasonalBanner] fetch error:', error.message)
        setBanner(null)
      } else {
        setBanner(data) // data is the banner object or null
      }

      setLoading(false)
    }

    fetchBanner()

    return () => {
      cancelled = true
    }
  }, []) // run once on mount; banners don't change mid-session

  return { banner, loading }
}
