-- ============================================================
-- STEP 3: Seed data (development only)
-- Run this after 002_rls.sql
-- Gives you 3 products to test the gallery with
-- ============================================================

INSERT INTO products (name, description, price, tags, is_available) VALUES
  (
    'Sunrise Over Kyoto',
    'A warm watercolour postcard capturing the first light over Kyoto rooftops.',
    1200,
    ARRAY['watercolor', 'japan', 'landscape', 'warm tones'],
    true
  ),
  (
    'Happy Birthday Blooms',
    'Hand-illustrated wildflowers in a loose, joyful style. Perfect for birthdays.',
    950,
    ARRAY['birthday', 'illustration', 'flowers', 'colorful'],
    true
  ),
  (
    'Midnight Blue Abstract',
    'A premium-feel abstract piece in deep navy and gold ink. Limited feel.',
    1500,
    ARRAY['abstract', 'blue', 'premium feel', 'gold', 'modern'],
    true
  );
