# 06 — Checkout form + create-payment-intent Edge Function

Status: needs-triage
Type: AFK

## What to build

Build the checkout form and the `create-payment-intent` Supabase Edge Function. The form collects customer and shipping details. On submit, it calls the Edge Function which validates the cart server-side, writes a pending order to Supabase, and returns a Stripe `clientSecret`. After this slice the full order record exists in the DB before any payment is taken.

## Acceptance criteria

- [ ] `CheckoutForm` collects: full name, email, street address, city, postal code, country
- [ ] All fields are required; form does not submit if any are empty
- [ ] On submit, form calls `create-payment-intent` Edge Function with cart items and customer data
- [ ] Edge Function fetches product prices from DB — never trusts client-provided prices
- [ ] Edge Function returns 400 if any `product_id` is not found in the DB
- [ ] Edge Function returns 400 if any item has `is_available = false`
- [ ] Edge Function writes one `orders` row with `status: order_received` and all customer/shipping fields
- [ ] Edge Function writes one `order_items` row per cart item with `price_at_purchase` from DB
- [ ] Edge Function creates a Stripe PaymentIntent in EUR and returns `clientSecret`
- [ ] Edge Function does NOT create a Stripe PaymentIntent if any validation fails
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` configured in the correct environments
- [ ] Tests: all Edge Function validation and DB-write behaviours

## Blocked by

- 01 — Supabase schema + project config
- 05 — Cart + CartDrawer
