create table if not exists public.service_prices (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null,
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'BRL',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.service_prices (code, description, amount, currency, active)
values ('qi-report', 'Relatório Completo de QI - Nexus Cognitive Insight', 19.90, 'BRL', true)
on conflict (code) do nothing;

alter table public.service_prices enable row level security;

drop policy if exists service_prices_no_anon_access on public.service_prices;
create policy service_prices_no_anon_access on public.service_prices
  for all to anon using (false) with check (false);

drop policy if exists service_prices_no_authenticated_access on public.service_prices;
create policy service_prices_no_authenticated_access on public.service_prices
  for all to authenticated using (false) with check (false);