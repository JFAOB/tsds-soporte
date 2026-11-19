-- TSDS Valida · esquema preparado para revisión antes de ejecutarse
-- No contiene datos reales ni crea usuarios. Requiere configurar Auth y servicios server-side.
create schema if not exists valida;
create table if not exists valida.zones (
  code text primary key,
  constraint zone_code_check check (code in ('CONCEPCION','TEMUCO','VALDIVIA','OSORNO','PUERTO MONTT','COYHAIQUE','PUNTA ARENAS','ONLINE'))
);
insert into valida.zones(code) values ('CONCEPCION'),('TEMUCO'),('VALDIVIA'),('OSORNO'),('PUERTO MONTT'),('COYHAIQUE'),('PUNTA ARENAS'),('ONLINE') on conflict do nothing;
create table if not exists valida.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check(role in ('admin','backoffice')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists valida.staff_zones (
  user_id uuid not null references valida.staff(user_id) on delete cascade,
  zone_code text not null references valida.zones(code),
  primary key(user_id,zone_code)
);
create table if not exists valida.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check(category in ('ONLYNET','DUO','TV','DGO')),
  regular_price integer not null check(regular_price > 0),
  promotional_price integer check(promotional_price > 0),
  promotion_months integer check(promotion_months > 0),
  terms text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint promo_complete check ((promotional_price is null) = (promotion_months is null))
);
create table if not exists valida.prospects (
  id uuid primary key default gen_random_uuid(),
  sds_reference text not null unique,
  zone_code text not null references valida.zones(code),
  seller_name text not null,
  client_name text not null,
  client_rut text not null,
  client_email text not null,
  client_phone text not null,
  installation_address text not null,
  plan_id uuid not null references valida.plans(id),
  offer_snapshot jsonb not null,
  status text not null default 'pending_customer' check(status in ('pending_customer','accepted_customer','rejected_customer','observed','approved_sds','rejected_sds')),
  token_hash text unique,
  token_expires_at timestamptz,
  accepted_at timestamptz,
  decided_at timestamptz,
  reviewed_by uuid references valida.staff(user_id),
  sds_approval_reference text,
  created_at timestamptz not null default now()
);
create table if not exists valida.audit_events (
  id bigint generated always as identity primary key,
  prospect_id uuid references valida.prospects(id),
  actor_id uuid references auth.users(id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists valida_prospects_zone_status_idx on valida.prospects(zone_code,status,created_at);
create index if not exists valida_audit_prospect_idx on valida.audit_events(prospect_id,created_at);
-- Defensa en profundidad: ningún rol cliente tiene acceso directo a estas tablas.
alter table valida.zones enable row level security;
alter table valida.staff enable row level security;
alter table valida.staff_zones enable row level security;
alter table valida.plans enable row level security;
alter table valida.prospects enable row level security;
alter table valida.audit_events enable row level security;
revoke all on schema valida from public, anon, authenticated;
revoke all on all tables in schema valida from public, anon, authenticated;
revoke all on all sequences in schema valida from public, anon, authenticated;
-- Las operaciones futuras usarán rutas de servidor con comprobaciones de sesión,
-- rol y zonas en cada petición. No exponer service_role al navegador.
