# 02 — React scaffold + routing skeleton

Status: needs-triage
Type: AFK

## What to build

Scaffold the full React + Vite project with all dependencies installed, all routes declared with placeholder pages, and all third-party clients initialised. After this slice, `npm run dev` runs and every route renders a titled placeholder without errors.

## Acceptance criteria

- [ ] Vite + React + Tailwind CSS configured
- [ ] Dependencies installed: `@supabase/supabase-js`, `@stripe/stripe-js`, `@stripe/react-stripe-js`, `posthog-js`, `react-router-dom` (v6)
- [ ] `src/lib/supabase.js` — Supabase client initialised from env vars
- [ ] `src/lib/stripe.js` — Stripe client initialised from env var
- [ ] PostHog initialised in `main.jsx` (no events fired yet)
- [ ] React Router v6 router declared with all routes: `/`, `/checkout`, `/thank-you`, `/login`, `/admin/orders`, `/admin/orders/:id`, `/admin/products`, `/admin/banners`
- [ ] Each route renders a placeholder page component with a visible title
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without errors

## Blocked by

None — can start immediately (parallel with issue 01).
