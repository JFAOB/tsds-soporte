-- Ejecutar una vez en SQL Editor del proyecto Supabase de TSDS.
create table if not exists public.backoffice_registros (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default ((now() at time zone 'America/Santiago')::date),
  cliente text not null check (char_length(trim(cliente)) between 1 and 160),
  vendedor text not null,
  zona text not null,
  tipo_venta text not null check (tipo_venta in ('TV','NET','REINGRESO')),
  backoffice text not null check (char_length(trim(backoffice)) between 1 and 80),
  created_at timestamptz not null default now()
);
create index if not exists backoffice_fecha_idx on public.backoffice_registros(fecha, created_at);
alter table public.backoffice_registros enable row level security;
revoke all on public.backoffice_registros from anon, authenticated;
grant select, insert, update, delete on public.backoffice_registros to service_role;
