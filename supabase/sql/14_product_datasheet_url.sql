-- Optional product datasheet (e.g. Google Drive PDF link)
alter table public.products
  add column if not exists datasheet_url text;

comment on column public.products.datasheet_url is 'Public URL to product datasheet (PDF, Google Drive preview, etc.)';
