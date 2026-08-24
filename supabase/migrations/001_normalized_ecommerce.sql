-- =============================================================================
-- Himmat Oil Fields — Normalized E-Commerce Schema (Migration 001)
-- =============================================================================
-- INSPECT FIRST: Existing public.products (flat) with columns:
--   id, name, category, description, image, sort_order, created_at, updated_at
--
-- THIS MIGRATION:
--   • Preserves existing product rows
--   • Splits data into categories, products, product_images, product_impa
--   • Adds customer, cart, and order tables with proper FK relationships
--   • Does NOT create wishlist or coupon tables (not required yet)
--
-- RUN IN: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  today text := to_char(now() at time zone 'UTC', 'YYYYMMDD');
  seq integer;
begin
  select count(*) + 1
  into seq
  from public.orders
  where created_at::date = (now() at time zone 'UTC')::date;

  return 'ORD-' || today || '-' || lpad(seq::text, 5, '0');
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.cart_status as enum ('active', 'abandoned', 'converted');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum (
    'pending',
    'confirmed',
    'processing',
    'packed',
    'shipped',
    'delivered',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Brands
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Migrate legacy flat products → normalized products
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'category'
  ) then
    alter table public.products rename to products_legacy;
  end if;
end $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  brand_id uuid references public.brands(id) on delete set null,
  main_image text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_brand_id_idx on public.products (brand_id);
create index if not exists products_sort_order_idx on public.products (sort_order asc);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Seed categories from legacy data or defaults
insert into public.categories (name, slug, description, sort_order)
values
  ('Pipes', 'pipes', 'Industrial pipe supplies', 1),
  ('Valves', 'valves', 'Industrial valve solutions', 2)
on conflict (slug) do nothing;

-- Migrate legacy rows if present
do $$
declare
  legacy record;
  cat_id uuid;
  new_slug text;
begin
  if to_regclass('public.products_legacy') is null then
    return;
  end if;

  for legacy in select * from public.products_legacy loop
    select id into cat_id
    from public.categories
    where lower(name) = lower(legacy.category)
    limit 1;

    if cat_id is null then
      new_slug := lower(regexp_replace(legacy.category, '[^a-zA-Z0-9]+', '-', 'g'));
      insert into public.categories (name, slug, sort_order)
      values (legacy.category, new_slug, 99)
      returning id into cat_id;
    end if;

    new_slug := lower(regexp_replace(legacy.name, '[^a-zA-Z0-9]+', '-', 'g'));

    insert into public.products (
      id,
      name,
      slug,
      description,
      category_id,
      main_image,
      sort_order,
      created_at,
      updated_at
    )
    values (
      legacy.id,
      legacy.name,
      new_slug,
      legacy.description,
      cat_id,
      legacy.image,
      legacy.sort_order,
      legacy.created_at,
      legacy.updated_at
    )
    on conflict (id) do update set
      name = excluded.name,
      slug = excluded.slug,
      description = excluded.description,
      category_id = excluded.category_id,
      main_image = excluded.main_image,
      sort_order = excluded.sort_order,
      updated_at = now();
  end loop;
end $$;

-- Default products if nothing migrated
insert into public.products (name, slug, description, category_id, main_image, sort_order)
select
  'Pipes',
  'pipes',
  'Industrial pipe supply for oil & gas, refining, petrochemical, and utility projects.',
  c.id,
  '/products/pipes.png',
  1
from public.categories c
where c.slug = 'pipes'
  and not exists (select 1 from public.products where slug = 'pipes');

insert into public.products (name, slug, description, category_id, main_image, sort_order)
select
  'Valves',
  'valves',
  'Comprehensive valve solutions for upstream and downstream oil & gas operations.',
  c.id,
  '/products/valves.png',
  2
from public.categories c
where c.slug = 'valves'
  and not exists (select 1 from public.products where slug = 'valves');

drop table if exists public.products_legacy;

-- ---------------------------------------------------------------------------
-- Product images
-- ---------------------------------------------------------------------------

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on public.product_images (product_id);

-- Seed primary images from main_image where missing
insert into public.product_images (product_id, image_url, is_primary, sort_order)
select p.id, p.main_image, true, 0
from public.products p
where not exists (
  select 1 from public.product_images pi
  where pi.product_id = p.id and pi.is_primary = true
);

-- ---------------------------------------------------------------------------
-- Product IMPA
-- ---------------------------------------------------------------------------

create table if not exists public.product_impa (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  impa_number text not null,
  item_description text not null,
  inventory_uom text not null default 'EA',
  price numeric(12, 2) not null check (price >= 0),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, impa_number)
);

create index if not exists product_impa_product_id_idx on public.product_impa (product_id);
create index if not exists product_impa_number_idx on public.product_impa (impa_number);

drop trigger if exists product_impa_set_updated_at on public.product_impa;
create trigger product_impa_set_updated_at
before update on public.product_impa
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Customer profiles (auth handled by Supabase Auth)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Addresses
-- ---------------------------------------------------------------------------

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text,
  country text not null default 'UAE',
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on public.addresses (user_id);

drop trigger if exists addresses_set_updated_at on public.addresses;
create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Carts & cart items
-- ---------------------------------------------------------------------------

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.cart_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carts_user_id_idx on public.carts (user_id);

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  impa_id uuid not null references public.product_impa(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price numeric(12, 2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, impa_id)
);

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders, order items (immutable snapshots), status history
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  status public.order_status not null default 'pending',
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  shipping_amount numeric(12, 2) not null default 0 check (shipping_amount >= 0),
  tax_amount numeric(12, 2) not null default 0 check (tax_amount >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  shipping_address_id uuid references public.addresses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_order_number_idx on public.orders (order_number);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  impa_id uuid references public.product_impa(id) on delete set null,
  product_name text not null,
  impa_number text not null,
  item_description text not null,
  inventory_uom text not null,
  price_at_purchase numeric(12, 2) not null check (price_at_purchase >= 0),
  quantity integer not null check (quantity > 0),
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_id_idx
  on public.order_status_history (order_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_impa enable row level security;
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

-- Drop old flat-product policies if they exist
drop policy if exists "Anyone can read products" on public.products;
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;

-- Public catalog read
drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "Public read brands" on public.brands;
create policy "Public read brands" on public.brands
  for select to anon, authenticated using (true);

drop policy if exists "Public read products" on public.products;
create policy "Public read products" on public.products
  for select to anon, authenticated using (true);

drop policy if exists "Public read product_images" on public.product_images;
create policy "Public read product_images" on public.product_images
  for select to anon, authenticated using (true);

drop policy if exists "Public read product_impa" on public.product_impa;
create policy "Public read product_impa" on public.product_impa
  for select to anon, authenticated using (true);

-- Admin write on catalog
drop policy if exists "Admin manage categories" on public.categories;
create policy "Admin manage categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage brands" on public.brands;
create policy "Admin manage brands" on public.brands
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage products" on public.products;
create policy "Admin manage products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage product_images" on public.product_images;
create policy "Admin manage product_images" on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage product_impa" on public.product_impa;
create policy "Admin manage product_impa" on public.product_impa
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Profiles: own row only
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Admin read all profiles" on public.profiles;
create policy "Admin read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());

-- Addresses: own rows
drop policy if exists "Users manage own addresses" on public.addresses;
create policy "Users manage own addresses" on public.addresses
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Admin read all addresses" on public.addresses;
create policy "Admin read all addresses" on public.addresses
  for select to authenticated using (public.is_admin());

-- Carts: own rows
drop policy if exists "Users manage own carts" on public.carts;
create policy "Users manage own carts" on public.carts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Admin read all carts" on public.carts;
create policy "Admin read all carts" on public.carts
  for select to authenticated using (public.is_admin());

-- Cart items: via own cart
drop policy if exists "Users manage own cart items" on public.cart_items;
create policy "Users manage own cart items" on public.cart_items
  for all to authenticated
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Admin read all cart items" on public.cart_items;
create policy "Admin read all cart items" on public.cart_items
  for select to authenticated using (public.is_admin());

-- Orders: own rows; admin manages all
drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders" on public.orders
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users create own orders" on public.orders;
create policy "Users create own orders" on public.orders
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Admin manage orders" on public.orders;
create policy "Admin manage orders" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Order items: via own order
drop policy if exists "Users read own order items" on public.order_items;
create policy "Users read own order items" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert own order items" on public.order_items;
create policy "Users insert own order items" on public.order_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admin manage order items" on public.order_items;
create policy "Admin manage order items" on public.order_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Order status history
drop policy if exists "Users read own order history" on public.order_status_history;
create policy "Users read own order history" on public.order_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admin manage order history" on public.order_status_history;
create policy "Admin manage order history" on public.order_status_history
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Done
-- ---------------------------------------------------------------------------

select 'Normalized schema migration completed.' as message;
