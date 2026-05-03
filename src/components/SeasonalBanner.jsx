import { useSeasonalBanner } from '../hooks/useSeasonalBanner'

/**
 * SeasonalBanner
 *
 * Displays a full-width promotional banner for the currently active season.
 * Returns null when no banner is active or while loading (non-critical UI).
 *
 * Consumes useSeasonalBanner which returns:
 *   { banner: { id, title, image_url, start_date, end_date, active } | null, loading: boolean }
 */
export default function SeasonalBanner() {
  const { banner, loading } = useSeasonalBanner()

  // Don't show anything while loading — avoid layout shift for non-critical banner
  if (loading) return null

  // No active banner in date range
  if (!banner) return null

  return (
    <section
      className="relative w-full rounded-2xl overflow-hidden mb-8 shadow-md"
      aria-label={`Seasonal promotion: ${banner.title}`}
    >
      {banner.image_url ? (
        <img
          src={banner.image_url}
          alt={banner.title}
          // Maintain a 21:9 cinematic ratio for banner images
          className="w-full object-cover max-h-64 sm:max-h-80"
        />
      ) : (
        // Fallback gradient background when no image provided
        <div className="w-full h-40 sm:h-56 bg-gradient-to-r from-indigo-500 to-purple-600" />
      )}

      {/* Overlay title */}
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
        <h2 className="text-white text-2xl sm:text-3xl font-bold drop-shadow-md">
          {banner.title}
        </h2>
      </div>
    </section>
  )
}
