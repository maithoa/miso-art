// Fix for Issue 18 — Edge Function auth failure.
// Root cause: supabase.functions.invoke() attaches the anon key as a Bearer token;
// if the key stored in VITE_SUPABASE_ANON_KEY is NOT a legacy JWT (eyJ… format)
// the Edge Function's built-in JWT verification rejects the request with 401.
//
// Fix applied (Option B — preferred when no legacy JWT key is available):
//   Go to Supabase Dashboard → Edge Functions → create-payment-intent → Settings
//   and DISABLE "Enforce JWT Verification".
//   The function performs its own input validation internally (shape checks, product
//   existence, availability) so disabling gateway-level JWT verification is safe here.
//
// If your project DOES have a legacy JWT anon key (eyJ… format) in
// Dashboard → Settings → API → "anon (legacy)":
//   Replace VITE_SUPABASE_ANON_KEY in .env with that value instead and re-enable
//   JWT verification on the function — that is Option A and is equally valid.
//
// No code change is required in this file; the fix is purely infrastructure.
// This comment documents what was done so future developers understand why
// JWT verification is disabled on the create-payment-intent function.

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
