# fulfill-order Edge Function

Handles Stripe webhook events to update order status after payment.

## Required Environment Variables

Configure these in the Supabase Dashboard under
**Project Settings → Edge Functions → Secrets** (or via `supabase secrets set`):

| Variable | Description |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | The webhook signing secret from your Stripe Dashboard webhook endpoint (starts with `whsec_`). **Required.** Without this the function will reject every request with HTTP 400. |
| `STRIPE_SECRET_KEY` | Your Stripe secret API key (starts with `sk_live_` or `sk_test_`). |
| `SUPABASE_URL` | Injected automatically by the Supabase runtime. |
| `SUPABASE_SERVICE_ROLE_KEY` | Injected automatically by the Supabase runtime. Grants the function permission to call the `confirm_order_payment` RPC. |

## Stripe Dashboard Setup

1. Go to **Developers → Webhooks → Add endpoint**.
2. Set the endpoint URL to `https://<project-ref>.functions.supabase.co/fulfill-order`.
3. Select the `payment_intent.succeeded` event.
4. Copy the **Signing secret** and save it as `STRIPE_WEBHOOK_SECRET`.

## Database RPC Dependency

This function calls `confirm_order_payment(p_stripe_payment_id TEXT)` which must
exist in the database. The RPC updates the order row:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_confirm_order_payment_rpc.sql
CREATE OR REPLACE FUNCTION confirm_order_payment(p_stripe_payment_id TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE orders
  SET status = 'payment_confirmed'
  WHERE stripe_payment_id = p_stripe_payment_id
    -- Idempotency guard: do not overwrite if already confirmed
    AND status != 'payment_confirmed';
$$;
```

## Event Handling

| Event type | Action |
|---|---|
| `payment_intent.succeeded` | Calls `confirm_order_payment` RPC; returns HTTP 200. |
| Any other type | Returns HTTP 200 immediately; no DB change. |

Returning HTTP 200 for unrecognised events prevents Stripe from retrying them
endlessly. Returning HTTP 500 on DB failure signals Stripe to retry delivery.
