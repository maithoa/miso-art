-- 004_seed_extended.sql
-- Extended product seed: 20 handmade postcard products
-- Idempotent via explicit UUIDs + ON CONFLICT (id) DO NOTHING

INSERT INTO products (id, name, description, price, image_url, tags, is_available, created_at)
VALUES
  (
    'a1000001-seed-4004-8000-000000000001',
    'Watercolour Coastal Sunrise',
    'Hand-painted watercolour postcard capturing a soft pastel sunrise over calm coastal waters. Each piece is unique with natural pigment blooms.',
    850,
    'https://picsum.photos/seed/101/400/300',
    ARRAY['watercolour', 'travel', 'coastal', 'sunrise'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000002',
    'Ink & Wash Mountain Trail',
    'Bold ink linework with a delicate watercolour wash — a winding mountain trail disappearing into the mist. Great for hikers and dreamers.',
    950,
    'https://picsum.photos/seed/102/400/300',
    ARRAY['ink', 'travel', 'mountains', 'landscape'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000003',
    'Botanical Fern Study',
    'Detailed botanical illustration of native ferns rendered in fine ink. Ideal for plant lovers and nature enthusiasts.',
    750,
    'https://picsum.photos/seed/103/400/300',
    ARRAY['botanical', 'ink', 'nature', 'plants'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000004',
    'Happy Birthday Floral Wreath',
    'Cheerful hand-lettered birthday greeting surrounded by a watercolour floral wreath in pinks and yellows. A heartfelt card for any age.',
    600,
    'https://picsum.photos/seed/104/400/300',
    ARRAY['birthday', 'watercolour', 'floral', 'greeting'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000005',
    'Paris Rooftop Skyline',
    'Intricate ink cityscape of Parisian rooftops at dusk, with the Eiffel Tower silhouetted against a warm watercolour sky.',
    1100,
    'https://picsum.photos/seed/105/400/300',
    ARRAY['cities', 'ink', 'travel', 'architecture'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000006',
    'Autumn Leaves Abstract',
    'Loose abstract composition of falling autumn leaves in burnt orange, ochre and crimson watercolour. Evokes the feeling of a crisp October walk.',
    800,
    'https://picsum.photos/seed/106/400/300',
    ARRAY['abstract', 'seasonal', 'watercolour', 'autumn'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000007',
    'Sleeping Fox Illustration',
    'Charming ink and watercolour illustration of a curled-up sleeping fox nestled among autumn leaves. A favourite for animal lovers.',
    900,
    'https://picsum.photos/seed/107/400/300',
    ARRAY['animals', 'watercolour', 'ink', 'woodland'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000008',
    'Winter Solstice Pine Forest',
    'Moody ink drawing of snow-laden pine trees under a deep blue winter sky dusted with hand-stamped gold stars.',
    1050,
    'https://picsum.photos/seed/108/400/300',
    ARRAY['seasonal', 'ink', 'winter', 'nature'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000009',
    'Tokyo at Night',
    'Vibrant ink cityscape of a rain-slicked Tokyo street at night, neon reflections rendered in layered watercolour washes.',
    1250,
    'https://picsum.photos/seed/109/400/300',
    ARRAY['cities', 'travel', 'ink', 'watercolour'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000010',
    'Abstract Ocean Tides',
    'Fluid abstract washes of turquoise, navy and white suggesting rolling ocean tides. Minimal and meditative — perfect for any wall.',
    700,
    'https://picsum.photos/seed/110/400/300',
    ARRAY['abstract', 'watercolour', 'coastal', 'minimal'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000011',
    'Botanical Wildflower Meadow',
    'A riot of hand-painted wildflowers — poppies, cornflowers, ox-eye daisies — in loose watercolour style. Summer in an envelope.',
    850,
    'https://picsum.photos/seed/111/400/300',
    ARRAY['botanical', 'watercolour', 'floral', 'seasonal'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000012',
    'Birthday Balloon Bear',
    'Whimsical ink illustration of a small bear clutching a bunch of watercolour balloons. Brings a smile guaranteed.',
    550,
    'https://picsum.photos/seed/112/400/300',
    ARRAY['birthday', 'animals', 'ink', 'whimsical'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000013',
    'New York Brownstones',
    'Detailed ink study of a row of classic New York brownstone facades, with subtle watercolour tints on the brick and sky.',
    1150,
    'https://picsum.photos/seed/113/400/300',
    ARRAY['cities', 'ink', 'architecture', 'travel'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000014',
    'Spring Cherry Blossom Branch',
    'Delicate watercolour rendering of a cherry blossom branch in full bloom, petals drifting across a soft cream background.',
    750,
    'https://picsum.photos/seed/114/400/300',
    ARRAY['botanical', 'seasonal', 'watercolour', 'spring'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000015',
    'Humpback Whale Deep Dive',
    'Sweeping watercolour study of a humpback whale descending into dark blue depths. Dramatic and serene in equal measure.',
    1800,
    'https://picsum.photos/seed/115/400/300',
    ARRAY['animals', 'watercolour', 'coastal', 'ocean'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000016',
    'Abstract Ink Blot Garden',
    'Experimental ink blot technique transformed into an abstract garden scene. No two prints ever look identical — truly one of a kind.',
    400,
    'https://picsum.photos/seed/116/400/300',
    ARRAY['abstract', 'ink', 'experimental'],
    -- Marked unavailable: limited run sold out, kept for catalogue reference
    false,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000017',
    'Vintage Travel Luggage Tags',
    'Collage-style postcard featuring hand-drawn vintage-style luggage tags and stamps from imaginary destinations. Wanderlust guaranteed.',
    950,
    'https://picsum.photos/seed/117/400/300',
    ARRAY['travel', 'ink', 'vintage', 'whimsical'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000018',
    'Christmas Eve Village',
    'Warm ink and watercolour scene of a snow-covered village at Christmas Eve, candlelit windows glowing against a deep indigo sky.',
    1200,
    'https://picsum.photos/seed/118/400/300',
    ARRAY['seasonal', 'ink', 'watercolour', 'winter'],
    -- Marked unavailable: seasonal item out of stock until next winter run
    false,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000019',
    'Barn Owl Portrait',
    'Striking close-up ink portrait of a barn owl with softly layered feather detail and piercing watercolour eyes. Framing-worthy.',
    1350,
    'https://picsum.photos/seed/119/400/300',
    ARRAY['animals', 'ink', 'portrait', 'woodland'],
    true,
    now()
  ),
  (
    'a1000001-seed-4004-8000-000000000020',
    'Lisbon Tram & Tiles',
    'Sun-bleached watercolour postcard of a Lisbon tram rattling past a wall of hand-painted azulejo tiles. Travel and colour in harmony.',
    1000,
    'https://picsum.photos/seed/120/400/300',
    ARRAY['cities', 'travel', 'watercolour', 'architecture'],
    true,
    now()
  )
ON CONFLICT (id) DO NOTHING;
