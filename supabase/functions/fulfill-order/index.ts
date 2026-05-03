import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "npm:stripe@12.18.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  // httpClient is not needed in Deno — Stripe SDK uses fetch automatically
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req: Request): Promise<Response> => {
  // Raw bytes are required by Stripe for signature verification — do NOT call req.json() first
  const rawBody = await req.arrayBuffer();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(
      JSON.stringify({ error: "Missing Stripe-Signature header" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let event: Stripe.Event;

  try {
    // constructEventAsync is the Deno-compatible async variant
    event = await stripe.webhooks.constructEventAsync(
      new Uint8Array(rawBody),
      signature,
      webhookSecret
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const piId = paymentIntent.id;

    // Idempotency guard: skip update if already confirmed so repeated webhooks are safe
    const { error } = await supabase.rpc("confirm_order_payment", {
      p_stripe_payment_id: piId,
    });

    if (error) {
      console.error("DB error confirming order payment:", error);
      // Return 500 so Stripe retries the webhook delivery
      return new Response(
        JSON.stringify({ error: "Database update failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ received: true, updated: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // All unrecognised event types are acknowledged without touching the DB
  return new Response(
    JSON.stringify({ received: true, updated: false }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
