# 01 — Supabase schema + project config

Status: needs-triage
Type: HITL

## What to build

Set up the Supabase project and run all SQL to create the full schema. This unblocks every other slice.

Create all tables with the correct column types and constraints, configure RLS policies for each table, create the Supabase Storage bucket for product images, and wire up the `.env` file with project credentials.

## Acceptance criteria

- [ ] Supabase project created and accessible
- [ ] `products` table: `id`, `name`, `description`, `price INTEGER`, `image_url`, `tags TEXT[]`, `is_available BOOLEAN DEFAULT true`, `created_at`
- [ ] `orders` table: `id`, `stripe_payment_id`, `total INTEGER`, `status`, `customer_name`, `customer_email`, `shipping_street`, `shipping_city`, `shipping_postal_code`, `shipping_country`, `created_at`
- [ ] `order_items` table: `id`, `order_id`, `product_id`, `quantity`, `price_at_purchase INTEGER`
- [ ] `seasonal_banners` table: `id`, `title`, `image_url`, `start_date`, `end_date`, `active`
- [ ] `profiles` table: `id` (refs `auth.users`), `is_admin BOOLEAN`
- [ ] RLS: `products` — public SELECT, admin-only INSERT/UPDATE/DELETE
- [ ] RLS: `orders` — public SELECT, no direct client INSERT/UPDATE (Edge Functions use service role)
- [ ] RLS: `seasonal_banners` — public SELECT, admin-only INSERT/UPDATE/DELETE
- [ ] RLS: `profiles` — users SELECT own row only
- [ ] Supabase Storage bucket created with public read, admin-only write
- [ ] `.env` file populated with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] At least 3 seed products inserted for development

## Blocked by

None — can start immediately.
