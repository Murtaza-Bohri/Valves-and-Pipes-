-- STEP 2 of 10
-- Run after step 1: enum types for carts and orders

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

select 'Step 2 complete: enums created.' as message;
