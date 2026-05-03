-- ============================================================
-- STEP 2: Row Level Security
-- Run this after 001_tables.sql
-- ============================================================

-- Helper: returns true if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ---- products ------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can browse products (gallery page, anon shoppers)
CREATE POLICY "products_public_select" ON products
  FOR SELECT USING (true);

-- Only admins can create/edit/delete products
CREATE POLICY "products_admin_insert" ON products
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "products_admin_update" ON products
  FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "products_admin_delete" ON products
  FOR DELETE TO authenticated USING (is_admin());

-- ---- orders --------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public SELECT so the ThankYou page can poll for payment_confirmed
-- (stripe_payment_id values are unguessable, so this is safe for MVP)
CREATE POLICY "orders_public_select" ON orders
  FOR SELECT USING (true);

-- No INSERT/UPDATE from browser — Edge Functions use service role key
-- which bypasses RLS entirely. No policy needed here.

-- ---- order_items ---------------------------------------------
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admin) can view order items for the order detail page
CREATE POLICY "order_items_authenticated_select" ON order_items
  FOR SELECT TO authenticated USING (true);

-- No INSERT/UPDATE from browser — Edge Functions use service role key

-- ---- seasonal_banners ----------------------------------------
ALTER TABLE seasonal_banners ENABLE ROW LEVEL SECURITY;

-- Anyone can read banners (gallery page)
CREATE POLICY "banners_public_select" ON seasonal_banners
  FOR SELECT USING (true);

-- Only admins can manage banners
CREATE POLICY "banners_admin_insert" ON seasonal_banners
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "banners_admin_update" ON seasonal_banners
  FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "banners_admin_delete" ON seasonal_banners
  FOR DELETE TO authenticated USING (is_admin());

-- ---- profiles ------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile row (used by AdminRoute to check is_admin)
CREATE POLICY "profiles_own_select" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
