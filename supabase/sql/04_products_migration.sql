-- STEP 4 of 10
-- Run after step 3: migrate old flat products → normalized products table
-- Safe: renames old table to products_legacy, then migrates your data

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
      id, name, slug, description, category_id, main_image, sort_order, created_at, updated_at
    )
    values (
      legacy.id, legacy.name, new_slug, legacy.description, cat_id,
      legacy.image, legacy.sort_order, legacy.created_at, legacy.updated_at
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

insert into public.products (name, slug, description, category_id, main_image, sort_order)
select
  'Pipes', 'pipes',
  'Industrial pipe supply for oil & gas, refining, petrochemical, and utility projects.',
  c.id, '/products/pipes.png', 1
from public.categories c
where c.slug = 'pipes'
  and not exists (select 1 from public.products where slug = 'pipes');

insert into public.products (name, slug, description, category_id, main_image, sort_order)
select
  'Valves', 'valves',
  'Comprehensive valve solutions for upstream and downstream oil & gas operations.',
  c.id, '/products/valves.png', 2
from public.categories c
where c.slug = 'valves'
  and not exists (select 1 from public.products where slug = 'valves');

drop table if exists public.products_legacy;

select 'Step 4 complete: products table migrated.' as message;
