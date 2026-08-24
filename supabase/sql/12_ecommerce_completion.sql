-- STEP 12 — E-commerce completion (guest checkout, is_active, order automation)
-- Run after step 11 in Supabase SQL Editor

-- ---------------------------------------------------------------------------
-- Extend order_status enum
-- ---------------------------------------------------------------------------

alter type public.order_status add value if not exists 'out_for_delivery';

-- ---------------------------------------------------------------------------
-- is_active flags
-- ---------------------------------------------------------------------------

alter table public.categories
  add column if not exists is_active boolean not null default true;

alter table public.products
  add column if not exists is_active boolean not null default true;

alter table public.product_impa
  add column if not exists is_active boolean not null default true;

alter table public.profiles
  add column if not exists is_active boolean not null default true;

-- ---------------------------------------------------------------------------
-- Guest checkout fields on orders
-- ---------------------------------------------------------------------------

alter table public.orders
  alter column user_id drop not null;

alter table public.orders
  add column if not exists customer_name text;

alter table public.orders
  add column if not exists customer_email text;

alter table public.orders
  add column if not exists customer_phone text;

alter table public.orders
  add column if not exists shipping_address_line_1 text;

alter table public.orders
  add column if not exists shipping_address_line_2 text;

alter table public.orders
  add column if not exists shipping_city text;

alter table public.orders
  add column if not exists shipping_state text;

alter table public.orders
  add column if not exists shipping_country text default 'UAE';

alter table public.orders
  add column if not exists shipping_postal_code text;

alter table public.orders drop constraint if exists orders_customer_check;

alter table public.orders add constraint orders_customer_check check (
  (user_id is not null)
  or (
    customer_name is not null
    and customer_email is not null
    and shipping_address_line_1 is not null
    and shipping_city is not null
  )
);

-- ---------------------------------------------------------------------------
-- Safer order number generation
-- ---------------------------------------------------------------------------

create table if not exists public.order_number_sequences (
  order_date date primary key,
  last_value integer not null default 0
);

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  today date := (now() at time zone 'UTC')::date;
  seq integer;
begin
  insert into public.order_number_sequences (order_date, last_value)
  values (today, 1)
  on conflict (order_date) do update
  set last_value = public.order_number_sequences.last_value + 1
  returning last_value into seq;

  return 'ORD-' || to_char(today, 'YYYYMMDD') || '-' || lpad(seq::text, 5, '0');
end;
$$;

create or replace function public.orders_before_insert()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or btrim(new.order_number) = '' then
    new.order_number := public.generate_order_number();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_before_insert on public.orders;
create trigger orders_before_insert
before insert on public.orders
for each row execute function public.orders_before_insert();

create or replace function public.orders_after_insert()
returns trigger
language plpgsql
as $$
begin
  insert into public.order_status_history (order_id, status, note)
  values (new.id, new.status, 'Order placed');
  return new;
end;
$$;

drop trigger if exists orders_after_insert on public.orders;
create trigger orders_after_insert
after insert on public.orders
for each row execute function public.orders_after_insert();

create or replace function public.orders_status_history_on_update()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, note)
    values (new.id, new.status, 'Status updated');
  end if;
  return new;
end;
$$;

drop trigger if exists orders_status_history_on_update on public.orders;
create trigger orders_status_history_on_update
after update of status on public.orders
for each row execute function public.orders_status_history_on_update();

-- ---------------------------------------------------------------------------
-- RLS: public catalog reads active items only
-- ---------------------------------------------------------------------------

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories
  for select to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Public read products" on public.products;
create policy "Public read products" on public.products
  for select to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Public read product_images" on public.product_images;
create policy "Public read product_images" on public.product_images
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.is_active = true
    )
  );

drop policy if exists "Public read product_impa" on public.product_impa;
create policy "Public read product_impa" on public.product_impa
  for select to anon, authenticated
  using (
    (is_active = true and exists (
      select 1 from public.products p
      where p.id = product_impa.product_id and p.is_active = true
    ))
    or public.is_admin()
  );

drop policy if exists "Admin manage profiles" on public.profiles;
create policy "Admin manage profiles" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

select 'Step 12 complete: e-commerce completion schema applied.' as message;
