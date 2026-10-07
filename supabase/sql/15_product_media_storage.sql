-- Public bucket for product photos and datasheet PDFs (uploaded by seed scripts)
insert into storage.buckets (id, name, public, file_size_limit)
values ('product-media', 'product-media', true, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Public read product media" on storage.objects;
create policy "Public read product media"
on storage.objects for select
to public
using (bucket_id = 'product-media');

drop policy if exists "Service role manage product media" on storage.objects;
create policy "Service role manage product media"
on storage.objects for all
to service_role
using (bucket_id = 'product-media')
with check (bucket_id = 'product-media');
