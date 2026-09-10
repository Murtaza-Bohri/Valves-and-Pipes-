-- STEP 13 — Hierarchical categories (parent_id)
-- Run after step 12 in Supabase SQL Editor

alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete restrict;

create index if not exists categories_parent_id_idx on public.categories (parent_id);

-- Prevent a category from referencing itself
alter table public.categories drop constraint if exists categories_parent_not_self;
alter table public.categories add constraint categories_parent_not_self check (
  parent_id is null or parent_id <> id
);

select 'Step 13 complete: category hierarchy column added.' as message;
