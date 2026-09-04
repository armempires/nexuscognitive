create table if not exists public.payments (
  id uuid primary key,
  asaas_payment_id text unique,
  name text not null,
  email text not null,
  cpf_cnpj text not null,
  phone text,
  amount numeric(10, 2) not null default 19.90 check (amount = 19.90),
  method text not null check (method in ('pix', 'card')),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'REFUSED', 'CANCELED')),
  is_simulated boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A tabela payments já existia no projeto com o schema legado. Estas colunas
-- mantêm os dados antigos e completam o contrato usado pelas Edge Functions.
alter table public.payments add column if not exists name text not null default '';
alter table public.payments add column if not exists email text not null default '';
alter table public.payments add column if not exists cpf_cnpj text not null default '';
alter table public.payments add column if not exists phone text;
alter table public.payments add column if not exists method text not null default 'pix';
alter table public.payments add column if not exists is_simulated boolean not null default false;
alter table public.payments add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.payments add column if not exists updated_at timestamptz not null default now();

create index if not exists payments_email_idx on public.payments (email);
create index if not exists payments_status_idx on public.payments (status);

create table if not exists public.asaas_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event text not null,
  payment_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;
alter table public.asaas_webhook_events enable row level security;

drop policy if exists payments_no_anon_access on public.payments;
create policy payments_no_anon_access on public.payments
  for all to anon using (false) with check (false);

drop policy if exists webhook_events_no_anon_access on public.asaas_webhook_events;
create policy webhook_events_no_anon_access on public.asaas_webhook_events
  for all to anon using (false) with check (false);