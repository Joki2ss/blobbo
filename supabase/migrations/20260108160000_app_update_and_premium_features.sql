-- App update gate + admin upgrades catalog (additive)
-- Purpose:
-- 1) Remote-controlled Android update alert (latest_version/min_version/update_enabled/force_update)
-- 2) Admin-only "Extra / Upgrades" catalog driven by backend rows (no client-side unlock)

create schema if not exists private;

-- =========================
-- 1) App update remote config
-- =========================

create table if not exists public.app_update_config (
  singleton_id integer primary key default 1,
  latest_version text not null,
  min_version text not null,
  update_enabled boolean not null default false,
  force_update boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Keep exactly one row (id=1)
insert into public.app_update_config (singleton_id, latest_version, min_version, update_enabled, force_update)
values (1, '1.0.0', '1.0.0', false, false)
on conflict (singleton_id) do nothing;

-- updated_at trigger
-- NOTE: private.set_updated_at() is created in the base security migration.
drop trigger if exists set_app_update_config_updated_at on public.app_update_config;
create trigger set_app_update_config_updated_at
before update on public.app_update_config
for each row
execute function private.set_updated_at();

alter table public.app_update_config enable row level security;

-- No direct table access from clients; only via RPC.
revoke all on table public.app_update_config from public;
revoke all on table public.app_update_config from anon;
revoke all on table public.app_update_config from authenticated;

-- Public RPC: safe read-only config for all app users (including logged-out).
create or replace function public.get_app_update_config()
returns table (
  latest_version text,
  min_version text,
  update_enabled boolean,
  force_update boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.latest_version, c.min_version, c.update_enabled, c.force_update
  from public.app_update_config c
  where c.singleton_id = 1;
$$;

revoke execute on function public.get_app_update_config() from public;
grant execute on function public.get_app_update_config() to anon;
grant execute on function public.get_app_update_config() to authenticated;

-- Admin RPC: update config remotely (optional; can also be edited via SQL Editor).
create or replace function public.admin_set_app_update_config(
  p_latest_version text,
  p_min_version text,
  p_update_enabled boolean,
  p_force_update boolean,
  p_reason text default null
)
returns table (
  latest_version text,
  min_version text,
  update_enabled boolean,
  force_update boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_role text;
  v_latest text;
  v_min text;
  v_meta jsonb;
begin
  v_uid := auth.uid();
  perform private.assert(v_uid is not null, 'Not authenticated');

  select upper(trim(p.role)) into v_role
  from public.profiles p
  where p.user_id = v_uid;

  perform private.assert(v_role = 'ADMIN', 'Not authorized');

  v_latest := nullif(trim(coalesce(p_latest_version, '')), '');
  v_min := nullif(trim(coalesce(p_min_version, '')), '');

  perform private.assert(v_latest is not null, 'latest_version is required');
  perform private.assert(v_min is not null, 'min_version is required');

  update public.app_update_config
  set
    latest_version = v_latest,
    min_version = v_min,
    update_enabled = coalesce(p_update_enabled, false),
    force_update = coalesce(p_force_update, false)
  where singleton_id = 1;

  v_meta := jsonb_build_object(
    'reason', nullif(trim(coalesce(p_reason, '')), ''),
    'latest_version', v_latest,
    'min_version', v_min,
    'update_enabled', coalesce(p_update_enabled, false),
    'force_update', coalesce(p_force_update, false)
  );
  perform private.write_audit(v_uid, 'APP_UPDATE_CONFIG_SET', 'app_update_config', null, v_meta);

  return query
  select c.latest_version, c.min_version, c.update_enabled, c.force_update
  from public.app_update_config c
  where c.singleton_id = 1;
end;
$$;

revoke execute on function public.admin_set_app_update_config(text, text, boolean, boolean, text) from public;
revoke execute on function public.admin_set_app_update_config(text, text, boolean, boolean, text) from anon;
grant execute on function public.admin_set_app_update_config(text, text, boolean, boolean, text) to authenticated;

-- =========================
-- 2) Admin-only upgrades catalog
-- =========================

create table if not exists public.premium_features (
  feature_id text primary key,
  name text not null,
  icon text not null,
  short_description text not null,
  long_description text not null,
  price_label text not null,
  availability_status text not null check (availability_status in ('available','coming_soon')),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_premium_features_updated_at on public.premium_features;
create trigger set_premium_features_updated_at
before update on public.premium_features
for each row
execute function private.set_updated_at();

alter table public.premium_features enable row level security;

-- No direct table access from clients; only via admin RPC.
revoke all on table public.premium_features from public;
revoke all on table public.premium_features from anon;
revoke all on table public.premium_features from authenticated;

-- Seed example row (kept disabled by default)
insert into public.premium_features (
  feature_id,
  name,
  icon,
  short_description,
  long_description,
  price_label,
  availability_status,
  enabled
)
values (
  'analytics_plus',
  'Analytics+',
  'stats-chart-outline',
  'Advanced insights and reporting for your business.',
  'Analytics+ provides advanced dashboards and reporting. Availability and pricing may change. Purchases are completed on Google Play; features are enabled server-side only.',
  '€4.99 / month',
  'coming_soon',
  false
)
on conflict (feature_id) do nothing;

create or replace function private.require_admin()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_role text;
begin
  v_uid := auth.uid();
  perform private.assert(v_uid is not null, 'Not authenticated');

  select upper(trim(p.role)) into v_role
  from public.profiles p
  where p.user_id = v_uid;

  perform private.assert(v_role = 'ADMIN', 'Not authorized');
end;
$$;

-- Admin list
create or replace function public.admin_list_premium_features()
returns setof public.premium_features
language sql
stable
security definer
set search_path = ''
as $$
  select *
  from public.premium_features
  where (select private.require_admin()) is null
  order by name asc;
$$;

revoke execute on function public.admin_list_premium_features() from public;
revoke execute on function public.admin_list_premium_features() from anon;
grant execute on function public.admin_list_premium_features() to authenticated;

-- Admin get single
create or replace function public.admin_get_premium_feature(p_feature_id text)
returns public.premium_features
language sql
stable
security definer
set search_path = ''
as $$
  select *
  from public.premium_features
  where (select private.require_admin()) is null
    and feature_id = p_feature_id
  limit 1;
$$;

revoke execute on function public.admin_get_premium_feature(text) from public;
revoke execute on function public.admin_get_premium_feature(text) from anon;
grant execute on function public.admin_get_premium_feature(text) to authenticated;
