# 07 — Stripe payment + webhook + ThankYou

Status: needs-triage
Type: AFK

## What to build

Complete the payment flow end-to-end: mount the Stripe PaymentElement using the `clientSecret` from issue 06, handle payment confirmation, build the `fulfill-order` webhook Edge Function that flips the order to `payment_confirmed`, and build the ThankYou page that polls for that status. After this slice a shopper can pay with a test card and see a confirmed order.

## Acceptance criteria

- [ ] Stripe `PaymentElement` mounts on the checkout page after `clientSecret` is received
- [ ] Successful payment redirects to `/thank-you?payment_intent=pi_xxx`
- [ ] `fulfill-order` Edge Function verifies the `Stripe-Signature` header; returns 400 on invalid/missing signature
- [ ] `fulfill-order` updates the matching `orders` row to `status: payment_confirmed` on `payment_intent.succeeded`
- [ ] `fulfill-order` returns 200 and does nothing for unrecognised event types
- [ ] `fulfill-order` is idempotent — processing the same event twice does not corrupt the order
- [ ] `STRIPE_WEBHOOK_SECRET` configured in Supabase Edge Function environment
- [ ] ThankYou page polls Supabase every 2 seconds for `stripe_payment_id = pi_xxx AND status = payment_confirmed`
- [ ] ThankYou page displays order confirmation when `payment_confirmed` is detected
- [ ] ThankYou page stops polling after receiving `payment_confirmed`
- [ ] ThankYou page displays a fallback message after 30 seconds without confirmation
- [ ] Full flow verified with Stripe test card `4242 4242 4242 4242`
- [ ] Tests: `fulfill-order` webhook behaviours, ThankYou page polling + timeout

## Blocked by

- 06 — Checkout form + create-payment-intent
