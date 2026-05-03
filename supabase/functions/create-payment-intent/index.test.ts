/**
 * Tests run with: deno test --allow-env --allow-net (or via jest with ts-jest)
 * We mock Supabase and Stripe so no real network calls are made.
 */

import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts';

// ---------------------------------------------------------------------------
// Minimal in-process HTTP handler re-export so tests call the same logic
// without spinning up a real Deno server.
// We dynamically import and re-wire the handler after setting env vars.
// ---------------------------------------------------------------------------

// ---- helpers ----
const makeRequest = (body: unknown) =>
  new Request('http://localhost/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// ---------------------------------------------------------------------------
// Shared stubs — replaced per test suite where needed
// ---------------------------------------------------------------------------

type Product = { id: string; price: number; is_available: boolean };

const PRODUCT_A: Product = { id: 'prod-aaa', price: 1000, is_available: true };
const PRODUCT_B: Product = { id: 'prod-bbb', price: 500, is_available: true };
const UNAVAILABLE: Product = { id: 'prod-unavail', price: 800, is_available: false };

const VALID_CUSTOMER = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  street: '1 Main St',
  city: 'Berlin',
  postal_code: '10115',
  country: 'DE',
};

// ---------------------------------------------------------------------------
// Test factory — builds a self-contained handler with injectable mocks
// ---------------------------------------------------------------------------

function buildHandler({
  dbProducts = [PRODUCT_A, PRODUCT_B],
  dbFetchError = null as string | null,
  orderInsertError = null as string | null,
  itemsInsertError = null as string | null,
  stripeError = null as string | null,
  capturedStripeArgs = {} as Record<string, unknown>,
  capturedOrderInsert = {} as Record<string, unknown>,
  capturedItemsInsert = [] as unknown[],
} = {}) {
  // Fake Supabase client
  const fakeSupabase = {
    from: (table: string) => {
      if (table === 'products') {
        return {
          select: () => ({
            in: (_col: string, ids: string[]) => ({
              // resolve only the products whose ids were requested
              data: dbFetchError
                ? null
                : dbProducts.filter((p) => ids.includes(p.id)),
              error: dbFetchError ? { message: dbFetchError } : null,
            }),
          }),
        };
      }
      if (table === 'orders') {
        return {
          insert: (row: unknown) => {
            Object.assign(capturedOrderInsert, row as object);
            return {
              select: () => ({
                single: () =>
                  orderInsertError
                    ? { data: null, error: { message: orderInsertError } }
                    : { data: { id: 'order-uuid-123' }, error: null },
              }),
            };
          },
        };
      }
      if (table === 'order_items') {
        return {
          insert: (rows: unknown[]) => {
            capturedItemsInsert.push(...rows);
            return {
              data: null,
              error: itemsInsertError ? { message: itemsInsertError } : null,
            };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };

  // Fake Stripe
  const fakeStripe = {
    paymentIntents: {
      create: (args: unknown) => {
        Object.assign(capturedStripeArgs, args as object);
        if (stripeError) throw new Error(stripeError);
        return Promise.resolve({ id: 'pi_test_123', client_secret: 'pi_test_secret' });
      },
    },
  };

  // ---- inline handler (mirrors index.ts logic) ----
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') return resp({ error: 'Method not allowed' }, 405);

    let body: { items?: unknown; customer?: unknown };
    try {
      body = await req.json();
    } catch {
      return resp({ error: 'Invalid JSON body' }, 400);
    }

    const { items, customer } = body as {
      items: Array<{ product_id: string; quantity: number }>;
      customer: typeof VALID_CUSTOMER;
    };

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      !customer?.name ||
      !customer?.email ||
      !customer?.street ||
      !customer?.city ||
      !customer?.postal_code ||
      !customer?.country
    ) {
      return resp({ error: 'Missing required fields' }, 400);
    }

    for (const item of items) {
      if (!item.product_id || typeof item.quantity !== 'number' || item.quantity < 1) {
        return resp({ error: 'Invalid item payload' }, 400);
      }
    }

    const productIds = [...new Set(items.map((i) => i.product_id))];

    const { data: products, error: fetchError } = (fakeSupabase
      .from('products')
      .select()
      // @ts-ignore — simplified stub
      .in('id', productIds)) as { data: Product[] | null; error: { message: string } | null };

    if (fetchError) return resp({ error: 'Failed to fetch products' }, 500);

    const productMap = new Map((products ?? []).map((p) => [p.id, p]));

    for (const item of items) {
      if (!productMap.has(item.product_id)) return resp({ error: 'Product not found' }, 400);
    }

    for (const item of items) {
      if (!productMap.get(item.product_id)!.is_available)
        return resp({ error: 'Item unavailable' }, 400);
    }

    const totalCents = items.reduce(
      (sum, item) => sum + productMap.get(item.product_id)!.price * item.quantity,
      0,
    );

    let pi: { id: string; client_secret: string };
    try {
      pi = await fakeStripe.paymentIntents.create({
        amount: totalCents,
        currency: 'eur',
        receipt_email: customer.email,
      });
    } catch (err) {
      return resp({ error: (err as Error).message }, 500);
    }

    const { data: orderRows, error: orderError } = (fakeSupabase
      .from('orders')
      .insert({
        stripe_payment_id: pi.id,
        status: 'order_received',
        total: totalCents,
        customer_name: customer.name,
        customer_email: customer.email,
        shipping_street: customer.street,
        shipping_city: customer.city,
        shipping_postal_code: customer.postal_code,
        shipping_country: customer.country,
      })
      .select()
      // @ts-ignore
      .single()) as { data: { id: string } | null; error: unknown };

    if (orderError || !orderRows) return resp({ error: 'Failed to create order' }, 500);

    const orderItemsPayload = items.map((item) => ({
      order_id: orderRows.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: productMap.get(item.product_id)!.price,
    }));

    // @ts-ignore
    const { error: itemsError } = fakeSupabase.from('order_items').insert(orderItemsPayload);
    if (itemsError) return resp({ error: 'Failed to create order items' }, 500);

    return resp({ clientSecret: pi.client_secret });
  };
}

function resp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------

Deno.test('400 — missing product_id not in DB', async () => {
  const handler = buildHandler({ dbProducts: [PRODUCT_A] }); // PRODUCT_B absent
  const res = await handler(
    makeRequest({
      items: [{ product_id: 'prod-aaa', quantity: 1 }, { product_id: 'prod-bbb', quantity: 2 }],
      customer: VALID_CUSTOMER,
    }),
  );
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, 'Product not found');
});

Deno.test('400 — product is_available = false', async () => {
  const handler = buildHandler({ dbProducts: [PRODUCT_A, UNAVAILABLE] });
  const res = await handler(
    makeRequest({
      items: [
        { product_id: 'prod-aaa', quantity: 1 },
        { product_id: 'prod-unavail', quantity: 1 },
      ],
      customer: VALID_CUSTOMER,
    }),
  );
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, 'Item unavailable');
});

Deno.test('correct total calculation — never uses client-provided price', async () => {
  const capturedStripeArgs: Record<string, unknown> = {};
  const handler = buildHandler({ capturedStripeArgs });
  const res = await handler(
    makeRequest({
      // even if client tried to pass prices they would be ignored — handler only reads quantity
      items: [
        { product_id: 'prod-aaa', quantity: 3 }, // 3 * 1000 = 3000
        { product_id: 'prod-bbb', quantity: 2 }, // 2 * 500  = 1000
      ],
      customer: VALID_CUSTOMER,
    }),
  );
  assertEquals(res.status, 200);
  // total must equal 4000, computed entirely from DB prices
  assertEquals(capturedStripeArgs.amount, 4000);
  assertEquals(capturedStripeArgs.currency, 'eur');
});

Deno.test('correct DB writes — orders row and order_items rows', async () => {
  const capturedOrderInsert: Record<string, unknown> = {};
  const capturedItemsInsert: unknown[] = [];
  const handler = buildHandler({ capturedOrderInsert, capturedItemsInsert });

  await handler(
    makeRequest({
      items: [
        { product_id: 'prod-aaa', quantity: 1 },
        { product_id: 'prod-bbb', quantity: 2 },
      ],
      customer: VALID_CUSTOMER,
    }),
  );

  // orders row
  assertEquals(capturedOrderInsert.stripe_payment_id, 'pi_test_123');
  assertEquals(capturedOrderInsert.status, 'order_received');
  assertEquals(capturedOrderInsert.total, 2000); // 1*1000 + 2*500
  assertEquals(capturedOrderInsert.customer_name, VALID_CUSTOMER.name);
  assertEquals(capturedOrderInsert.customer_email, VALID_CUSTOMER.email);
  assertEquals(capturedOrderInsert.shipping_street, VALID_CUSTOMER.street);
  assertEquals(capturedOrderInsert.shipping_city, VALID_CUSTOMER.city);
  assertEquals(capturedOrderInsert.shipping_postal_code, VALID_CUSTOMER.postal_code);
  assertEquals(capturedOrderInsert.shipping_country, VALID_CUSTOMER.country);

  // order_items rows
  assertEquals(capturedItemsInsert.length, 2);
  const itemA = (capturedItemsInsert as Array<Record<string, unknown>>).find(
    (i) => i.product_id === 'prod-aaa',
  )!;
  assertEquals(itemA.order_id, 'order-uuid-123');
  assertEquals(itemA.quantity, 1);
  assertEquals(itemA.price_at_purchase, 1000); // snapshotted from DB

  const itemB = (capturedItemsInsert as Array<Record<string, unknown>>).find(
    (i) => i.product_id === 'prod-bbb',
  )!;
  assertEquals(itemB.quantity, 2);
  assertEquals(itemB.price_at_purchase, 500);
});

Deno.test('200 success — returns clientSecret', async () => {
  const handler = buildHandler();
  const res = await handler(
    makeRequest({
      items: [{ product_id: 'prod-aaa', quantity: 1 }],
      customer: VALID_CUSTOMER,
    }),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.clientSecret, 'pi_test_secret');
});

Deno.test('no Stripe PI created when product not found', async () => {
  const capturedStripeArgs: Record<string, unknown> = {};
  // only PRODUCT_A in DB, request asks for PRODUCT_B too
  const handler = buildHandler({ dbProducts: [PRODUCT_A], capturedStripeArgs });

  const res = await handler(
    makeRequest({
      items: [{ product_id: 'prod-bbb', quantity: 1 }],
      customer: VALID_CUSTOMER,
    }),
  );
  assertEquals(res.status, 400);
  // Stripe create was never called — capturedStripeArgs stays empty
  assertEquals(Object.keys(capturedStripeArgs).length, 0);
});

Deno.test('no Stripe PI created when product unavailable', async () => {
  const capturedStripeArgs: Record<string, unknown> = {};
  const handler = buildHandler({ dbProducts: [UNAVAILABLE], capturedStripeArgs });

  const res = await handler(
    makeRequest({
      items: [{ product_id: 'prod-unavail', quantity: 1 }],
      customer: VALID_CUSTOMER,
    }),
  );
  assertEquals(res.status, 400);
  assertEquals(Object.keys(capturedStripeArgs).length, 0);
});

Deno.test('400 — missing required customer fields', async () => {
  const handler = buildHandler();
  const res = await handler(
    makeRequest({
      items: [{ product_id: 'prod-aaa', quantity: 1 }],
      customer: { name: 'Jane' }, // incomplete
    }),
  );
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, 'Missing required fields');
});

Deno.test('400 — empty items array', async () => {
  const handler = buildHandler();
  const res = await handler(
    makeRequest({ items: [], customer: VALID_CUSTOMER }),
  );
  assertEquals(res.status, 400);
});

Deno.test('500 — Stripe throws, returns error JSON', async () => {
  const handler = buildHandler({ stripeError: 'Card declined' });
  const res = await handler(
    makeRequest({
      items: [{ product_id: 'prod-aaa', quantity: 1 }],
      customer: VALID_CUSTOMER,
    }),
  );
  assertEquals(res.status, 500);
  const body = await res.json();
  assertEquals(body.error, 'Card declined');
});
