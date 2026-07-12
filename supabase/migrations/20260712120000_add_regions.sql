begin;

create table if not exists public.bsg_region_cities (
  id uuid primary key default gen_random_uuid(),
  region_name text not null,
  city text not null unique,
  created_at timestamptz not null default now()
);

insert into public.bsg_region_cities (region_name, city)
values
  ('central_texas', 'austin'),
  ('central_texas', 'killeen'),
  ('central_texas', 'waco')
on conflict (city) do update set region_name = excluded.region_name;

alter table public.bsg_members add column if not exists region_name text;
update public.bsg_members set region_name = 'central_texas' where region_name is null;
alter table public.bsg_members alter column region_name set default 'central_texas';
alter table public.bsg_members alter column region_name set not null;

alter table public.bsg_shifts add column if not exists region_name text;
update public.bsg_shifts set region_name = 'central_texas' where region_name is null;
alter table public.bsg_shifts alter column region_name set default 'central_texas';
alter table public.bsg_shifts alter column region_name set not null;

create index if not exists idx_bsg_members_region_active
  on public.bsg_members (region_name) where deleted_at is null;
create index if not exists idx_bsg_shifts_region_date
  on public.bsg_shifts (region_name, shift_date);
create index if not exists idx_bsg_region_cities_region_name
  on public.bsg_region_cities (region_name);

create or replace view public.bsg_active_members with (security_invoker = true) as
  select id, name, email, phone, color, group_tag, created_at, region_name
  from public.bsg_members
  where deleted_at is null;

grant select on public.bsg_active_members to anon, authenticated;
grant select on public.bsg_region_cities to anon, authenticated;
alter table public.bsg_region_cities enable row level security;
drop policy if exists "Public region map is readable" on public.bsg_region_cities;
create policy "Public region map is readable"
  on public.bsg_region_cities for select to anon, authenticated using (true);

commit;
