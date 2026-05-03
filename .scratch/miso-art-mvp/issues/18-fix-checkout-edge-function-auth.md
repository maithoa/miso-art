# 18 — Fix checkout: Edge Function auth failure

Status: needs-triage
Type: AFK

## What to build

The checkout page fails with "Failed to send a request to the Edge Function" when the user submits the customer info form. The root cause is that `VITE_SUPABASE_ANON_KEY` in `.env` is in the new Supabase `sb_publishable_` format, which the Supabase Edge Function relay rejects with `UNAUTHORIZED_INVALID_JWT_FORMAT` when sent as a Bearer token.

Investigate and fix the auth so that `supabase.functions.invoke('create-payment-intent')` succeeds from the browser.

## Diagnosis so far

- Edge Function IS deployed and reachable (curl returns a response, not a 404)
- Curl with `Authorization: Bearer sb_publishable_xxx` → `{"code":"UNAUTHORIZED_INVALID_JWT_FORMAT","message":"Invalid JWT"}`
- The anon key in `.env` (`sb_publishable_iOnX9e4SdwFJf7lrW63Kug__oaNlmFb`) is the new Supabase publishable key format, NOT the legacy JWT (`eyJ...`)
- Installed supabase-js version: `2.105.1`

## Acceptance criteria

- [ ] `supabase.functions.invoke('create-payment-intent')` succeeds from the checkout page (no "Failed to send a request" error)
- [ ] The Stripe Payment Element mounts after submitting customer info
- [ ] End-to-end checkout works with Stripe test card `4242 4242 4242 4242`
- [ ] `VITE_SUPABASE_ANON_KEY` in `.env` is updated if the key needed to change

## Investigation steps (try in order)

1. **Check Supabase dashboard for legacy JWT key:** Settings → API → look for an `anon` key in `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` format. If present, replace `VITE_SUPABASE_ANON_KEY` in `.env` and restart dev server.

2. **Check supabase-js compatibility:** Confirm whether supabase-js v2.105+ transparently handles `sb_publishable_` keys for Edge Function calls. Check the [supabase-js changelog](https://github.com/supabase/supabase-js/releases) for notes on the new key format.

3. **Check Edge Function JWT verification setting:** In Supabase Dashboard → Edge Functions → `create-payment-intent` → settings, there may be a toggle to allow unauthenticated (no JWT required) invocations. If the function should be publicly callable, disabling JWT verification is the correct fix — the function already validates inputs internally.

## Blocked by

None — can start immediately.
