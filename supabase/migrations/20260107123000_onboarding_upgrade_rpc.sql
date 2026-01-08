-- Pro onboarding + self-upgrade RPCs (server-side enforcement)
-- Additive: stores onboarding output on profiles and prevents client-side role changes.

-- Add onboarding fields (nullable by default)
alter table public.profiles
  add column if not exists primary_category text,
  add column if not exists enabled_modules text[] not null default array[]::text[],
  add column if not exists dashboard_preset text,
  add column if not exists pro_onboarded_at timestamptz,
  add column if not exists pro_onboarding_answers jsonb;

-- Self upgrade: USER -> BUSINESS (no re-registration)
create or replace function public.self_upgrade_to_business(
  p_reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_row public.profiles;
  v_role text;
  v_meta jsonb;
begin
  v_uid := auth.uid();
  perform private.assert(v_uid is not null, 'Not authenticated');

  -- Ensure profile exists
  insert into public.profiles(user_id, role, is_hidden_from_public)
  values (v_uid, 'USER', false)
  on conflict (user_id) do nothing;

  select * into v_row from public.profiles where user_id = v_uid;
  v_role := upper(trim(v_row.role));

  -- Only allow USER -> BUSINESS. Preserve BUSINESS/ADMIN/DEVELOPER.
  if v_role = 'USER' then
    update public.profiles
    set role = 'BUSINESS'
    where user_id = v_uid
    returning * into v_row;

    v_meta := jsonb_build_object(
      'reason', nullif(trim(coalesce(p_reason, '')), ''),
      'from', 'USER',
      'to', 'BUSINESS'
    );
    perform private.write_audit(v_uid, 'PROFILE_UPGRADE_TO_BUSINESS', 'profile', v_uid, v_meta);
  end if;

  return v_row;
end;
$$;

revoke execute on function public.self_upgrade_to_business(text) from public;
revoke execute on function public.self_upgrade_to_business(text) from anon;
grant execute on function public.self_upgrade_to_business(text) to authenticated;

-- Self onboarding save (BUSINESS/ADMIN only)
create or replace function public.self_set_pro_onboarding(
  p_primary_category text,
  p_enabled_modules text[],
  p_dashboard_preset text,
  p_answers jsonb default null,
  p_reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_row public.profiles;
  v_role text;
  v_meta jsonb;
begin
  v_uid := auth.uid();
  perform private.assert(v_uid is not null, 'Not authenticated');

  select * into v_row from public.profiles where user_id = v_uid;
  perform private.assert(v_row.user_id is not null, 'Profile not found');

  v_role := upper(trim(v_row.role));
  perform private.assert(v_role in ('BUSINESS','ADMIN','DEVELOPER'), 'Not authorized');

  perform private.assert(nullif(trim(coalesce(p_primary_category, '')), '') is not null, 'primary_category is required');
  perform private.assert(nullif(trim(coalesce(p_dashboard_preset, '')), '') is not null, 'dashboard_preset is required');

  update public.profiles
  set
    primary_category = trim(p_primary_category),
    enabled_modules = coalesce(p_enabled_modules, array[]::text[]),
    dashboard_preset = trim(p_dashboard_preset),
    pro_onboarded_at = now(),
    pro_onboarding_answers = p_answers
  where user_id = v_uid
  returning * into v_row;

  v_meta := jsonb_build_object(
    'reason', nullif(trim(coalesce(p_reason, '')), ''),
    'primary_category', v_row.primary_category,
    'enabled_modules', v_row.enabled_modules,
    'dashboard_preset', v_row.dashboard_preset
  );

  perform private.write_audit(v_uid, 'PROFILE_SET_PRO_ONBOARDING', 'profile', v_uid, v_meta);

  return v_row;
end;
$$;

revoke execute on function public.self_set_pro_onboarding(text, text[], text, jsonb, text) from public;
revoke execute on function public.self_set_pro_onboarding(text, text[], text, jsonb, text) from anon;
grant execute on function public.self_set_pro_onboarding(text, text[], text, jsonb, text) to authenticated;
