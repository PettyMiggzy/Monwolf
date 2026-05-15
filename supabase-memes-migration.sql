-- ============================================================
-- MONWOLF · /memes feature — Meme Wall
-- Run this in the Supabase SQL editor on the cuqhqcmrgpdjlhyqztnc
-- project, THEN follow the bucket setup steps below.
-- ============================================================

-- ── 1. Table for meme records ──────────────────────────────────
create table if not exists public.monwolf_memes (
  id              uuid primary key default gen_random_uuid(),
  wallet_address  text not null,
  image_url       text not null,
  caption         text default '',
  created_at      timestamptz default now()
);

create index if not exists monwolf_memes_created_idx
  on public.monwolf_memes (created_at desc);
create index if not exists monwolf_memes_wallet_idx
  on public.monwolf_memes (wallet_address);

alter table public.monwolf_memes enable row level security;

drop policy if exists "memes anon select" on public.monwolf_memes;
create policy "memes anon select"
  on public.monwolf_memes for select
  to anon, authenticated
  using (true);

drop policy if exists "memes anon insert" on public.monwolf_memes;
create policy "memes anon insert"
  on public.monwolf_memes for insert
  to anon, authenticated
  with check (
    -- light validation: wallet must look like an address, caption < 280
    char_length(wallet_address) between 4 and 64
    and char_length(coalesce(caption,'')) <= 280
  );

-- No update/delete policies — once posted, it stays.
-- Future: add a signed-message delete-your-own-post policy.

-- ── 2. Storage bucket setup ───────────────────────────────────
-- You can either run this SQL OR do it through the dashboard.
--
-- DASHBOARD (recommended, easier):
--   Storage → New bucket → name: monwolf-memes → set PUBLIC ✓ → Create
--   Then go to Storage → monwolf-memes → Policies → New policy:
--      For SELECT: allow anon + authenticated (public read)
--      For INSERT: allow anon + authenticated with size limit 5MB
--
-- OR via SQL (if buckets table is accessible to your role):

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'monwolf-memes',
  'monwolf-memes',
  true,
  5242880,
  array['image/jpeg','image/png','image/gif','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS policies
drop policy if exists "memes bucket public read"   on storage.objects;
drop policy if exists "memes bucket anon upload"   on storage.objects;

create policy "memes bucket public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'monwolf-memes');

create policy "memes bucket anon upload"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'monwolf-memes');

-- ── 3. Smoke test (run as anon role) ──────────────────────────
-- select count(*) from public.monwolf_memes;          -- should return 0
-- select id from storage.buckets where id='monwolf-memes';  -- should return 1 row
