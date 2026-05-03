# 08 — Admin auth + route protection

Status: needs-triage
Type: AFK

## What to build

Build the login page and the `AdminRoute` wrapper that protects all `/admin/*` routes. After this slice the artist can log in with email and password, and any unauthenticated or non-admin attempt to access admin URLs is redirected to `/login`.

## Acceptance criteria

- [ ] `LoginPage` has email and password fields and a submit button
- [ ] Successful login with a valid admin account redirects to `/admin/orders`
- [ ] Failed login shows a clear error message
- [ ] `AdminRoute` wrapper checks Supabase session on mount
- [ ] `AdminRoute` shows a loading state while the session check is in progress
- [ ] `AdminRoute` redirects to `/login` when no session exists
- [ ] `AdminRoute` redirects to `/login` when session exists but `profiles.is_admin = false`
- [ ] `AdminRoute` renders children when session exists and `is_admin = true`
- [ ] All `/admin/*` routes are wrapped with `AdminRoute`
- [ ] Shared admin nav links to `/admin/orders`, `/admin/products`, `/admin/banners`
- [ ] Tests: all four `AdminRoute` states (loading, no session, non-admin session, admin session)

## Blocked by

- 01 — Supabase schema + project config
- 02 — React scaffold + routing skeleton
