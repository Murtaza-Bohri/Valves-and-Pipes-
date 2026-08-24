-- STEP 3 of 10
-- Run after step 2: categories + brands tables

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

insert into public.categories (name, slug, description, image, sort_order)
values
  ('Pipes', 'pipes', 'Industrial pipe supplies', '/products/pipes.png', 1),
  ('Valves', 'valves', 'Industrial valve solutions', '/products/valves.png', 2)
on conflict (slug) do nothing;

select 'Step 3 complete: categories and brands created.' as message;
