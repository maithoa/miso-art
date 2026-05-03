# 23 — useToast error surfacing

Status: needs-triage
Type: AFK

## What to build

Errors currently surface in four different ways: `alert()` in admin pages, silent `console.error` in `useMostLoved`, inline red `<p>` tags in `Checkout`, and uncaught promise rejections. Replace all of them with a single `useToast` hook and `<Toast>` component — one visual pattern, one place to change.

## Acceptance criteria

- [ ] `src/hooks/useToast.js` exports `useToast()` returning `{ toast, message, clear }` where `toast(msg)` sets a message and auto-clears after 4 seconds
- [ ] `src/components/Toast.jsx` renders the active message as a fixed bottom-right notification using the Gumroad design language (white bg, `#1a1a1a` text, `#e5e5e5` border, `rounded-2xl`, dismiss button)
- [ ] `App.jsx` mounts a single `<Toast>` instance (or context-based, whichever is simpler)
- [ ] `AdminProducts.jsx` replaces `alert()` calls with `toast()`
- [ ] `AdminOrderDetail.jsx` replaces `alert()` calls with `toast()`
- [ ] `useMostLoved` replaces silent `console.error` with `toast()` (or surfaces error to Gallery — whichever is less disruptive to the shopper UX)
- [ ] `Checkout.jsx` inline red error `<p>` remains as-is (inline errors are appropriate in forms — do not replace)
- [ ] Unit tests cover: message appears on `toast()`, message auto-clears after timeout, dismiss button clears immediately
- [ ] No existing tests broken

## Blocked by

- 21 (`useAdminMutation` must land first — both touch admin pages and a concurrent edit causes merge conflicts)
