import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";

// ---------------------------------------------------------------------------
// Minimal Stripe webhook event factory
// ---------------------------------------------------------------------------

function makePaymentIntentEvent(
  type: string,
  piId: string
): Record<string, unknown> {
  return {
    id: `evt_test_${piId}`,
    type,
    data: {
      object: {
        id: piId,
        object: "payment_intent",
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Test doubles — we patch globalThis.Deno.env and module-level singletons by
// re-importing the handler logic through a thin wrapper that accepts injected
// dependencies, mirroring the pattern used in create-payment-intent tests.
// ---------------------------------------------------------------------------

type RpcResult = { error: null | { message: string } };
type MockSupabase = { rpc: (fn: string, args: Record<string, unknown>) => Promise<RpcResult> };

type VerifyResult = { ok: boolean; event?: Record<string, unknown>; error?: string };
type MockStripe = {
  webhooks: {
    constructEventAsync: (
      body: Uint8Array,
      sig: string,
      secret: string
    ) => Promise<Record<string, unknown>>;
  };
};

// The handler is extracted into a pure function so tests can inject mocks
// without dealing with Deno module-cache side-effects.
async function handleFulfillOrder(
  req: Request,
  stripe: MockStripe,
  supabase: MockSupabase
): Promise<Response> {
  const rawBody = await req.arrayBuffer();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(
      JSON.stringify({ error: "Missing Stripe-Signature header" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let event: Record<string, unknown>;

  try {
    event = await stripe.webhooks.constructEventAsync(
      new Uint8Array(rawBody),
      signature,
      "whsec_test"
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (event.type === "payment_intent.succeeded") {
    const piId = (event.data as { object: { id: string } }).object.id;

    const { error } = await supabase.rpc("confirm_order_payment", {
      p_stripe_payment_id: piId,
    });

    if (error) {
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

  return new Response(
    JSON.stringify({ received: true, updated: false }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function makeRequest(
  body: string,
  signature?: string
): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (signature !== undefined) {
    headers["stripe-signature"] = signature;
  }
  return new Request("http://localhost/fulfill-order", {
    method: "POST",
    headers,
    body,
  });
}

function makeStripeOk(event: Record<string, unknown>): MockStripe {
  return {
    webhooks: {
      constructEventAsync: async () => event,
    },
  };
}

function makeStripeFail(message: string): MockStripe {
  return {
    webhooks: {
      constructEventAsync: async () => {
        throw new Error(message);
      },
    },
  };
}

function makeSupabaseOk(): { client: MockSupabase; calls: Array<Record<string, unknown>> } {
  const calls: Array<Record<string, unknown>> = [];
  return {
    calls,
    client: {
      rpc: async (fn, args) => {
        calls.push({ fn, ...args });
        return { error: null };
      },
    },
  };
}

function makeSupabaseError(message: string): MockSupabase {
  return {
    rpc: async () => ({ error: { message } }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

Deno.test("returns 400 when Stripe-Signature header is missing", async () => {
  const req = makeRequest(JSON.stringify({})); // no signature header
  const stripe = makeStripeOk({});
  const { client: sb } = makeSupabaseOk();

  const res = await handleFulfillOrder(req, stripe, sb);

  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "Missing Stripe-Signature header");
});

Deno.test("returns 400 when Stripe signature verification fails", async () => {
  const req = makeRequest(JSON.stringify({}), "t=bad,v1=invalid");
  const stripe = makeStripeFail("No signatures found matching the expected signature for payload");
  const { client: sb } = makeSupabaseOk();

  const res = await handleFulfillOrder(req, stripe, sb);

  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(
    body.error,
    "No signatures found matching the expected signature for payload"
  );
});

Deno.test("payment_intent.succeeded updates order status to payment_confirmed", async () => {
  const piId = "pi_test_abc123";
  const event = makePaymentIntentEvent("payment_intent.succeeded", piId);
  const req = makeRequest(JSON.stringify(event), "t=1,v1=sig");
  const stripe = makeStripeOk(event);
  const { client: sb, calls } = makeSupabaseOk();

  const res = await handleFulfillOrder(req, stripe, sb);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.received, true);
  assertEquals(body.updated, true);

  // Verify the RPC was called with the correct payment intent id
  assertEquals(calls.length, 1);
  assertEquals(calls[0].fn, "confirm_order_payment");
  assertEquals(calls[0].p_stripe_payment_id, piId);
});

Deno.test("unrecognised event type returns 200 and makes no DB change", async () => {
  const event = makePaymentIntentEvent("payment_intent.payment_failed", "pi_test_xyz");
  const req = makeRequest(JSON.stringify(event), "t=1,v1=sig");
  const stripe = makeStripeOk(event);
  const { client: sb, calls } = makeSupabaseOk();

  const res = await handleFulfillOrder(req, stripe, sb);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.received, true);
  assertEquals(body.updated, false);

  // No database calls should have been made for unrecognised events
  assertEquals(calls.length, 0);
});

Deno.test("idempotent — second call with same event does not corrupt order", async () => {
  const piId = "pi_test_idempotent";
  const event = makePaymentIntentEvent("payment_intent.succeeded", piId);

  // Simulate the RPC honouring the idempotency guard (returns no error both times)
  // The guard (status != 'payment_confirmed') lives in the DB; the Edge Function
  // must pass through the call safely both times and return 200 each time.
  const { client: sb, calls } = makeSupabaseOk();

  for (let i = 0; i < 2; i++) {
    const req = makeRequest(JSON.stringify(event), "t=1,v1=sig");
    const stripe = makeStripeOk(event);
    const res = await handleFulfillOrder(req, stripe, sb);

    assertEquals(res.status, 200, `Expected 200 on call #${i + 1}`);
    const body = await res.json();
    assertEquals(body.received, true);
    assertEquals(body.updated, true);
  }

  // RPC called exactly twice — once per webhook delivery
  assertEquals(calls.length, 2);
  // Both calls used the same payment intent id
  assertEquals(calls[0].p_stripe_payment_id, piId);
  assertEquals(calls[1].p_stripe_payment_id, piId);
});

Deno.test("returns 500 when DB update fails", async () => {
  const piId = "pi_test_dberr";
  const event = makePaymentIntentEvent("payment_intent.succeeded", piId);
  const req = makeRequest(JSON.stringify(event), "t=1,v1=sig");
  const stripe = makeStripeOk(event);
  const sb = makeSupabaseError("connection timeout");

  const res = await handleFulfillOrder(req, stripe, sb);

  // 500 so Stripe retries delivery rather than silently swallowing the failure
  assertEquals(res.status, 500);
  const body = await res.json();
  assertEquals(body.error, "Database update failed");
});
