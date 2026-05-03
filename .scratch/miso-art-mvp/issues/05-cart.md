# 05 — Cart + CartDrawer

Status: needs-triage
Type: AFK

## What to build

Implement the full cart experience: a React Context that manages cart state, persists to localStorage, and a slide-out CartDrawer for reviewing and adjusting items. Add to Cart is wired up on ProductCard. After this slice a shopper can add, adjust, and remove items — and their cart survives a page refresh.

## Acceptance criteria

- [ ] `CartContext` exposes `items`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, and derived `total` (cents)
- [ ] Cart state is written to `localStorage` after every mutation
- [ ] Cart state is rehydrated from `localStorage` on app mount
- [ ] Corrupt or missing `localStorage` data results in an empty cart, not a crash
- [ ] "Add to Cart" button on `ProductCard` adds the product to the cart
- [ ] `CartDrawer` slides in from the right and shows all cart items with name, price, and quantity controls
- [ ] Quantity can be increased or decreased per item; decreasing to zero removes the item
- [ ] Running subtotal displayed in EUR (cents ÷ 100)
- [ ] "Proceed to Checkout" button in drawer navigates to `/checkout`
- [ ] Cart item count badge visible on a cart icon in the page header
- [ ] Tests: all CartContext behaviours including localStorage persistence and corrupt-data handling

## Blocked by

- 03 — Product gallery
