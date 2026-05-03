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
-- Decision: banner images share the existing 'product-images' bucket.
-- Rationale: MVP simplicity — one bucket, one set of policies, no extra
-- provisioning. Banner images are uploaded under a 'banners/' prefix so
-- they remain easy to distinguish from product images and can be moved
-- to a dedicated bucket later without touching application logic beyond
-- a single constant.
--
-- The bucket itself was created by migration 001 / via the Supabase
-- dashboard. The policies below are idempotent (drop-if-exists + create).
-- ─────────────────────────────────────────────

-- Public read for ALL objects in product-images (covers banners/ prefix)
-- This policy likely already exists from 001; the `or replace` on
-- storage policies is not supported, so we guard with a do-block.
do $$ begin
  if not exists (
    select 1 from storage.policies
    where bucket_id = 'product-images'
      and name = 'product_images_public_read'
  ) then
    insert into storage.policies (name, bucket_id, operation, definition)
    values (
      'product_images_public_read',
      'product-images',
      'SELECT',
      'true'  -- allow all reads; bucket itself must be set to public
    );
  end if;
end $$;

-- Admin-only write (INSERT) for the 'banners/' prefix specifically.
-- Products prefix is handled by the existing admin write policy from 001.
-- We add a second INSERT policy scoped to banners/ so the intent is clear.
do $$ begin
  if not exists (
    select 1 from storage.policies
    where bucket_id = 'product-images'
      and name = 'product_images_admin_insert_banners'
  ) then
    insert into storage.policies (name, bucket_id, operation, definition)
    values (
      'product_images_admin_insert_banners',
      'product-images',
      'INSERT',
      -- RLS expression: uploader must be an admin, path must start with banners/
      $policy$
        bucket_id = 'product-images'
        and (storage.foldername(name))[1] = 'banners'
        and exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
      $policy$
    );
  end if;
end $$;
