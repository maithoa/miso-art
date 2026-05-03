# 09 — Admin order queue

Status: needs-triage
Type: AFK

## What to build

Build the artist's daily workflow screen: an order list and order detail page. The artist scans incoming orders, clicks in to see full customer and shipping details, and advances each order through its status lifecycle. After this slice the artist can fully manage fulfilment without opening any other tool.

## Acceptance criteria

- [ ] `/admin/orders` lists all orders sorted by most recent, showing date, customer name, status badge, and total (EUR)
- [ ] Clicking an order row navigates to `/admin/orders/:id`
- [ ] Order detail shows: customer name, email, full shipping address, all items (product name + quantity + price), and total
- [ ] Detail shows current order status
- [ ] "Confirm Order" button appears when status is `payment_confirmed`; clicking it updates status to `order_confirmed`
- [ ] "Mark as Sent" button appears when status is `order_confirmed`; clicking it updates status to `sent`
- [ ] No action buttons shown when status is `sent`
- [ ] "Cancel" button is visible on the detail page but disabled, with a "coming soon" tooltip
- [ ] Status changes persist to Supabase immediately and reflect on the page without a full reload
- [ ] Orders with all statuses (`order_received`, `payment_confirmed`, `order_confirmed`, `sent`) are visible in the list

## Blocked by

- 07 — Stripe payment + webhook + ThankYou
- 08 — Admin auth + route protection
