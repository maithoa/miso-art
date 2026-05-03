# PRD — Miso Art MVP

Status: needs-triage

## Problem Statement

A solo artist selling handmade postcards has no dedicated online storefront. Selling through general marketplaces (Etsy, Instagram DMs) means no control over the brand experience, no direct customer relationship, and high platform fees. The artist needs a beautiful, owned webshop where shoppers can discover and buy postcards, and the artist can manage their catalog and fulfil orders — all without technical overhead.

## Solution

A single-artist handmade postcard webshop built on React + Supabase + Stripe. Shoppers browse a searchable, tag-filtered gallery, add cards to a persistent cart, and check out via Stripe. The artist logs in to an admin panel to manage products and work through an order queue — moving orders from received → confirmed → sent. No stock tracking: the artist toggles individual products as temporarily unavailable when needed.

## User Stories

### Shopper — Gallery

1. As a shopper, I want to see all available postcards in a clean grid, so that I can browse the full catalog at a glance.
2. As a shopper, I want product cards to show the image, name, short description, price, and tags, so that I can evaluate a card without clicking anywhere.
3. As a shopper, I want the gallery to show 3 columns on desktop, 2 on tablet, and 1 on mobile, so that the layout works on any device.
4. As a shopper, I want to filter products by clicking a tag pill (e.g. "birthday", "watercolor"), so that I can quickly find cards for a specific occasion or style.
5. As a shopper, I want to search by typing into a search bar, so that I can find a card by name, description, or tag without browsing the full catalog.
6. As a shopper, I want search and tag filters to work together simultaneously, so that I can narrow by both style and keyword at once.
7. As a shopper, I want filtering to happen instantly without a page reload, so that browsing feels fast and fluid.
8. As a shopper, I want unavailable products to appear greyed out with an "unavailable" label, so that I know not to try adding them to my cart.
9. As a shopper, I want to see a "Most Loved" section showing the top 3 best-selling cards, so that I can discover what other people are buying.
10. As a shopper, I want the Most Loved section to be hidden when no sales data exists, so that the page doesn't show an empty or misleading section on a fresh shop.
11. As a shopper, I want to see a seasonal banner when one is active, so that I'm aware of current promotions or seasonal themes.
12. As a shopper, I want the page to show no banner at all when none is active, so that there's no empty placeholder.

### Shopper — Cart

13. As a shopper, I want to add a postcard to my cart directly from the gallery, so that I don't need to navigate away to shop.
14. As a shopper, I want to open a cart drawer to review my items without leaving the gallery, so that I can keep browsing after adding a card.
15. As a shopper, I want to increase or decrease the quantity of each cart item, so that I can order multiple copies of a card.
16. As a shopper, I want to remove an item from my cart entirely, so that I can change my mind without starting over.
17. As a shopper, I want to see a running subtotal in the cart, so that I know how much I'm about to spend.
18. As a shopper, I want my cart to persist if I refresh the page or come back to the tab, so that I don't lose my selections by accident.
19. As a shopper, I want a clear call-to-action in the cart drawer to proceed to checkout, so that I know how to complete my purchase.

### Shopper — Checkout

20. As a shopper, I want to enter my full name on the checkout page, so that the artist knows who placed the order.
21. As a shopper, I want to enter my email address, so that I can be contacted about my order.
22. As a shopper, I want to enter a street address, city, postal code, and country separately, so that the artist has all the information needed to ship my postcard correctly.
23. As a shopper, I want to pay by card using a secure Stripe payment form, so that my payment details are handled safely.
24. As a shopper, I want to be told clearly if a product in my cart has become unavailable before I'm charged, so that I'm not billed for something that can't be fulfilled.
25. As a shopper, I want to be redirected to a thank-you page after a successful payment, so that I know my order went through.
26. As a shopper, I want the thank-you page to confirm my payment was received (not just that I submitted the form), so that I have real confidence my order is being processed.
27. As a shopper, I want to see a reassuring fallback message if the payment confirmation takes longer than expected, so that I'm not left staring at a spinner indefinitely.

### Artist — Authentication

28. As the artist, I want to log in with my email and password, so that I can access the admin panel securely.
29. As the artist, I want to be redirected to the login page if I try to access any admin URL without being logged in, so that shoppers can't stumble into the admin panel.
30. As the artist, I want to be redirected to the login page if I'm logged in but not flagged as an admin, so that a non-admin Supabase account can't access admin features.

### Artist — Order Queue

31. As the artist, I want to see a list of all orders sorted by most recent, so that I know what needs to be fulfilled.
32. As the artist, I want each order row to show the date, customer name, status, and total, so that I can scan the queue quickly.
33. As the artist, I want to click into an order to see the full customer name, email, shipping address, items ordered, and total, so that I have everything I need to pack and ship without opening another tool.
34. As the artist, I want to mark an order as "order confirmed" once I've acknowledged it, so that the record reflects I've seen it.
35. As the artist, I want to mark an order as "sent" once I've posted it, so that I can track what's been shipped.
36. As the artist, I want to see a "cancel" button on each order that is clearly labelled as coming soon, so that I know the feature is planned without it being functional yet.
37. As the artist, I want orders in all active statuses to be visible in the queue, so that I don't lose track of in-progress orders.

### Artist — Product Management

38. As the artist, I want to add a new postcard with a name, description, price, image, and tags, so that it appears in the gallery for shoppers.
39. As the artist, I want to upload a product image directly from my browser, so that I don't need a separate tool to manage images.
40. As the artist, I want to add multiple freeform tags to a product (e.g. "birthday", "blue", "watercolor"), so that shoppers can find it through filtering and search.
41. As the artist, I want to edit a product's name, description, price, image, and tags after it's been created, so that I can keep the catalog accurate.
42. As the artist, I want to toggle a product as temporarily unavailable, so that shoppers can see it but can't order it when I'm out of that design.
43. As the artist, I want to toggle a product back to available when I'm ready to take orders again, so that I don't need to re-create it.
44. As the artist, I want to delete a product entirely, so that discontinued designs don't clutter the catalog.

### Artist — Seasonal Banners

45. As the artist, I want to create a seasonal banner with a title, image, start date, and end date, so that the homepage shows a relevant banner during special periods.
46. As the artist, I want to activate or deactivate a banner independently of its dates, so that I can prepare banners in advance or disable one early.
47. As the artist, I want to edit a banner's title, image, or dates after creating it, so that I can adjust campaigns without starting over.

## Implementation Decisions

### Modules

- **CartContext** — React Context backed by `localStorage`. Exposes `items`, `addItem(productId, quantity)`, `removeItem(productId)`, `updateQuantity(productId, quantity)`, `clearCart()`, and a derived `total` (in cents). Rehydrates from `localStorage` on mount.
- **Gallery** — fetches all products once via `useProducts` hook. Filters the in-memory array on every search/tag change. No re-fetch on filter. Tag pills are derived from the union of all `tags` arrays across fetched products.
- **ProductCard** — pure display component. Receives product data as props, emits `onAddToCart`. Greyed out + disabled when `is_available = false`.
- **CartDrawer** — reads from `CartContext`. Slide-out panel with quantity controls and a checkout CTA.
- **CheckoutForm** — collects name, email, street, city, postal code, country. On submit, calls `create-payment-intent` Edge Function, then mounts Stripe `PaymentElement` with the returned `clientSecret`.
- **ThankYouPage** — reads `payment_intent` from URL query param. Polls Supabase `orders` table every 2 seconds for `status = 'payment_confirmed'`. Stops after 30 seconds and shows a fallback message.
- **AdminRoute** — wrapper component that checks Supabase session and `profiles.is_admin`. Renders a loading state while checking, then either renders children or redirects to `/login`.
- **AdminOrders** — lists orders with date, customer name, status badge, total. Clicking a row navigates to `/admin/orders/:id`.
- **AdminOrderDetail** — shows full order detail. Renders action buttons based on current status: `payment_confirmed` → "Confirm Order", `order_confirmed` → "Mark as Sent". Cancel button is rendered but visually disabled with a "coming soon" tooltip.
- **AdminProducts** — table of products with inline availability toggle and edit/delete actions. "Add product" opens a form with image upload via Supabase Storage JS client.
- **AdminBanners** — form to create/edit seasonal banners. Table lists existing banners with activate/deactivate toggle.
- **MostLoved** — queries `order_items JOIN orders WHERE status IN ('payment_confirmed', 'order_confirmed', 'sent')`, groups by `product_id`, sums quantities, takes top 3. Returns `null` when result is empty.
- **SeasonalBanner** — queries `seasonal_banners WHERE start_date <= today <= end_date AND active = true`. Returns `null` when no row matches.
- **`create-payment-intent` Edge Function** — receives `{items: {product_id, quantity}[], customer: {name, email, street, city, postal_code, country}}`. Fetches product prices and `is_available` from DB. Rejects if any item is unavailable. Calculates total in cents. Writes `orders` row (`status: order_received`) and `order_items` rows. Creates Stripe PaymentIntent in EUR. Returns `clientSecret`.
- **`fulfill-order` Edge Function** — Stripe webhook handler. Verifies `Stripe-Signature` header using `STRIPE_WEBHOOK_SECRET`. On `payment_intent.succeeded`, updates matching `orders` row to `status: payment_confirmed`.

### Schema changes from original PRD

- `products`: remove `stock_total`, `stock_reserved`, `stock_available`. Add `tags TEXT[]`, `is_available BOOLEAN DEFAULT true`. `price` is `INTEGER` (cents).
- `orders`: add `customer_name TEXT`, `customer_email TEXT`, `shipping_street TEXT`, `shipping_city TEXT`, `shipping_postal_code TEXT`, `shipping_country TEXT`. Status is one of: `order_received`, `payment_confirmed`, `order_confirmed`, `sent`, `cancelled`. `total` is `INTEGER` (cents).
- `order_items`: `price_at_purchase` is `INTEGER` (cents).
- Remove `purchase_product()` Postgres function entirely — no stock tracking needed.

### RLS policies

- `products`: public SELECT, admin-only INSERT/UPDATE/DELETE.
- `orders`: public SELECT (required for anonymous ThankYou polling by `stripe_payment_id`), INSERT/UPDATE via Edge Functions using service role key only.
- `seasonal_banners`: public SELECT, admin-only INSERT/UPDATE/DELETE.
- `profiles`: users SELECT their own row only.
- Supabase Storage bucket for product images: public read, admin-only write.

### Payments

- Currency: EUR throughout. Stripe PaymentIntent created in `eur`.
- All prices stored and transmitted as integer cents.
- Stripe PaymentIntent creation and order write happen atomically in `create-payment-intent` before any charge occurs.
- Webhook signature verification is mandatory — no exceptions.

### Hosting

- AWS S3 + CloudFront or AWS Amplify (not Vercel — free tier is non-commercial only).
- SPA routing: configure CloudFront to serve `index.html` for all 404s, or use Amplify which handles this automatically.

## Testing Decisions

A good test exercises only the external behaviour of a module — what it returns or what side effects it produces — not its internal implementation. Tests should not assert on internal state, variable names, or specific function call order unless that order is itself the observable contract.

### Modules to test

**CartContext**
- Adding an item creates a cart entry with correct quantity and price.
- Adding the same item twice increments quantity.
- Removing an item eliminates it from the cart.
- Updating quantity to zero removes the item.
- `total` reflects sum of (price × quantity) across all items in cents.
- Cart is written to `localStorage` after every mutation.
- Cart is rehydrated from `localStorage` on mount.
- Rehydrating with corrupt `localStorage` data starts with an empty cart rather than throwing.

**`create-payment-intent` Edge Function**
- Returns 400 if any item has `is_available = false`.
- Returns 400 if any `product_id` does not exist in the DB.
- Calculates total from DB prices, ignoring any `total` the client sends.
- Writes one `orders` row with `status: order_received` and correct customer fields.
- Writes one `order_items` row per cart item with `price_at_purchase` from DB.
- Returns a `clientSecret` on success.
- Does not create a Stripe PaymentIntent if DB validation fails.

**`fulfill-order` Edge Function**
- Rejects requests with an invalid or missing `Stripe-Signature` header (returns 400).
- Updates the matching `orders` row to `status: payment_confirmed` on `payment_intent.succeeded`.
- Does nothing (returns 200) for unrecognised event types.
- Is idempotent — calling it twice with the same event does not corrupt the order.

**Gallery (client-side filtering)**
- Searching by name returns only matching products.
- Searching by tag text returns products that have that tag.
- Clicking a tag pill filters to only products with that exact tag.
- Search and tag pill filter compose: both conditions must be met.
- Clearing search and deselecting all pills returns the full product list.

**AdminRoute**
- Renders children when session exists and `is_admin = true`.
- Redirects to `/login` when no session exists.
- Redirects to `/login` when session exists but `is_admin = false`.
- Shows a loading state while session is being checked.

**ThankYouPage**
- Displays a loading/polling state on mount.
- Displays order confirmation when Supabase returns `status: payment_confirmed`.
- Displays a fallback message after 30 seconds without a `payment_confirmed` response.
- Stops polling after receiving `payment_confirmed`.
- Stops polling after the 30-second timeout.

**MostLoved**
- Returns null when no qualifying orders exist.
- Returns up to 3 products ranked by total quantity sold.
- Only counts orders with status in `payment_confirmed`, `order_confirmed`, `sent`.
- Does not count `cancelled` or `order_received` orders.

**SeasonalBanner**
- Returns null when no active banner matches today's date.
- Returns the banner when today falls within `start_date` and `end_date` and `active = true`.
- Returns null when a banner's dates match but `active = false`.

## Out of Scope

- Multi-artist marketplace — this is a single-artist shop.
- Stock tracking, oversell prevention, `purchase_product()` Postgres function.
- Soft cart reservations (reservations table, TTL cron).
- Supabase Realtime live stock updates.
- Order cancellation and Stripe refund flow (UI stub only — "coming soon").
- OAuth providers (Google, GitHub) — email + password only for MVP.
- Customer accounts or order history for shoppers.
- Email order confirmation.
- PostHog event tracking (initialized but events deferred to Day 2).
- Product detail page — all product info on the gallery card.
- AWS CloudFront geo analytics — Day 2+.
- Search / filter for the admin order queue.
- Discount codes, multi-image per product, product reviews.

## Further Notes

- The `to-prd` skill was run after a full `/grill-me` session — all decisions above are intentional and grilled, not assumed.
- PostHog Day 2 events target: `product_viewed`, `add_to_cart`, `checkout_started`, `order_placed`.
- Cancel order feature needs Stripe refund API integration before it can be enabled — the status value and disabled UI button are intentionally scaffolded now so Day 2 work is additive.
- AWS Amplify is the recommended deployment target (not S3+CloudFront) if the artist wants auto-deploy on git push, as it handles SPA routing automatically.
