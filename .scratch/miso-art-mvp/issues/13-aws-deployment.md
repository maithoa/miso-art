# 13 — AWS deployment

Status: needs-triage
Type: HITL

## What to build

Deploy the built app to AWS and verify the full shopper and artist flows work end-to-end on a live URL. AWS Amplify is preferred (auto-deploy on push, handles SPA routing automatically). S3 + CloudFront is the alternative if Amplify is not suitable.

## Acceptance criteria

- [ ] App is accessible at a public URL
- [ ] All environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_POSTHOG_KEY`) set in the deployment environment
- [ ] SPA routing works — navigating directly to `/checkout` or `/admin/orders` does not return a 404
- [ ] Stripe webhook URL updated to point at the production Supabase Edge Function URL
- [ ] Smoke test: shopper flow — browse → add to cart → checkout → pay with `4242 4242 4242 4242` → ThankYou shows `payment_confirmed`
- [ ] Smoke test: artist flow — log in → order appears in queue → advance status → mark as sent
- [ ] Smoke test: admin products — add a product with image → appears in gallery
- [ ] `npm run build` output is what is deployed (no dev server in production)

## Blocked by

- All issues 01–12 must be complete.
