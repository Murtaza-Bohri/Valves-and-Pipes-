-- Ziina payment fields on orders

alter table public.orders
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'failed', 'cancelled')),
  add column if not exists ziina_payment_intent_id text,
  add column if not exists paid_at timestamptz;

create index if not exists orders_ziina_payment_intent_id_idx
  on public.orders (ziina_payment_intent_id)
  where ziina_payment_intent_id is not null;
