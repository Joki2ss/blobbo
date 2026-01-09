-- Fix: admin upgrades SQL RPCs must not depend on a void-returning function in SQL expressions.
-- Additive: replaces functions only (safe to re-run).

-- NOTE: Postgres cannot change a function's return type via CREATE OR REPLACE.
-- If an older private.require_admin() exists (returning void), we must drop it first.
-- Drop dependents first to avoid dependency errors.

drop function if exists public.admin_get_premium_feature(text);
drop function if exists public.admin_list_premium_features();
drop function if exists private.require_admin();

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

-- Function privileges reset on DROP/CREATE; lock them down again.
revoke execute on function private.require_admin() from public;
revoke execute on function private.require_admin() from anon;
revoke execute on function private.require_admin() from authenticated;

revoke execute on function public.admin_list_premium_features() from public;
revoke execute on function public.admin_list_premium_features() from anon;
grant execute on function public.admin_list_premium_features() to authenticated;

revoke execute on function public.admin_get_premium_feature(text) from public;
revoke execute on function public.admin_get_premium_feature(text) from anon;
grant execute on function public.admin_get_premium_feature(text) to authenticated;
