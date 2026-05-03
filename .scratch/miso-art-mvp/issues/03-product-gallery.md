# 03 — Product gallery

Status: needs-triage
Type: AFK

## What to build

Build the core gallery page: fetch all products from Supabase, display them in a responsive uniform grid using `ProductCard` components. Unavailable products render greyed out with a disabled Add to Cart button. This is the first end-to-end slice that connects the DB to the UI.

## Acceptance criteria

- [ ] `useProducts` hook fetches all products from Supabase and returns `{ products, loading, error }`
- [ ] `ProductCard` displays image, name, short description, price (formatted as EUR), and tags as small pills
- [ ] `ProductCard` with `is_available = false` renders greyed out with an "Unavailable" label and disabled Add to Cart button
- [ ] Gallery renders a 1-col (mobile) / 2-col (tablet) / 3-col (desktop) responsive grid
- [ ] All product images use fixed aspect ratio (consistent card heights)
- [ ] Loading state shown while products are fetching
- [ ] Error state shown if fetch fails

## Blocked by

- 01 — Supabase schema + project config
- 02 — React scaffold + routing skeleton
