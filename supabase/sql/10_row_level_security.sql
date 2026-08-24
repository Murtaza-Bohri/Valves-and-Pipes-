-- STEP 10 of 10 — RUN LAST
-- Run after step 9: Row Level Security (RLS) policies

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

-- Remove old flat-product policies
drop policy if exists "Anyone can read products" on public.products;
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;

-- Public catalog (read-only for everyone)
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

-- Admin catalog management
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

-- Profiles
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

-- Addresses
drop policy if exists "Users manage own addresses" on public.addresses;
create policy "Users manage own addresses" on public.addresses
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Admin read all addresses" on public.addresses;
create policy "Admin read all addresses" on public.addresses
  for select to authenticated using (public.is_admin());

-- Carts
drop policy if exists "Users manage own carts" on public.carts;
create policy "Users manage own carts" on public.carts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Admin read all carts" on public.carts;
create policy "Admin read all carts" on public.carts
  for select to authenticated using (public.is_admin());

-- Cart items
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

-- Orders
drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders" on public.orders
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users create own orders" on public.orders;
create policy "Users create own orders" on public.orders
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Admin manage orders" on public.orders;
create policy "Admin manage orders" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Order items
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

select 'Step 10 complete: all RLS policies applied. Migration finished!' as message;
