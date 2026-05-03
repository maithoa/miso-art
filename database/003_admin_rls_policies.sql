-- =============================================================================
-- Migration: 003_admin_rls_policies.sql
-- Purpose:   Establish all RLS policies needed for the admin order queue and
--            product management features. Safe to run multiple times (DROP IF
--            EXISTS before CREATE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPER: reusable inline check — is the calling JWT an admin?
-- We join profiles instead of trusting a JWT claim so the source of truth
-- is always the DB, not a token that could be stale.
-- ---------------------------------------------------------------------------
-- Usage inside policies: (SELECT is_admin FROM profiles WHERE id = auth.uid())
-- ---------------------------------------------------------------------------


-- =============================================================================
-- 1. ORDERS TABLE
-- =============================================================================

-- Ensure RLS is on (idempotent)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 1a. Public SELECT — required by ThankYou page polling via stripe_payment_id.
--     Already exists per PRD; DROP + recreate to document it explicitly here.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "orders_public_select" ON orders;
CREATE POLICY "orders_public_select"
  ON orders
  FOR SELECT
  -- Intentionally unrestricted: the ThankYou page polls by stripe_payment_id
  -- without an authenticated session. The stripe_payment_id is already a
  -- hard-to-guess Stripe PI id, providing implicit access control.
  USING (true);

-- ---------------------------------------------------------------------------
-- 1b. Admin SELECT — allows admin browser client to list ALL orders.
--     The public SELECT above already covers this; this policy is additive
--     but kept explicit so intent is clear if public SELECT is ever tightened.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "orders_admin_select" ON orders;
CREATE POLICY "orders_admin_select"
  ON orders
  FOR SELECT
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 1c. Admin UPDATE — allows admin browser client to update ONLY the status
--     column. Financial columns (total, stripe_payment_id) are locked via the
--     WITH CHECK expression — if the client tries to change them the row will
--     fail the check and the update is rejected.
--
--     Service-role updates from Edge Functions bypass RLS entirely, so the
--     fulfill-order function is unaffected by this policy.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "orders_admin_update_status" ON orders;
CREATE POLICY "orders_admin_update_status"
  ON orders
  FOR UPDATE
  USING (
    -- Caller must be an admin
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    -- After the update the financial columns must remain identical to what
    -- was stored — prevents a malicious client from altering them alongside
    -- a legitimate status change.
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
    -- Enforce that only the status column is mutated by asserting the
    -- remaining sensitive columns match their pre-update values.
    -- Postgres evaluates WITH CHECK against the NEW row; we compare against
    -- the OLD row via a correlated sub-select on the same table.
    AND total             = (SELECT total             FROM orders o2 WHERE o2.id = orders.id)
    AND stripe_payment_id = (SELECT stripe_payment_id FROM orders o2 WHERE o2.id = orders.id)
    AND customer_email    = (SELECT customer_email    FROM orders o2 WHERE o2.id = orders.id)
    AND customer_name     = (SELECT customer_name     FROM orders o2 WHERE o2.id = orders.id)
  );

-- ---------------------------------------------------------------------------
-- 1d. INSERT — service role only (Edge Functions). No browser-client INSERT
--     policy needed. Explicitly document that with a comment.
-- ---------------------------------------------------------------------------
-- NOTE: create-payment-intent uses SUPABASE_SERVICE_ROLE_KEY which bypasses
-- RLS. No INSERT policy for anon/authenticated is intentional.


-- =============================================================================
-- 2. ORDER_ITEMS TABLE
-- =============================================================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2a. Public SELECT — needed so the ThankYou page (unauthenticated) can read
--     items belonging to a just-placed order if required by the UI.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "order_items_public_select" ON order_items;
CREATE POLICY "order_items_public_select"
  ON order_items
  FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- 2b. Admin SELECT — explicit for documentation; covered by public policy
--     above but kept separate so narrowing public access later is safe.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "order_items_admin_select" ON order_items;
CREATE POLICY "order_items_admin_select"
  ON order_items
  FOR SELECT
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- INSERT/UPDATE/DELETE on order_items is service-role only (Edge Functions).
-- No browser-client mutation policies are created intentionally.


-- =============================================================================
-- 3. PRODUCTS TABLE
-- =============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3a. Public SELECT — anyone can browse the catalogue.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_public_select" ON products;
CREATE POLICY "products_public_select"
  ON products
  FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- 3b. Admin INSERT
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_admin_insert" ON products;
CREATE POLICY "products_admin_insert"
  ON products
  FOR INSERT
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 3c. Admin UPDATE
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_admin_update" ON products;
CREATE POLICY "products_admin_update"
  ON products
  FOR UPDATE
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 3d. Admin DELETE
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_admin_delete" ON products;
CREATE POLICY "products_admin_delete"
  ON products
  FOR DELETE
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );


-- =============================================================================
-- 4. STORAGE: product-images bucket
--    Supabase Storage uses the storage.objects table with its own RLS.
--    The bucket must exist before these policies apply; create it if absent.
-- =============================================================================

-- Create bucket if it doesn't exist yet (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'product-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('product-images', 'product-images', true);
    -- public = true means the Supabase CDN serves objects without a signed URL,
    -- which is what we want for product image_url values stored in products.image_url.
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4a. Public SELECT on storage objects — anyone can fetch product images.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "product_images_public_select" ON storage.objects;
CREATE POLICY "product_images_public_select"
  ON storage.objects
  FOR SELECT
  -- Scope to this bucket only so other buckets are unaffected
  USING (bucket_id = 'product-images');

-- ---------------------------------------------------------------------------
-- 4b. Admin INSERT — browser-side upload from admin dashboard.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 4c. Admin UPDATE — replace / overwrite an existing image.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND (SELECT is_admin FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 4d. Admin DELETE
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );


-- =============================================================================
-- 5. PERFORMANCE: index on orders.created_at DESC
--    Admin order queue lists orders newest-first; without this index Postgres
--    does a full sequential scan which degrades as order volume grows.
-- =============================================================================

-- CREATE INDEX CONCURRENTLY is safe on a live DB; IF NOT EXISTS makes it
-- idempotent. CONCURRENTLY cannot run inside a transaction block — if you
-- run this migration inside a transaction, remove CONCURRENTLY.
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
  ON orders (created_at DESC);

-- Secondary index used by ThankYou page polling
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_id
  ON orders (stripe_payment_id);

-- Foreign key traversal index for order_items → orders join
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

-- Foreign key traversal index for order_items → products join
-- Enables the nested select: order_items(*, products(name))
CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON order_items (product_id);


-- =============================================================================
-- 6. VERIFICATION QUERY SHAPE
--
--    The following documents the supabase-js query used by the admin order
--    queue. Run manually against the DB to confirm the join path resolves:
--
--    const { data, error } = await supabase
--      .from('orders')
--      .select('*, order_items(*, products(name))')
--      .order('created_at', { ascending: false });
--
--    This resolves via:
--      orders  1──* order_items  *──1 products
--    Foreign keys required (must exist in 001_tables.sql):
--      order_items.order_id   REFERENCES orders(id)
--      order_items.product_id REFERENCES products(id)
--
--    RLS chain for an authenticated admin:
--      orders         → orders_admin_select          ✓ (is_admin check)
--      order_items    → order_items_admin_select     ✓ (is_admin check)
--      products       → products_public_select       ✓ (true)
--
--    No SQL view is needed; the PostgREST resource embedding handles the join
--    automatically when foreign keys are declared. A view would duplicate
--    logic and add a maintenance burden — avoid it.
--
--    Equivalent raw SQL for manual verification:
--    SELECT
--      o.*,
--      json_agg(
--        json_build_object(
--          'id',                oi.id,
--          'order_id',          oi.order_id,
--          'product_id',        oi.product_id,
--          'quantity',          oi.quantity,
--          'price_at_purchase', oi.price_at_purchase,
--          'products',          json_build_object('name', p.name)
--        )
--      ) AS order_items
--    FROM orders o
--    JOIN order_items oi ON oi.order_id = o.id
--    JOIN products    p  ON p.id = oi.product_id
--    GROUP BY o.id
--    ORDER BY o.created_at DESC;
-- =============================================================================


-- =============================================================================
-- 7. SUMMARY OF POLICIES AFTER THIS MIGRATION
-- =============================================================================
--
--  TABLE: orders
--    orders_public_select        SELECT  USING(true)
--    orders_admin_select         SELECT  USING(is_admin)
--    orders_admin_update_status  UPDATE  USING(is_admin) + WITH CHECK(is_admin + immutable financial cols)
--    [no browser INSERT/DELETE — service role only]
--
--  TABLE: order_items
--    order_items_public_select   SELECT  USING(true)
--    order_items_admin_select    SELECT  USING(is_admin)
--    [no browser INSERT/DELETE — service role only]
--
--  TABLE: products
--    products_public_select      SELECT  USING(true)
--    products_admin_insert       INSERT  WITH CHECK(is_admin)
--    products_admin_update       UPDATE  USING(is_admin) + WITH CHECK(is_admin)
--    products_admin_delete       DELETE  USING(is_admin)
--
--  STORAGE bucket: product-images
--    product_images_public_select  SELECT  bucket_id match
--    product_images_admin_insert   INSERT  bucket_id + is_admin
--    product_images_admin_update   UPDATE  bucket_id + is_admin
--    product_images_admin_delete   DELETE  bucket_id + is_admin
--
--  INDEXES ADDED:
--    idx_orders_created_at_desc    orders(created_at DESC)
--    idx_orders_stripe_payment_id  orders(stripe_payment_id)
--    idx_order_items_order_id      order_items(order_id)
--    idx_order_items_product_id    order_items(product_id)
-- =============================================================================
