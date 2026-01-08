-- Multi-tenant foundations: organizations + membership + org scoping (additive)
-- Goal: enforce tenant isolation at DB level via organization_id.
-- Compatibility: create a default org and backfill existing rows into it.

-- Ensure required schemas/extensions exist
create extension if not exists "pgcrypto";
create schema if not exists private;

-- Stable default organization UUID (keeps behavior predictable)
-- This is NOT secret; it's just a deterministic identifier.
-- Future orgs can be created normally with gen_random_uuid().
create or replace function private.default_org_id()
returns uuid
language sql
stable
as $$
  select '00000000-0000-0000-0000-000000000001'::uuid;
$$;

-- Organizations (tenants)
create table if not exists public.organizations (
  org_id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  created_by_user_id uuid null references public.profiles(user_id)
);

-- Membership + contextual role within org
create table if not exists public.organization_members (
  org_id uuid not null references public.organizations(org_id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role text not null check (role in ('owner','admin','staff','client')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists organization_members_user_id_idx on public.organization_members(user_id);

-- Create default org if missing
insert into public.organizations (org_id, name)
values (private.default_org_id(), 'Default')
on conflict (org_id) do nothing;

-- Helper: current org id for the signed-in user.
-- Future: can be extended to support org switching.
create or replace function private.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select om.org_id
     from public.organization_members om
     where om.user_id = auth.uid()
     order by om.created_at asc
     limit 1),
    private.default_org_id()
  );
$$;

-- Add org column to profiles (primary/default org)
alter table public.profiles
  add column if not exists organization_id uuid references public.organizations(org_id);

update public.profiles
set organization_id = private.default_org_id()
where organization_id is null;

alter table public.profiles
  alter column organization_id set default private.default_org_id();

-- Backfill membership for existing users
insert into public.organization_members (org_id, user_id, role)
select
  private.default_org_id(),
  p.user_id,
  case
    when upper(p.role) in ('BUSINESS','ADMIN') then 'admin'
    when upper(p.role) = 'DEVELOPER' then 'owner'
    else 'client'
  end
from public.profiles p
on conflict (org_id, user_id) do nothing;

-- Add org column to feed_posts and audit_log
alter table public.feed_posts
  add column if not exists organization_id uuid references public.organizations(org_id);
update public.feed_posts
set organization_id = private.default_org_id()
where organization_id is null;
alter table public.feed_posts
  alter column organization_id set default private.default_org_id();

alter table public.audit_log
  add column if not exists organization_id uuid references public.organizations(org_id);
update public.audit_log
set organization_id = private.default_org_id()
where organization_id is null;
alter table public.audit_log
  alter column organization_id set default private.default_org_id();

-- Ensure new users get a profile + default org membership (extends existing trigger)
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
begin
  v_org_id := private.default_org_id();

  insert into public.profiles (user_id, role, is_hidden_from_public, organization_id)
  values (new.id, 'USER', false, v_org_id)
  on conflict (user_id) do update
    set organization_id = coalesce(public.profiles.organization_id, excluded.organization_id);

  insert into public.organization_members (org_id, user_id, role)
  values (v_org_id, new.id, 'client')
  on conflict (org_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.handle_new_auth_user() from anon;
revoke execute on function public.handle_new_auth_user() from authenticated;

-- RLS: organizations
alter table public.organizations enable row level security;

drop policy if exists "org_select_member" on public.organizations;
create policy "org_select_member"
on public.organizations
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.org_id = organizations.org_id
      and om.user_id = auth.uid()
  )
);

drop policy if exists "org_insert_self" on public.organizations;
create policy "org_insert_self"
on public.organizations
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "org_update_owner" on public.organizations;
create policy "org_update_owner"
on public.organizations
for update
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.org_id = organizations.org_id
      and om.user_id = auth.uid()
      and om.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.organization_members om
    where om.org_id = organizations.org_id
      and om.user_id = auth.uid()
      and om.role = 'owner'
  )
);

drop policy if exists "org_delete_owner" on public.organizations;
create policy "org_delete_owner"
on public.organizations
for delete
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.org_id = organizations.org_id
      and om.user_id = auth.uid()
      and om.role = 'owner'
  )
);

-- RLS: organization_members
alter table public.organization_members enable row level security;

drop policy if exists "org_members_select_admin_or_self" on public.organization_members;
create policy "org_members_select_admin_or_self"
on public.organization_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.organization_members me
    where me.org_id = organization_members.org_id
      and me.user_id = auth.uid()
      and me.role in ('owner','admin')
  )
);

drop policy if exists "org_members_insert_admin" on public.organization_members;
create policy "org_members_insert_admin"
on public.organization_members
for insert
to authenticated
with check (
  auth.uid() is not null
  and exists (
    select 1
    from public.organization_members me
    where me.org_id = organization_members.org_id
      and me.user_id = auth.uid()
      and me.role in ('owner','admin')
  )
  and organization_members.role in ('admin','staff','client')
);

drop policy if exists "org_members_update_owner" on public.organization_members;
create policy "org_members_update_owner"
on public.organization_members
for update
to authenticated
using (
  exists (
    select 1
    from public.organization_members me
    where me.org_id = organization_members.org_id
      and me.user_id = auth.uid()
      and me.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.organization_members me
    where me.org_id = organization_members.org_id
      and me.user_id = auth.uid()
      and me.role = 'owner'
  )
);

drop policy if exists "org_members_delete_owner" on public.organization_members;
create policy "org_members_delete_owner"
on public.organization_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.organization_members me
    where me.org_id = organization_members.org_id
      and me.user_id = auth.uid()
      and me.role = 'owner'
  )
);

-- Scope feed_posts by org (additive policies)
-- Public browsing within current org (keeps existing view usable)
drop policy if exists "feed_posts_select_org_public" on public.feed_posts;
create policy "feed_posts_select_org_public"
on public.feed_posts
for select
to authenticated
using (
  organization_id = (select private.current_org_id())
  and visibility_status = 'ACTIVE'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = feed_posts.owner_user_id
      and p.is_hidden_from_public = false
  )
);

-- Tighten owner insert/update/delete to remain org-scoped
drop policy if exists "feed_posts_insert_owner" on public.feed_posts;
create policy "feed_posts_insert_owner"
on public.feed_posts
for insert
to authenticated
with check (
  auth.uid() is not null
  and owner_user_id = auth.uid()
  and organization_id = (select private.current_org_id())
  and pinned_rank is null
  and moderation_tags = array[]::text[]
  and last_moderated_by_user_id is null
  and last_moderated_at is null
  and author_role in ('USER','BUSINESS')
);

drop policy if exists "feed_posts_update_owner" on public.feed_posts;
create policy "feed_posts_update_owner"
on public.feed_posts
for update
to authenticated
using (auth.uid() is not null and owner_user_id = auth.uid() and organization_id = (select private.current_org_id()))
with check (
  auth.uid() is not null
  and owner_user_id = auth.uid()
  and organization_id = (select private.current_org_id())
  -- Owners can edit content but cannot change moderation / platform fields.
  and visibility_status = (select fp.visibility_status from public.feed_posts fp where fp.post_id = feed_posts.post_id)
  and pinned_rank is not distinct from (select fp.pinned_rank from public.feed_posts fp where fp.post_id = feed_posts.post_id)
  and moderation_tags = (select fp.moderation_tags from public.feed_posts fp where fp.post_id = feed_posts.post_id)
  and author_role = (select fp.author_role from public.feed_posts fp where fp.post_id = feed_posts.post_id)
  and last_moderated_by_user_id is not distinct from (select fp.last_moderated_by_user_id from public.feed_posts fp where fp.post_id = feed_posts.post_id)
  and last_moderated_at is not distinct from (select fp.last_moderated_at from public.feed_posts fp where fp.post_id = feed_posts.post_id)
  and organization_id = (select fp.organization_id from public.feed_posts fp where fp.post_id = feed_posts.post_id)
);

drop policy if exists "feed_posts_delete_owner" on public.feed_posts;
create policy "feed_posts_delete_owner"
on public.feed_posts
for delete
to authenticated
using (auth.uid() is not null and owner_user_id = auth.uid() and organization_id = (select private.current_org_id()));

-- Scope audit_log by org for org admins/owners (developers keep access via existing policy)
-- Note: audit_log inserts are still restricted to RPCs only.
drop policy if exists "audit_log_select_org_admin" on public.audit_log;
create policy "audit_log_select_org_admin"
on public.audit_log
for select
to authenticated
using (
  organization_id = (select private.current_org_id())
  and exists (
    select 1
    from public.organization_members me
    where me.org_id = audit_log.organization_id
      and me.user_id = auth.uid()
      and me.role in ('owner','admin')
  )
);

-- Update private.write_audit to include organization_id (keep signature stable)
create or replace function private.write_audit(
  p_actor_user_id uuid,
  p_action_type text,
  p_target_type text,
  p_target_id uuid,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
begin
  v_org_id := private.current_org_id();
  insert into public.audit_log(organization_id, actor_user_id, action_type, target_type, target_id, metadata)
  values (v_org_id, p_actor_user_id, p_action_type, p_target_type, p_target_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;
