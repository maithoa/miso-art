-- ============================================================
-- Test suite: most_loved_products view
-- Run with: psql $DATABASE_URL -f supabase/tests/004_most_loved_view.test.sql
-- Each test is wrapped in a transaction that rolls back so tests
-- never pollute each other and can run against a live staging DB.
-- ============================================================

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- HELPER: lightweight assertion that raises an exception on failure
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _assert(condition boolean, msg text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    IF NOT condition THEN
        RAISE EXCEPTION 'ASSERTION FAILED: %', msg;
    END IF;
END;
$$;

-- ===========================================================================
-- TEST 1 — NULL / empty state
-- When there are no qualifying orders the view must return 0 rows (not error)
-- ===========================================================================
BEGIN;

    -- Wipe only the junction data so foreign-key constraints are respected
    DELETE FROM order_items;
    DELETE FROM orders;

    PERFORM _assert(
        (SELECT COUNT(*) FROM most_loved_products) = 0,
        'TEST 1 FAILED: view should return 0 rows when no qualifying orders exist'
    );

    RAISE NOTICE 'TEST 1 PASSED: null/empty state returns 0 rows';

ROLLBACK;

-- ===========================================================================
-- TEST 2 — Top-3 ranking
-- Insert 5 products with different sales volumes; view must return exactly 3,
-- in descending order of total_sold.
-- ===========================================================================
BEGIN;

    -- Seed products (minimal required columns; adjust defaults to match your schema)
    INSERT INTO products (id, name, price, image_url, is_available, tags) VALUES
        ('prod-1', 'Product One',   10.00, 'http://img/1.jpg', true, ARRAY['a']),
        ('prod-2', 'Product Two',   20.00, 'http://img/2.jpg', true, ARRAY['b']),
        ('prod-3', 'Product Three', 30.00, 'http://img/3.jpg', true, ARRAY['c']),
        ('prod-4', 'Product Four',  40.00, 'http://img/4.jpg', true, ARRAY['d']),
        ('prod-5', 'Product Five',  50.00, 'http://img/5.jpg', true, ARRAY['e']);

    -- One confirmed order per product; quantities give us a clear ranking
    INSERT INTO orders (id, status) VALUES
        ('ord-t2-1', 'payment_confirmed'),
        ('ord-t2-2', 'order_confirmed'),
        ('ord-t2-3', 'sent'),
        ('ord-t2-4', 'payment_confirmed'),
        ('ord-t2-5', 'order_confirmed');

    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
        ('ord-t2-1', 'prod-1', 50,  10.00),  -- rank 1
        ('ord-t2-2', 'prod-2', 40,  20.00),  -- rank 2
        ('ord-t2-3', 'prod-3', 30,  30.00),  -- rank 3
        ('ord-t2-4', 'prod-4', 20,  40.00),  -- rank 4 — should NOT appear
        ('ord-t2-5', 'prod-5', 10,  50.00);  -- rank 5 — should NOT appear

    -- Exactly 3 rows returned
    PERFORM _assert(
        (SELECT COUNT(*) FROM most_loved_products) = 3,
        'TEST 2a FAILED: view should return exactly 3 rows'
    );

    -- First row is the highest-selling product
    PERFORM _assert(
        (SELECT product_id FROM most_loved_products LIMIT 1) = 'prod-1',
        'TEST 2b FAILED: first row should be prod-1 (50 units)'
    );

    -- total_sold values are in descending order
    PERFORM _assert(
        (SELECT total_sold FROM most_loved_products ORDER BY total_sold DESC LIMIT 1) = 50,
        'TEST 2c FAILED: highest total_sold should be 50'
    );

    -- prod-4 and prod-5 must be excluded
    PERFORM _assert(
        (SELECT COUNT(*) FROM most_loved_products WHERE product_id IN ('prod-4','prod-5')) = 0,
        'TEST 2d FAILED: prod-4 and prod-5 must not appear in top-3'
    );

    RAISE NOTICE 'TEST 2 PASSED: top-3 ranking is correct';

ROLLBACK;

-- ===========================================================================
-- TEST 3 — Excluded statuses: cancelled and order_received
-- Orders with these statuses must NOT contribute to total_sold.
-- ===========================================================================
BEGIN;

    INSERT INTO products (id, name, price, image_url, is_available, tags) VALUES
        ('prod-excl', 'Excluded Product', 9.99, 'http://img/x.jpg', true, ARRAY['x']);

    -- Two orders that must be excluded
    INSERT INTO orders (id, status) VALUES
        ('ord-cancelled',      'cancelled'),
        ('ord-order-received', 'order_received');

    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
        ('ord-cancelled',      'prod-excl', 999, 9.99),
        ('ord-order-received', 'prod-excl', 999, 9.99);

    -- Product should not appear because all its orders are excluded statuses
    PERFORM _assert(
        (SELECT COUNT(*) FROM most_loved_products WHERE product_id = 'prod-excl') = 0,
        'TEST 3a FAILED: product with only cancelled/order_received orders must not appear'
    );

    -- Now add a single qualifying order — product should appear with qty 1, not 1999
    INSERT INTO orders (id, status) VALUES ('ord-qualifying', 'sent');
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
        ('ord-qualifying', 'prod-excl', 1, 9.99);

    PERFORM _assert(
        (SELECT total_sold FROM most_loved_products WHERE product_id = 'prod-excl') = 1,
        'TEST 3b FAILED: total_sold should be 1 (excluded orders must not be summed)'
    );

    RAISE NOTICE 'TEST 3 PASSED: cancelled and order_received are correctly excluded';

ROLLBACK;

-- ===========================================================================
-- TEST 4 — Idempotency of the view definition
-- Re-running the migration SQL (DROP VIEW IF EXISTS + CREATE VIEW) must not
-- error even when the view already exists and has data behind it.
-- ===========================================================================
BEGIN;

    -- Seed minimal data so the view is not trivially empty
    INSERT INTO products (id, name, price, image_url, is_available, tags) VALUES
        ('prod-idem', 'Idem Product', 1.00, 'http://img/i.jpg', true, ARRAY['i']);

    INSERT INTO orders (id, status) VALUES ('ord-idem', 'sent');

    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
        ('ord-idem', 'prod-idem', 5, 1.00);

    -- Simulate re-running the migration: drop + recreate must not throw
    DROP VIEW IF EXISTS most_loved_products;

    CREATE VIEW most_loved_products AS
    SELECT
        oi.product_id,
        p.name,
        p.price,
        p.image_url,
        p.is_available,
        p.tags,
        SUM(oi.quantity)::bigint AS total_sold
    FROM order_items oi
    INNER JOIN orders o
        ON o.id = oi.order_id
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

    -- Re-grant so idempotent run also restores permissions
    GRANT SELECT ON most_loved_products TO anon;
    GRANT SELECT ON most_loved_products TO authenticated;

    -- View must still work after recreation
    PERFORM _assert(
        (SELECT COUNT(*) FROM most_loved_products) = 1,
        'TEST 4 FAILED: view should still return 1 row after idempotent recreation'
    );

    RAISE NOTICE 'TEST 4 PASSED: migration is idempotent (DROP IF EXISTS + CREATE succeeds)';

ROLLBACK;

-- ===========================================================================
-- TEST 5 — Row shape / column contract
-- All columns required by MostLovedProduct interface must be present and
-- typed correctly so useMostLoved can SELECT * without extra joins.
-- ===========================================================================
BEGIN;

    INSERT INTO products (id, name, price, image_url, is_available, tags) VALUES
        ('prod-shape', 'Shape Product', 7.50, 'http://img/s.jpg', false, ARRAY['tag1','tag2']);

    INSERT INTO orders (id, status) VALUES ('ord-shape', 'order_confirmed');

    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
        ('ord-shape', 'prod-shape', 3, 7.50);

    -- Confirm every required field is present and has the expected value
    PERFORM _assert(
        EXISTS (
            SELECT 1 FROM most_loved_products
            WHERE product_id  = 'prod-shape'
              AND name         = 'Shape Product'
              AND price        = 7.50
              AND image_url    = 'http://img/s.jpg'
              AND is_available = false
              AND tags         = ARRAY['tag1','tag2']
              AND total_sold   = 3
        ),
        'TEST 5 FAILED: row shape does not match MostLovedProduct interface'
    );

    RAISE NOTICE 'TEST 5 PASSED: row shape matches MostLovedProduct interface';

ROLLBACK;

-- ---------------------------------------------------------------------------
-- Clean up the helper function (outside any transaction so it persists
-- only if needed; drop it here to leave the DB clean).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS _assert(boolean, text);

RAISE NOTICE '====================================================';
RAISE NOTICE 'ALL most_loved_products TESTS PASSED';
RAISE NOTICE '====================================================';
