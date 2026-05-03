import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MostLoved from './MostLoved'
import * as useMostLovedModule from '../hooks/useMostLoved'

// Mock ProductCard to isolate MostLoved rendering
vi.mock('./ProductCard', () => ({
  default: ({ product }) => (
    <div data-testid="product-card" data-product-id={product.id}>
      {product.name}
    </div>
  ),
}))

// Mock CartContext used inside ProductCard (even if mocked, good practice)
vi.mock('../context/CartContext', () => ({
  useCart: () => ({ addItem: vi.fn() }),
}))

const mockProducts = [
  {
    product_id: '1',
    name: 'Top Product',
    price: 1000,
    image_url: 'https://example.com/top.jpg',
    is_available: true,
    tags: ['popular'],
    total_sold: 300,
  },
  {
    product_id: '2',
    name: 'Second Product',
    price: 800,
    image_url: 'https://example.com/second.jpg',
    is_available: true,
    tags: [],
    total_sold: 200,
  },
  {
    product_id: '3',
    name: 'Third Product',
    price: 600,
    image_url: '',
    is_available: false,
    tags: [],
    total_sold: 100,
  },
  {
    product_id: '4',
    name: 'Fourth Product',
    price: 400,
    image_url: '',
    is_available: true,
    tags: [],
    total_sold: 50,
  },
]

describe('MostLoved', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('null state — returns null when products array is empty', () => {
    vi.spyOn(useMostLovedModule, 'useMostLoved').mockReturnValue({
      products: [],
      loading: false,
      error: null,
    })
    const { container } = render(<MostLoved />)
    expect(container.firstChild).toBeNull()
  })

  it('null state — returns null when products is null', () => {
    vi.spyOn(useMostLovedModule, 'useMostLoved').mockReturnValue({
      products: null,
      loading: false,
      error: null,
    })
    const { container } = render(<MostLoved />)
    expect(container.firstChild).toBeNull()
  })

  it('active match — renders available products with ProductCard', () => {
    vi.spyOn(useMostLovedModule, 'useMostLoved').mockReturnValue({
      products: mockProducts.filter(p => p.is_available),
      loading: false,
      error: null,
    })
    render(<MostLoved />)
    // Available products are rendered
    expect(screen.getAllByTestId('product-card')).toHaveLength(
      mockProducts.filter(p => p.is_available).length
    )
    expect(screen.getByText('Top Product')).toBeInTheDocument()
  })

  it('inactive non-match — still renders unavailable product (ProductCard handles styling)', () => {
    const unavailableProduct = [mockProducts[2]] // is_available: false
    vi.spyOn(useMostLovedModule, 'useMostLoved').mockReturnValue({
      products: unavailableProduct,
      loading: false,
      error: null,
    })
    render(<MostLoved />)
    // MostLoved does NOT filter out unavailable — ProductCard handles it visually
    expect(screen.getByTestId('product-card')).toBeInTheDocument()
    expect(screen.getByText('Third Product')).toBeInTheDocument()
  })

  it('top-3 ranking — shows medal labels for first three products', () => {
    vi.spyOn(useMostLovedModule, 'useMostLoved').mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
    })
    render(<MostLoved />)
    // Gold, silver, bronze medals present
    expect(screen.getByLabelText('Rank 1')).toHaveTextContent('🥇')
    expect(screen.getByLabelText('Rank 2')).toHaveTextContent('🥈')
    expect(screen.getByLabelText('Rank 3')).toHaveTextContent('🥉')
    // Fourth product has no medal
    expect(screen.queryByLabelText('Rank 4')).toBeNull()
  })

  it('excluded statuses — shows error message when fetch fails', () => {
    vi.spyOn(useMostLovedModule, 'useMostLoved').mockReturnValue({
      products: [],
      loading: false,
      error: 'Network error',
    })
    render(<MostLoved />)
    expect(screen.getByText('Could not load most loved products')).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('shows skeleton while loading', () => {
    vi.spyOn(useMostLovedModule, 'useMostLoved').mockReturnValue({
      products: [],
      loading: true,
      error: null,
    })
    render(<MostLoved />)
    // Section heading still present during loading
    expect(screen.getByText('💛 Most Loved')).toBeInTheDocument()
    // No product cards during loading
    expect(screen.queryByTestId('product-card')).toBeNull()
  })
})
