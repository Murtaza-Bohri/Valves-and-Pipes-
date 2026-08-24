-- STEP 5 of 10
-- Run after step 4: product_images table

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on public.product_images (product_id);

insert into public.product_images (product_id, image_url, is_primary, sort_order)
select p.id, p.main_image, true, 0
from public.products p
where not exists (
  select 1 from public.product_images pi
  where pi.product_id = p.id and pi.is_primary = true
);

select 'Step 5 complete: product_images created.' as message;
