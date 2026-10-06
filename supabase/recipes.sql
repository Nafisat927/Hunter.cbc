-- ─────────────────────────────────────────────────────────────
-- Recipe Book: table + security rules + photo bucket
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to run more than once.
-- ─────────────────────────────────────────────────────────────

-- 1. The table
create table if not exists public.recipes (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  author       text not null default 'Eboard Member',   -- display name shown in the book
  author_id    uuid references auth.users (id) on delete set null default auth.uid(),
  ingredients  text[] not null default '{}',             -- one item per array entry
  instructions text not null default '',
  image_url    text,                                     -- public URL from the recipe-photos bucket
  created_at   timestamptz not null default now()
);

-- Cuisine (same list as the map). Added later, so this also upgrades an existing table.
alter table public.recipes add column if not exists cuisine text;

-- Tags (like the map's place tags), one per array entry.
alter table public.recipes add column if not exists tags text[] not null default '{}';

-- 2. Row Level Security (who can do what)
alter table public.recipes enable row level security;

-- Anyone visiting the site can read recipes
drop policy if exists "recipes are public" on public.recipes;
create policy "recipes are public"
  on public.recipes for select
  using (true);

-- Only logged-in e-board members can add, and only as themselves
drop policy if exists "eboard can add recipes" on public.recipes;
create policy "eboard can add recipes"
  on public.recipes for insert
  to authenticated
  with check (author_id = auth.uid());

-- Members can only edit their own pages
drop policy if exists "authors can edit own recipes" on public.recipes;
create policy "authors can edit own recipes"
  on public.recipes for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- Members can only delete their own pages
drop policy if exists "authors can delete own recipes" on public.recipes;
create policy "authors can delete own recipes"
  on public.recipes for delete
  to authenticated
  using (author_id = auth.uid());

-- 3. Photo storage bucket (public read, logged-in upload)
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

drop policy if exists "recipe photos are public" on storage.objects;
create policy "recipe photos are public"
  on storage.objects for select
  using (bucket_id = 'recipe-photos');

drop policy if exists "eboard can upload recipe photos" on storage.objects;
create policy "eboard can upload recipe photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'recipe-photos');
