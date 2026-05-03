-- Migration: 002_seasonal_banners
-- Creates seasonal_banners table with RLS policies matching the pattern
-- established in 001_tables.sql (profiles.is_admin check via auth.uid() join)

-- ─────────────────────────────────────────────
-- TABLE
-- ─────────────────────────────────────────────
create table if not exists public.seasonal_banners (
  id         uuid primary key default gen_random_uuid(),
  title      text        not null,
  image_url  text        not null,
  start_date date        not null,
  end_date   date        not null,
  active     boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Guard against inverted date ranges at the DB level
  constraint end_after_start check (end_date >= start_date)
);

-- Keep updated_at current automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Only create the trigger if it doesn't already exist
do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_seasonal_banners_updated_at'
  ) then
    create trigger trg_seasonal_banners_updated_at
      before update on public.seasonal_banners
      for each row execute procedure public.set_updated_at();
  end if;
end $$;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table public.seasonal_banners enable row level security;

-- Public read: anyone (including anonymous) can see banners
create policy "seasonal_banners_public_select"
  on public.seasonal_banners
  for select
  using (true);

-- Admin insert: caller's profile must have is_admin = true
create policy "seasonal_banners_admin_insert"
  on public.seasonal_banners
  for insert
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

-- Admin update: same is_admin check
create policy "seasonal_banners_admin_update"
  on public.seasonal_banners
  for update
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

-- Admin delete: same is_admin check
create policy "seasonal_banners_admin_delete"
  on public.seasonal_banners
  for delete
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

-- ─────────────────────────────────────────────
-- STORAGE — 'product-images' bucket
-- Supabase storage RLS is set on storage.objects (not a storage.policies
-- table). Create the bucket manually in the Supabase dashboard (Storage →
-- New bucket → "product-images", enable "Public bucket").
--
-- Then run these policies so authenticated admins can upload.
-- ─────────────────────────────────────────────

-- Public read: anyone can download objects from this bucket
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admin upload: only is_admin users can insert objects
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND exists (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- Admin update/delete: same guard
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND exists (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND exists (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );
