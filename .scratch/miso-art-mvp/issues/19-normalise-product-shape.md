# 19 — Extract normaliseProduct to products lib

Status: needs-triage
Type: AFK

## What to build

`MostLoved.jsx` manually remaps DB view fields (`product_id → id`, `product_name → name`) before passing data to `ProductCard`. This transform is invisible at `ProductCard`'s interface — if the view changes, components break silently. Extract a `normaliseProduct(row)` function to `src/lib/products.js` so every caller uses the same shape contract.

## Acceptance criteria

- [ ] `src/lib/products.js` exists and exports `normaliseProduct(row)` that maps the `most_loved_products` view row shape to the `ProductCard` expected shape (`{ id, name, description, price, image_url, tags, is_available }`)
- [ ] `MostLoved.jsx` uses `normaliseProduct` instead of inline field mapping
- [ ] `ProductCard.jsx` has a JSDoc comment documenting the expected product shape
- [ ] Unit tests for `normaliseProduct` cover: full row mapping, missing optional fields default gracefully
- [ ] No existing tests broken

## Blocked by

None — can start immediately.
