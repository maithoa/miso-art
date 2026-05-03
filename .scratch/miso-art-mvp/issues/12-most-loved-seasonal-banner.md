# 12 — Most Loved + Seasonal Banner

Status: needs-triage
Type: AFK

## What to build

Add the two supplementary gallery sections: `MostLoved` shows the top 3 products by paid order count and hides itself when no data exists; `SeasonalBanner` shows an active banner for today's date and renders nothing when none is active.

## Acceptance criteria

- [ ] `MostLoved` queries `order_items JOIN orders WHERE status IN ('payment_confirmed', 'order_confirmed', 'sent')`, groups by product, sums quantities, takes top 3
- [ ] `MostLoved` renders the 3 products using the same `ProductCard` component as the gallery
- [ ] `MostLoved` renders null (no section, no empty state) when no qualifying orders exist
- [ ] `MostLoved` does not count `cancelled` or `order_received` orders
- [ ] `SeasonalBanner` queries `seasonal_banners WHERE start_date <= today <= end_date AND active = true`
- [ ] `SeasonalBanner` renders a full-width banner with title and image when a matching row exists
- [ ] `SeasonalBanner` renders null when no row matches (no placeholder, no empty space)
- [ ] Both components appear above the gallery grid on the home page
- [ ] Tests: MostLoved null state, top-3 ranking, excluded statuses; SeasonalBanner null state, active match, inactive non-match

## Blocked by

- 07 — Stripe payment + webhook + ThankYou
- 11 — Admin seasonal banners
