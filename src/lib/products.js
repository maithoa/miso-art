/**
 * normaliseProduct
 *
 * Maps a row from the most_loved_products view to the shape expected by ProductCard.
 *
 * View row shape (authoritative source: 004_most_loved_view.sql):
 *   { product_id, name, description, price, image_url, tags, is_available, total_sold }
 *
 * NOTE: The view uses `name` not `product_name` — the SQL selects p.name directly.
 * We still accept both `product_name` and `name` defensively in case the view
 * shape changes or a caller passes a differently-shaped object.
 *
 * Output shape (aligns with CartContext item shape and ProductCard props):
 *   { id, name, description, price, image_url, tags, is_available }
 *
 * @param {Object} row - A row from the most_loved_products view or products table.
 * @param {string}       row.product_id    - Mapped to `id`.
 * @param {string}       [row.product_name] - Mapped to `name` (fallback when view alias differs).
 * @param {string}       [row.name]        - Mapped to `name` (preferred; matches current view).
 * @param {string}       [row.description] - Passed through; defaults to ''.
 * @param {number}       row.price         - Integer cents; passed through.
 * @param {string|null}  [row.image_url]   - Passed through; defaults to null.
 * @param {string[]}     [row.tags]        - Passed through; defaults to [].
 * @param {boolean}      row.is_available  - Passed through.
 * @returns {{ id: string, name: string, description: string, price: number, image_url: string|null, tags: string[], is_available: boolean }}
 */
export function normaliseProduct(row) {
  if (!row) {
    // Fail loud-but-safe so callers get an identifiable bad object rather than a crash
    return {
      id: '',
      name: '',
      description: '',
      price: 0,
      image_url: null,
      tags: [],
      is_available: false,
    }
  }

  return {
    // product_id is the PK alias exposed by the view; fall back to id for direct products table rows
    id: row.product_id ?? row.id ?? '',

    // View selects `p.name` as `name`; accept `product_name` defensively for forward-compat
    name: row.name ?? row.product_name ?? '',

    // Optional fields — default to safe empty values so callers never have to guard
    description: row.description ?? '',
    image_url:   row.image_url   ?? null,
    tags:        Array.isArray(row.tags) ? row.tags : [],

    // Required fields — passed through as-is
    price:        row.price,
    is_available: row.is_available,
  }
}
