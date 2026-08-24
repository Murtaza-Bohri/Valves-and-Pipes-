-- STEP 6 of 10
-- Run after step 5: product_impa table (IMPA numbers + prices)

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

select 'Step 6 complete: product_impa created.' as message;
