-- Supabase installation status check
-- Run this in SQL Editor to verify all migrations are applied.

-- 1) Profile columns (onboarding + anagrafica)
select 
  'Profile columns' as check_type,
  count(*) as found,
  case 
    when count(*) >= 12 then '✓ OK'
    else '✗ MISSING (run 20260107123000 + 20260107124000)'
  end as status
from information_schema.columns
where table_schema='public' 
  and table_name='profiles'
  and column_name in (
    'primary_category',
    'enabled_modules',
    'dashboard_preset',
    'pro_onboarded_at',
    'pro_onboarding_answers',
    'full_name',
    'first_name',
    'last_name',
    'phone',
    'photo_uri',
    'storefront_business_name',
    'storefront_category'
  )

union all

-- 1b) Onboarding columns only (should be exactly these 5)
select
  'Onboarding columns' as check_type,
  count(*) as found,
  case
    when count(*) >= 5 then '✓ OK'
    else '✗ MISSING (run 20260107123000)'
  end as status
from information_schema.columns
where table_schema='public'
  and table_name='profiles'
  and column_name in (
    'primary_category',
    'enabled_modules',
    'dashboard_preset',
    'pro_onboarded_at',
    'pro_onboarding_answers'
  )

union all

-- 2) Feed columns
select 
  'Feed columns' as check_type,
  count(*) as found,
  case 
    when count(*) >= 3 then '✓ OK'
    else '✗ MISSING (run 20260107121500)'
  end as status
from information_schema.columns
where table_schema='public' 
  and table_name='feed_posts'
  and column_name in ('owner_business_name','owner_category','location')

union all

-- 3) Upgrade + Onboarding RPCs (these are 2 functions)
select 
  'Upgrade+Onboarding RPCs' as check_type,
  count(*) as found,
  case 
    when count(*) >= 2 then '✓ OK'
    else '✗ MISSING (run 20260107123000)'
  end as status
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public'
  and p.proname in ('self_upgrade_to_business','self_set_pro_onboarding')

union all

-- 4) Profile update RPC
select 
  'Profile RPC' as check_type,
  count(*) as found,
  case 
    when count(*) >= 1 then '✓ OK'
    else '✗ MISSING (run 20260107124000)'
  end as status
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public'
  and p.proname = 'self_update_profile'

union all

-- 5) Developer moderation RPCs
select 
  'Dev moderation RPCs' as check_type,
  count(*) as found,
  case 
    when count(*) >= 2 then '✓ OK'
    else '✗ MISSING (run 20260107120100)'
  end as status
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public'
  and p.proname in ('dev_update_post','dev_bulk_reorder_pins')

union all

-- 6) Auth trigger (auto-create profile)
select 
  'Auth trigger' as check_type,
  count(*) as found,
  case 
    when count(*) >= 1 then '✓ OK'
    else '✗ OPTIONAL (run 20260107121000)'
  end as status
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public'
  and p.proname = 'handle_new_user'

union all

-- 7) Private schema helpers (base security)
select 
  'Base security' as check_type,
  count(*) as found,
  case 
    when count(*) >= 2 then '✓ OK'
    else '✗ MISSING (run 20260107120000)'
  end as status
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='private'
  and p.proname in ('assert','write_audit')

order by check_type;
