# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Miso Art** is a single-artist handmade postcard webshop — an MVP built as an agentic development learning exercise. Full spec is in `./scratch/miso-art-mvp/PRD.md`. The project is pre-scaffolded: no `src/` exists yet.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Tailwind CSS (Vite scaffold) |
| Backend/DB | Supabase (Postgres + Auth + Storage + Edge Functions) |
| Payments | Stripe Payment Element |
| Analytics | PostHog JS (initialized, events deferred to Day 2) |
| Hosting | AWS (S3 + CloudFront, or Amplify for auto-deploy) |

## Commands

```bash
npm run dev       # start dev server
npm run build     # production build (outputs to dist/)
npm run lint      # lint
```

## Architecture

### Frontend structure
```
src/
  components/     # ProductCard, CartDrawer, SeasonalBanner, TagFilter, SearchBar
  pages/          # Gallery, Checkout, ThankYou, Login
  admin/          # AdminOrders, AdminOrderDetail, AdminProducts, AdminBanners
  hooks/          # useProducts, useOrders
  lib/            # supabase.js, stripe.js
  context/        # CartContext
```

### Routing
React Router v6. Two route trees:

```
/                     → Gallery (public)
/checkout             → Checkout (public)
/thank-you            → ThankYou (public)
/login                → Login (public)
/admin/orders         → AdminOrders (protected)
/admin/orders/:id     → AdminOrderDetail (protected)
/admin/products       → AdminProducts (protected)
/admin/banners        → AdminBanners (protected)
```

Admin routes are wrapped in `<AdminRoute>` — checks `session + profiles.is_admin` before rendering, redirects to `/login` if either fails. RLS is the data-layer backstop.

### Key architectural decisions

**No stock tracking:** This is an order-queue model. Products have `is_available BOOLEAN DEFAULT true`. The artist toggles availability manually. No stock counts, no oversell logic, no `purchase_product()` function.

**Pending order pattern:** `create-payment-intent` Edge Function writes a `status: 'order_received'` order row + `order_items` to Supabase before calling Stripe. The Stripe webhook `fulfill-order` then flips the status to `payment_confirmed`. The frontend never writes order data directly.

**Server-side price calculation:** `create-payment-intent` receives `{product_id, quantity}[]`, fetches prices from DB, recalculates total server-side. Frontend total is ignored. Also validates `is_available = true` for all items — rejects PaymentIntent creation if any item is unavailable.

**Webhook security:** `fulfill-order` verifies the Stripe signature header using `STRIPE_WEBHOOK_SECRET` before trusting any payload. Non-negotiable.

**Auth:** Email + password only (Supabase Auth). One admin user. Admin access gated by `profiles.is_admin = true` via RLS.

**Cart:** React Context, persisted to `localStorage` on every update and rehydrated on app load.

**Prices:** Stored as cents (INTEGER) throughout. Display divides by 100. Stripe receives cents directly. Currency: EUR.

**ThankYou page:** Polls Supabase for `stripe_payment_id = pi_xxx AND status = 'payment_confirmed'` every 2 seconds. 30-second timeout with a fallback message if webhook is slow.

**Gallery:** Uniform 3-column grid (1 col mobile / 2 tablet / 3 desktop), fixed aspect ratio cards. Search bar + tag filter pills, both filter the in-memory products array client-side — no extra DB calls. Search matches `name + description + tags`. Tags are clicked for exact-match filtering.

**Most Loved:** Top 3 products by `SUM(order_items.quantity)` joined to `orders WHERE status IN ('payment_confirmed', 'order_confirmed', 'sent')`. Section is hidden entirely when no qualifying orders exist.

**Seasonal banner:** Renders null when no row in `seasonal_banners` matches `start_date <= today <= end_date AND active = true`.

### Database tables

```
products
  id, name, description, price (INTEGER cents), image_url
  tags TEXT[]               ← freeform tags e.g. {"birthday","watercolor","blue"}
  is_available BOOLEAN DEFAULT true
  created_at

orders
  id, stripe_payment_id, total (INTEGER cents), status, created_at
  customer_name, customer_email
  shipping_street, shipping_city, shipping_postal_code, shipping_country
  -- status values: order_received | payment_confirmed | order_confirmed | sent | cancelled

order_items
  id, order_id, product_id, quantity, price_at_purchase (INTEGER cents)

seasonal_banners
  id, title, image_url, start_date, end_date, active

profiles
  id (refs auth.users), is_admin
```

### Edge Functions

| Function | Trigger | Responsibility |
|---|---|---|
| `create-payment-intent` | Frontend on checkout submit | Validate cart (is_available), recalculate total, write pending order + order_items, create Stripe PaymentIntent, return clientSecret |
| `fulfill-order` | Stripe webhook `payment_intent.succeeded` | Verify Stripe signature, flip order status to `payment_confirmed` |

### Checkout form

Fields collected above the Stripe PaymentElement (in order):
1. Full name
2. Email
3. Street address
4. City
5. Postal code
6. Country

All passed to `create-payment-intent` on submit.

### Order statuses

```
order_received      ← set by create-payment-intent
payment_confirmed   ← set by fulfill-order webhook
order_confirmed     ← set manually by artist in admin
sent                ← set manually by artist in admin
cancelled           ← UI button exists but disabled ("coming soon") for MVP
```

### Admin panel

Three pages, shared top nav:
- `/admin/orders` — list view (date, customer name, status, total). Click row → detail.
- `/admin/orders/:id` — full detail: customer info, shipping address, items, action buttons to advance status.
- `/admin/products` — add/edit/delete products, toggle `is_available`, manage `tags`.
- `/admin/banners` — set seasonal banner title, image, date range.

### Supabase Storage

Public-read bucket for product images. Direct browser upload from admin using the Supabase JS client. RLS allows INSERT only for `profiles.is_admin = true`.

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_POSTHOG_KEY=
```

Supabase Edge Functions need these set in the Supabase dashboard (not in `.env`):
```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Development Notes

- Stripe test card: `4242 4242 4242 4242`
- Hosted Supabase only — no local CLI/Docker setup
- Build one component at a time — this is a learning-focused repo
- **Hosting:** Use AWS Amplify for Vercel-like auto-deploy (connects to GitHub, handles SPA routing automatically), or S3 + CloudFront for manual setup. Both are free at MVP scale with no commercial use restrictions.
- SPA routing caveat: S3 + CloudFront requires a CloudFront custom error page (404 → `index.html`, 200) so React Router paths don't 404 on direct URL access. Amplify handles this automatically.
- Day 2 scope: PostHog events (`product_viewed`, `add_to_cart`, `checkout_started`, `order_placed`), cancel order + Stripe refund, OAuth providers
