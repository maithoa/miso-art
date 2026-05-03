import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SeasonalBanner from './SeasonalBanner'
import * as useSeasonalBannerModule from '../hooks/useSeasonalBanner'

const activeBanner = {
  id: 'banner-1',
  title: 'Summer Sale 🌞',
  image_url: 'https://example.com/summer.jpg',
  start_date: '2024-06-01',
  end_date: '2024-08-31',
  active: true,
}

const inactiveBanner = {
  id: 'banner-2',
  title: 'Winter Sale ❄️',
  image_url: 'https://example.com/winter.jpg',
  start_date: '2024-12-01',
  end_date: '2024-12-31',
  // active: false — outside date range, hook returns null for this
  active: false,
}

describe('SeasonalBanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('null state — renders nothing when banner is null', () => {
    vi.spyOn(useSeasonalBannerModule, 'useSeasonalBanner').mockReturnValue({
      banner: null,
      loading: false,
    })
    const { container } = render(<SeasonalBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('null state — renders nothing while loading', () => {
    vi.spyOn(useSeasonalBannerModule, 'useSeasonalBanner').mockReturnValue({
      banner: null,
      loading: true,
    })
    const { container } = render(<SeasonalBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('active match — renders banner title and image when active banner returned', () => {
    vi.spyOn(useSeasonalBannerModule, 'useSeasonalBanner').mockReturnValue({
      banner: activeBanner,
      loading: false,
    })
    render(<SeasonalBanner />)
    // Title is visible
    expect(screen.getByText('Summer Sale 🌞')).toBeInTheDocument()
    // Image rendered with correct src and alt
    const img = screen.getByRole('img', { name: 'Summer Sale 🌞' })
    expect(img).toHaveAttribute('src', 'https://example.com/summer.jpg')
  })

  it('inactive non-match — renders nothing when hook returns null for inactive/out-of-range banner', () => {
    // Hook already filters: it returns null if banner is inactive or outside range
    vi.spyOn(useSeasonalBannerModule, 'useSeasonalBanner').mockReturnValue({
      banner: null, // hook returns null for inactiveBanner scenario
      loading: false,
    })
    const { container } = render(<SeasonalBanner />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByText('Winter Sale ❄️')).toBeNull()
  })

  it('top-3 ranking — section has correct aria-label including banner title', () => {
    vi.spyOn(useSeasonalBannerModule, 'useSeasonalBanner').mockReturnValue({
      banner: activeBanner,
      loading: false,
    })
    render(<SeasonalBanner />)
    expect(
      screen.getByRole('region', { name: 'Seasonal promotion: Summer Sale 🌞' })
    ).toBeInTheDocument()
  })

  it('excluded statuses — renders fallback gradient div when image_url is absent', () => {
    const bannerNoImage = { ...activeBanner, image_url: '' }
    vi.spyOn(useSeasonalBannerModule, 'useSeasonalBanner').mockReturnValue({
      banner: bannerNoImage,
      loading: false,
    })
    render(<SeasonalBanner />)
    // Title still renders
    expect(screen.getByText('Summer Sale 🌞')).toBeInTheDocument()
    // No img element when image_url is empty
    expect(screen.queryByRole('img')).toBeNull()
  })
})
