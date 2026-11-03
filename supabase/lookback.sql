-- ─────────────────────────────────────────────────────────────
-- Big Back Lookback: photo table + security rules + photo bucket
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to run more than once.
-- ─────────────────────────────────────────────────────────────

-- 1. The table
create table if not exists public.lookback_photos (
  id                  uuid primary key default gen_random_uuid(),
  owner               uuid not null references auth.users (id) on delete cascade default auth.uid(),
  path                text not null unique,                -- file path inside the lookback-photos bucket
  file_name           text not null,                       -- original filename, used for downloads
  what                text not null default '' check (char_length(what) <= 80),
  place               text not null default '' check (char_length(place) <= 80),   -- the "Where" box
  rating              int  not null default 0 check (rating between 0 and 5),      -- 0 = not rated
  uploader_name       text not null default 'Eboard Member',
  uploader_avatar_url text,                                 -- copied from the uploader's account settings
  created_at          timestamptz not null default now()
);

-- 2. Row Level Security (who can do what)
alter table public.lookback_photos enable row level security;

-- Anyone visiting the site can see the board
drop policy if exists "lookback photos are public" on public.lookback_photos;
create policy "lookback photos are public"
  on public.lookback_photos for select
  using (true);

-- Logged-in members add photos only as themselves
drop policy if exists "members add own lookback photos" on public.lookback_photos;
create policy "members add own lookback photos"
  on public.lookback_photos for insert
  to authenticated
  with check (owner = auth.uid());

-- Members edit and delete only their own photos
drop policy if exists "members edit own lookback photos" on public.lookback_photos;
create policy "members edit own lookback photos"
  on public.lookback_photos for update
  to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid());

drop policy if exists "members delete own lookback photos" on public.lookback_photos;
create policy "members delete own lookback photos"
  on public.lookback_photos for delete
  to authenticated
  using (owner = auth.uid());

-- 3. Photo storage bucket (public read; members upload/delete in their own folder)
-- Originals are stored uncompressed, so allow up to 50 MB per file (the free-plan maximum).
insert into storage.buckets (id, name, public, file_size_limit)
values ('lookback-photos', 'lookback-photos', true, 52428800)
on conflict (id) do nothing;

drop policy if exists "lookback files are public" on storage.objects;
create policy "lookback files are public"
  on storage.objects for select
  using (bucket_id = 'lookback-photos');

drop policy if exists "members upload own lookback files" on storage.objects;
create policy "members upload own lookback files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lookback-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "members delete own lookback files" on storage.objects;
create policy "members delete own lookback files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lookback-photos' and (storage.foldername(name))[1] = auth.uid()::text);
