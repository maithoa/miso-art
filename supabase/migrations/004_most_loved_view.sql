-- Migration: 004_most_loved_view.sql
-- Creates the most_loved_products view aggregating top-3 products by units sold
-- Only statuses that represent real revenue are counted (not order_received or cancelled)

-- Drop view first so this migration is idempotent (safe to re-run)
DROP VIEW IF EXISTS most_loved_products;

CREATE VIEW most_loved_products AS
SELECT
    oi.product_id,
    p.name,
    p.price,
    p.image_url,
    p.is_available,
    p.tags,
    SUM(oi.quantity)::bigint AS total_sold  -- cast so the type is stable across Postgres versions
FROM order_items oi
INNER JOIN orders o
    ON o.id = oi.order_id
    -- Only count orders that have confirmed payment or are in fulfilment/sent
    AND o.status IN ('payment_confirmed', 'order_confirmed', 'sent')
INNER JOIN products p
    ON p.id = oi.product_id
GROUP BY
    oi.product_id,
    p.name,
    p.price,
    p.image_url,
    p.is_available,
    p.tags
ORDER BY total_sold DESC
LIMIT 3;

-- Expose the view to the anon role (unauthenticated / public API calls)
GRANT SELECT ON most_loved_products TO anon;

-- Expose the view to the authenticated role (logged-in users)
GRANT SELECT ON most_loved_products TO authenticated;
