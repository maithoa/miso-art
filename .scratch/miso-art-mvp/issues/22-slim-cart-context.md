# 22 — Slim CartContext to { id, quantity }

Status: needs-triage
Type: AFK

## What to build

CartContext stores full product objects, so the cart goes stale when the artist updates a product's price or availability. The `create-payment-intent` Edge Function recalculates server-side, but the shopper sees the old price in the cart drawer until they reload. Fix by storing only `{ id, quantity }` in CartContext and joining live product data at display time.

## Acceptance criteria

- [ ] `CartContext` items shape changes to `[{ id, quantity }]` — no `name`, `price`, or `image_url` stored
- [ ] `useCartProducts()` hook exported from `CartContext.jsx` (or a new file) — joins cart `{ id, quantity }` items against the live products array fetched from Supabase, returns enriched items `[{ id, name, price, image_url, quantity }]` plus a derived `total` in cents
- [ ] `CartDrawer` uses `useCartProducts()` for display — always shows the current DB price
- [ ] `OrderSummary` in `Checkout.jsx` uses `useCartProducts()` for display
- [ ] `addItem(product)` signature is preserved — CartContext extracts only `id` from the passed product before storing
- [ ] `CartContext` tests updated to reflect new items shape; coverage of `useCartProducts` join logic added
- [ ] `CartDrawer` tests updated accordingly
- [ ] No existing tests broken

## Blocked by

None — can start immediately.
