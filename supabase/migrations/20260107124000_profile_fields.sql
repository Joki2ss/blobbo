-- Profile fields: anagrafica + storefront (additive)
-- Adds user-editable profile fields to public.profiles.

-- Basic profile fields (all users)
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists photo_uri text;

-- Storefront fields (PRO users only, optional)
alter table public.profiles
  add column if not exists storefront_business_name text,
  add column if not exists storefront_category text,
  add column if not exists storefront_vat_number text,
  add column if not exists storefront_street_address text,
  add column if not exists storefront_street_number text,
  add column if not exists storefront_city text,
  add column if not exists storefront_region text,
  add column if not exists storefront_country text,
  add column if not exists storefront_lat numeric(10,7),
  add column if not exists storefront_lng numeric(10,7),
  add column if not exists storefront_public_enabled boolean not null default false;

-- Self profile update RPC (users can edit their own profile)
create or replace function public.self_update_profile(
  p_full_name text default null,
  p_first_name text default null,
  p_last_name text default null,
  p_phone text default null,
  p_photo_uri text default null,
  p_storefront_business_name text default null,
  p_storefront_category text default null,
  p_storefront_vat_number text default null,
  p_storefront_street_address text default null,
  p_storefront_street_number text default null,
  p_storefront_city text default null,
  p_storefront_region text default null,
  p_storefront_country text default null,
  p_storefront_lat numeric default null,
  p_storefront_lng numeric default null,
  p_storefront_public_enabled boolean default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_row public.profiles;
begin
  v_uid := auth.uid();
  perform private.assert(v_uid is not null, 'Not authenticated');

  -- Ensure profile exists
  insert into public.profiles(user_id, role, is_hidden_from_public)
  values (v_uid, 'USER', false)
  on conflict (user_id) do nothing;

  -- Update only provided fields (null means "don't change")
  update public.profiles
  set
    full_name = coalesce(p_full_name, full_name),
    first_name = coalesce(p_first_name, first_name),
    last_name = coalesce(p_last_name, last_name),
    phone = coalesce(p_phone, phone),
    photo_uri = coalesce(p_photo_uri, photo_uri),
    storefront_business_name = coalesce(p_storefront_business_name, storefront_business_name),
    storefront_category = coalesce(p_storefront_category, storefront_category),
    storefront_vat_number = coalesce(p_storefront_vat_number, storefront_vat_number),
    storefront_street_address = coalesce(p_storefront_street_address, storefront_street_address),
    storefront_street_number = coalesce(p_storefront_street_number, storefront_street_number),
    storefront_city = coalesce(p_storefront_city, storefront_city),
    storefront_region = coalesce(p_storefront_region, storefront_region),
    storefront_country = coalesce(p_storefront_country, storefront_country),
    storefront_lat = coalesce(p_storefront_lat, storefront_lat),
    storefront_lng = coalesce(p_storefront_lng, storefront_lng),
    storefront_public_enabled = coalesce(p_storefront_public_enabled, storefront_public_enabled)
  where user_id = v_uid
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.self_update_profile(text,text,text,text,text,text,text,text,text,text,text,text,text,numeric,numeric,boolean) from public;
revoke execute on function public.self_update_profile(text,text,text,text,text,text,text,text,text,text,text,text,text,numeric,numeric,boolean) from anon;
grant execute on function public.self_update_profile(text,text,text,text,text,text,text,text,text,text,text,text,text,numeric,numeric,boolean) to authenticated;
