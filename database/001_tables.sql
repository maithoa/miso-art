-- ============================================================
-- STEP 1: Tables
-- Run this first in the Supabase SQL editor
-- ============================================================

-- Products
CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  price        INTEGER NOT NULL,           -- cents, e.g. 1200 = €12.00
  image_url    TEXT,
  tags         TEXT[] DEFAULT '{}',        -- e.g. {"birthday","watercolor","blue"}
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_id   TEXT NOT NULL,
  total               INTEGER NOT NULL,    -- cents
  status              TEXT NOT NULL DEFAULT 'order_received'
                      CHECK (status IN (
                        'order_received',
                        'payment_confirmed',
                        'order_confirmed',
                        'sent',
                        'cancelled'
                      )),
  customer_name       TEXT NOT NULL,
  customer_email      TEXT NOT NULL,
  shipping_street     TEXT NOT NULL,
  shipping_city       TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country    TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order items
CREATE TABLE order_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id),
  product_id          UUID NOT NULL REFERENCES products(id),
  quantity            INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase   INTEGER NOT NULL    -- cents, snapshot at time of order
);

-- Seasonal banners
CREATE TABLE seasonal_banners (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  image_url  TEXT,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT true
);

-- Profiles (linked to Supabase Auth users)
CREATE TABLE profiles (
  id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false
);

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, is_admin)
  VALUES (NEW.id, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
