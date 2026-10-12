create table if not exists public.backoffice_vendedores (
 nombre_key text primary key,
 nombre text not null check (char_length(trim(nombre)) between 1 and 100),
 zona text not null check (char_length(trim(zona)) between 1 and 80),
 created_at timestamptz not null default now()
);
alter table public.backoffice_vendedores enable row level security;
revoke all on public.backoffice_vendedores from anon, authenticated;
grant select, insert on public.backoffice_vendedores to service_role;
