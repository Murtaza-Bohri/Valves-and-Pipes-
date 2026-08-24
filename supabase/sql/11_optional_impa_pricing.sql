-- STEP 11 — Optional IMPA pricing per product
-- Run after steps 1-10 in Supabase SQL Editor

-- ---------------------------------------------------------------------------
-- products: add has_impa + direct price
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists has_impa boolean not null default false;

alter table public.products
  add column if not exists price numeric(12, 2);

-- Set has_impa based on existing IMPA rows
update public.products p
set has_impa = exists (
  select 1 from public.product_impa pi where pi.product_id = p.id
);

-- Non-IMPA products need a direct price (default 0 until admin sets it)
update public.products
set price = 0
where has_impa = false and price is null;

-- IMPA products must not use direct price
update public.products
set price = null
where has_impa = true;

alter table public.products drop constraint if exists products_pricing_check;

alter table public.products add constraint products_pricing_check check (
  (has_impa = false and price is not null and price >= 0)
  or
  (has_impa = true and price is null)
);

-- ---------------------------------------------------------------------------
-- cart_items: IMPA is optional (null when product has no IMPA)
-- ---------------------------------------------------------------------------

alter table public.cart_items
  alter column impa_id drop not null;

alter table public.cart_items drop constraint if exists cart_items_cart_id_impa_id_key;

create unique index if not exists cart_items_cart_product_direct_unique
  on public.cart_items (cart_id, product_id)
  where impa_id is null;

create unique index if not exists cart_items_cart_impa_unique
  on public.cart_items (cart_id, impa_id)
  where impa_id is not null;

-- ---------------------------------------------------------------------------
-- order_items: IMPA fields optional for normal products
-- ---------------------------------------------------------------------------

alter table public.order_items
  alter column impa_number drop not null;

alter table public.order_items
  alter column item_description drop not null;

alter table public.order_items
  alter column inventory_uom drop not null;

select 'Step 11 complete: optional IMPA pricing enabled.' as message;
