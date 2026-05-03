# 16 — Seed 20 realistic test products

Status: needs-triage
Type: AFK

## What to build

The current seed only has 3 products. Add 20 realistic handmade postcard products with varied tags, prices, and descriptions so the gallery, search, tag filter, and Most Loved section can be properly tested. Include a mix of available and unavailable products.

## Acceptance criteria

- [ ] database/003_seed.sql is updated (or a new 004_seed_extended.sql added) with 20 products total (replacing or extending the original 3)
- [ ] Products cover a realistic range of postcard styles: watercolour, ink, botanical, birthday, travel, seasonal, abstract, animals, cities, etc.
- [ ] Tags are varied across products so tag filter pills are meaningful (at least 8 distinct tags used)
- [ ] Prices range from €4.00 to €18.00 (400–1800 cents)
- [ ] At least 2 products have is_available = false
- [ ] image_url values use placeholder image URLs (e.g. https://picsum.photos/seed/{n}/400/300) so images render without requiring real uploads
- [ ] SQL is idempotent: uses INSERT ... ON CONFLICT DO NOTHING or truncates and re-inserts

## Blocked by

- 01 (schema must exist)
