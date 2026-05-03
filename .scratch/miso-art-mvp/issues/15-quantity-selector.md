# 15 — Quantity selector in cart drawer

Status: needs-triage
Type: AFK

## What to build

Shoppers often want to buy multiple copies of the same card. Add quantity controls to the cart drawer (not on the product card — keep the gallery clean). Each cart line item gets a − / qty / + control. The product card "Add to cart" button remains a one-click action that adds 1 unit (incrementing if already in cart).

## Acceptance criteria

- [ ] Each line item in the cart drawer has a quantity control: − button, numeric display, + button
- [ ] Pressing + calls updateQuantity(id, quantity + 1)
- [ ] Pressing − calls updateQuantity(id, quantity - 1); when quantity reaches 0 the item is removed (CartContext.updateQuantity already handles this)
- [ ] The − button is visually disabled (not just greyed out) when quantity is 1 to prevent accidental removal — user must use the × remove button instead
- [ ] The quantity display is read-only (no direct text input — keeps mobile UX clean)
- [ ] Line total updates immediately as quantity changes
- [ ] Cart total in drawer footer updates immediately

## Blocked by

- 14 (cart drawer must exist first)
