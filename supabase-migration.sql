-- MONWOLF · /buy embedded-wallet cloud backup
-- Run this in the Supabase SQL editor for the cuqhqcmrgpdjlhyqztnc project.
-- This creates the table + RLS policies for storing user-encrypted wallet
-- blobs. The server never sees passwords or private keys — everything is
-- encrypted client-side (PBKDF2-SHA256 600k iters → AES-GCM 256).

create table if not exists public.mw_wallets (
  email_hash text primary key,
  ciphertext text not null,
  salt       text not null,
  iv         text not null,
  address    text not null,
  v          int  default 1,
  created_at timestamptz default now()
);

-- RLS on
alter table public.mw_wallets enable row level security;

-- Anyone can read (records are encrypted; reading reveals only ciphertext)
drop policy if exists "mw_wallets anon select" on public.mw_wallets;
create policy "mw_wallets anon select"
  on public.mw_wallets for select
  to anon, authenticated
  using (true);

-- Anyone can insert a NEW row (primary key conflict will reject duplicates)
drop policy if exists "mw_wallets anon insert" on public.mw_wallets;
create policy "mw_wallets anon insert"
  on public.mw_wallets for insert
  to anon, authenticated
  with check (true);

-- NO update/delete policies = anon cannot mutate existing rows.
-- A malicious actor cannot brick someone else's record by overwriting it.
-- If a user forgets their password, they restore from their 12-word seed
-- phrase (which can use the same email if they want to overwrite — but
-- we currently route restore to a fresh email; future migration could
-- add a wallet-signature-based update policy).

-- Quick smoke test (run as anon):
--   select count(*) from mw_wallets;  -- should return 0
