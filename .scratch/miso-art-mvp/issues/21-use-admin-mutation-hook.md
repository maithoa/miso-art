# 21 — useAdminMutation hook

Status: needs-triage
Type: AFK

## What to build

`AdminProducts` and `AdminOrderDetail` each invent their own loading/error/optimistic-rollback pattern inline. Every new admin mutation would repeat this. Extract a `useAdminMutation` hook that owns this state machine so page components only call `mutate(fn)` and read `{ loading, error }`.

## Acceptance criteria

- [ ] `src/hooks/useAdminMutation.js` exports `useAdminMutation()` returning `{ mutate, loading, error, clearError }`
- [ ] `mutate(asyncFn)` sets `loading: true`, awaits the function, sets `loading: false` on completion; on throw/rejection sets `error` to the caught message
- [ ] `AdminProducts.jsx` uses `useAdminMutation` for `toggleAvailability` and `deleteProduct` — inline loading/error state removed from both
- [ ] `AdminOrderDetail.jsx` uses `useAdminMutation` for status transition actions — inline loading/error state removed
- [ ] Unit tests cover: loading state during async call, error state on rejection, clearError resets error, successful call clears error
- [ ] No existing tests broken

## Blocked by

None — can start immediately.
