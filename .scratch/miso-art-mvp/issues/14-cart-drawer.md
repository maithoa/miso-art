# 14 — Cart drawer

Status: needs-triage
Type: AFK

## What to build

When a shopper adds an item to cart, they need visual feedback and a way to review what they've added. Build a slide-in cart drawer that opens automatically when an item is added, and is accessible via a persistent cart icon in a top nav bar.

## Acceptance criteria

- [ ] A top navigation bar renders on all public pages (Gallery, Checkout) with the site name/logo on the left and a cart icon + item count badge on the right
- [ ] Clicking the cart icon opens a slide-in drawer from the right
- [ ] The drawer lists all cart items: product image (thumbnail), name, quantity, and line total in EUR
- [ ] Each item has a remove (×) button that removes it from the cart
- [ ] The drawer footer shows the cart total in EUR and a "Go to Checkout" button that navigates to /checkout
- [ ] The drawer shows an empty state ("Your cart is empty") when no items are in cart
- [ ] The drawer closes when clicking outside it or pressing Escape
- [ ] Adding an item to cart automatically opens the drawer (brief open, stays open until closed)
- [ ] CartContext already exists at src/context/CartContext.jsx with items, total, removeItem, updateQuantity

## Blocked by

- 05 (CartContext must exist)
