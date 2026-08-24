-- STEP 1 of 10
-- Run first: extensions + helper functions
-- Supabase Dashboard → SQL Editor → New query → paste → Run

create extension if not exists "pgcrypto";

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

select 'Step 1 complete: extensions and functions created.' as message;
