import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno';

type CartItem = {
  product_id: string;
  quantity: number;
};

type CustomerPayload = {
  name: string;
  email: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
};

type CreatePaymentIntentRequest = {
  items: CartItem[];
  customer: CustomerPayload;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // --- parse & basic shape validation ---
  let body: CreatePaymentIntentRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { items, customer } = body;

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
    return json({ error: 'Missing required fields' }, 400);
  }

  for (const item of items) {
    if (!item.product_id || typeof item.quantity !== 'number' || item.quantity < 1) {
      return json({ error: 'Invalid item payload' }, 400);
    }
  }

  // --- init clients (using service role — bypasses RLS for reads & writes) ---
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
    // Deno-compatible fetch — avoids Node http issues
    httpClient: Stripe.createFetchHttpClient(),
  });

  // --- (1) fetch products referenced in the cart in one query ---
  const productIds = [...new Set(items.map((i) => i.product_id))];

  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, price, is_available')
    .in('id', productIds);

  if (fetchError) {
    return json({ error: 'Failed to fetch products' }, 500);
  }

  const productMap = new Map(
    (products ?? []).map((p: { id: string; price: number; is_available: boolean }) => [p.id, p]),
  );

  // --- (2) missing product check ---
  for (const item of items) {
    if (!productMap.has(item.product_id)) {
      return json({ error: 'Product not found' }, 400);
    }
  }

  // --- (3) availability check ---
  for (const item of items) {
    const product = productMap.get(item.product_id)!;
    if (!product.is_available) {
      return json({ error: 'Item unavailable' }, 400);
    }
  }

  // --- (4) calculate total from DB prices only — never trust client ---
  const totalCents = items.reduce((sum, item) => {
    const product = productMap.get(item.product_id)!;
    return sum + product.price * item.quantity;
  }, 0);

  // --- (5) create Stripe PaymentIntent — only reached after all validation passes ---
  let pi: Stripe.PaymentIntent;
  try {
    pi = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'eur',
      // attach email so Stripe receipt emails work out of the box
      receipt_email: customer.email,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    return json({ error: message }, 500);
  }

  // --- (6) insert order row ---
  const { data: orderRows, error: orderError } = await supabase
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
    // return the generated id so we can link order_items
    .select('id')
    .single();

  if (orderError || !orderRows) {
    // PI already created — record the orphaned PI id in the error log so ops can reconcile
    console.error('Order insert failed; orphaned PI:', pi.id, orderError);
    return json({ error: 'Failed to create order' }, 500);
  }

  const orderId: string = orderRows.id;

  // --- (7) insert order_items rows ---
  const orderItemsPayload = items.map((item) => ({
    order_id: orderId,
    product_id: item.product_id,
    quantity: item.quantity,
    // snapshot price at purchase time — product price may change later
    price_at_purchase: productMap.get(item.product_id)!.price,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);

  if (itemsError) {
    console.error('order_items insert failed; order:', orderId, itemsError);
    return json({ error: 'Failed to create order items' }, 500);
  }

  // --- (8) return clientSecret to the frontend ---
  return json({ clientSecret: pi.client_secret });
});
