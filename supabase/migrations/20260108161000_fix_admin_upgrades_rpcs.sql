-- Fix: admin upgrades SQL RPCs must not depend on a void-returning function in SQL expressions.
-- Additive: replaces functions only (safe to re-run).

create schema if not exists private;

create or replace function private.require_admin()
returns boolean
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
  return true;
end;
$$;

create or replace function public.admin_list_premium_features()
returns setof public.premium_features
language sql
stable
security definer
set search_path = ''
as $$
  with _auth as (
    select private.require_admin() as ok
  )
  select pf.*
  from public.premium_features pf
  order by pf.name asc;
$$;

create or replace function public.admin_get_premium_feature(p_feature_id text)
returns public.premium_features
language sql
stable
security definer
set search_path = ''
as $$
  with _auth as (
    select private.require_admin() as ok
  )
  select pf.*
  from public.premium_features pf
  where pf.feature_id = p_feature_id
  limit 1;
$$;
