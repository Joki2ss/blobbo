-- Supabase schema: hardened RBAC + feed moderation + immutable audit log
-- Additive: does not remove existing app-side MOCK data; intended for LIVE/CLOUD mode.

-- Extensions
create extension if not exists "pgcrypto";

-- Private schema for security-definer helpers (do NOT expose in Supabase API schemas)
create schema if not exists private;

-- Helper: current user id
create or replace function private.uid()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

-- Profiles: DB-owned role source of truth
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'USER' check (role in ('USER','BUSINESS','ADMIN','DEVELOPER')),
  is_hidden_from_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Feed posts (server-side canonical version)
create table if not exists public.feed_posts (
  post_id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(user_id) on delete cascade,

  plan_type text not null,
  is_permanent boolean not null default false,

  title text not null,
  description text not null,

  keywords text[] not null default array[]::text[],
  images jsonb not null default '[]'::jsonb,
  ranking_score integer not null default 0,

  visibility_status text not null default 'ACTIVE' check (visibility_status in ('ACTIVE','PAUSED','EXPIRED','DELETED')),

  pinned_rank integer null check (pinned_rank is null or (pinned_rank >= 1 and pinned_rank <= 500)),
  moderation_tags text[] not null default array[]::text[],

  last_moderated_by_user_id uuid null references public.profiles(user_id),
  last_moderated_at timestamptz null,

  author_role text not null default 'USER' check (author_role in ('USER','BUSINESS','ADMIN','DEVELOPER')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feed_posts_owner_user_id_idx on public.feed_posts(owner_user_id);
create index if not exists feed_posts_visibility_status_idx on public.feed_posts(visibility_status);
create index if not exists feed_posts_pinned_rank_idx on public.feed_posts(pinned_rank) where pinned_rank is not null;

-- Immutable audit log
create table if not exists public.audit_log (
  audit_id bigserial primary key,
  created_at timestamptz not null default now(),
  actor_user_id uuid not null references public.profiles(user_id),
  action_type text not null,
  target_type text not null,
  target_id uuid null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists audit_log_actor_user_id_idx on public.audit_log(actor_user_id);
create index if not exists audit_log_target_idx on public.audit_log(target_type, target_id);

-- updated_at triggers
create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

drop trigger if exists set_feed_posts_updated_at on public.feed_posts;
create trigger set_feed_posts_updated_at
before update on public.feed_posts
for each row
execute function private.set_updated_at();

-- Security helper: developer role from DB (preferred over JWT user_metadata)
create or replace function private.is_developer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'DEVELOPER'
  );
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.feed_posts enable row level security;
alter table public.audit_log enable row level security;

-- PROFILES policies
-- Users can read their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

-- Users can update their own profile EXCEPT role/hidden flag is protected by RPC in production.
-- (We still permit basic updates later; for now keep update locked down.)
drop policy if exists "profiles_update_own" on public.profiles;
-- SECURITY: do not allow direct profile updates from clients.
-- This prevents self-elevation (e.g., changing role to DEVELOPER).

-- Allow authenticated users to insert their own profile row
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and role = 'USER'
  and is_hidden_from_public = false
);

-- FEED_POSTS policies
-- Public-safe read is via view below. Direct table select is restricted to owners and developers.
drop policy if exists "feed_posts_select_owner" on public.feed_posts;
create policy "feed_posts_select_owner"
on public.feed_posts
for select
to authenticated
using ((select auth.uid()) is not null and owner_user_id = (select auth.uid()));

drop policy if exists "feed_posts_select_developer" on public.feed_posts;
create policy "feed_posts_select_developer"
on public.feed_posts
for select
to authenticated
using ((select private.is_developer()));

-- Owners can insert/update their own posts (basic app behavior)
drop policy if exists "feed_posts_insert_owner" on public.feed_posts;
create policy "feed_posts_insert_owner"
on public.feed_posts
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and owner_user_id = (select auth.uid())
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
using ((select auth.uid()) is not null and owner_user_id = (select auth.uid()))
with check (
  (select auth.uid()) is not null
  and owner_user_id = (select auth.uid())
  -- Owners can edit content but cannot change moderation / platform fields.
  and visibility_status = (select fp.visibility_status from public.feed_posts fp where fp.post_id = feed_posts.post_id)
  and pinned_rank is not distinct from (select fp.pinned_rank from public.feed_posts fp where fp.post_id = feed_posts.post_id)
  and moderation_tags = (select fp.moderation_tags from public.feed_posts fp where fp.post_id = feed_posts.post_id)
  and author_role = (select fp.author_role from public.feed_posts fp where fp.post_id = feed_posts.post_id)
  and last_moderated_by_user_id is not distinct from (select fp.last_moderated_by_user_id from public.feed_posts fp where fp.post_id = feed_posts.post_id)
  and last_moderated_at is not distinct from (select fp.last_moderated_at from public.feed_posts fp where fp.post_id = feed_posts.post_id)
);

-- Developers can update via RPC; we do not grant a blanket update policy here.

-- AUDIT_LOG policies
-- No direct inserts/updates/deletes from client; only via RPC.
-- Developers can read for moderation review.
drop policy if exists "audit_log_select_developer" on public.audit_log;
create policy "audit_log_select_developer"
on public.audit_log
for select
to authenticated
using ((select private.is_developer()));

-- Safe public view for feed browsing.
-- SECURITY: use security_invoker so underlying RLS applies.
-- Do not grant anon/auth access by default.
create or replace view public.public_feed_posts
with (security_invoker = true)
as
select
  fp.post_id,
  fp.plan_type,
  fp.is_permanent,
  fp.title,
  fp.description,
  fp.keywords,
  fp.images,
  fp.ranking_score,
  fp.visibility_status,
  fp.pinned_rank,
  fp.moderation_tags,
  fp.author_role,
  fp.created_at,
  fp.updated_at
from public.feed_posts fp
join public.profiles p on p.user_id = fp.owner_user_id
where fp.visibility_status = 'ACTIVE'
  and p.is_hidden_from_public = false;

revoke all on public.public_feed_posts from public;
revoke all on public.public_feed_posts from anon;
revoke all on public.public_feed_posts from authenticated;

-- Privileges hardening (defense in depth):
-- Only expose what the app needs. Public reads should go through safe views.
revoke all on table public.profiles from anon;
revoke all on table public.feed_posts from anon;
revoke all on table public.audit_log from anon;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.feed_posts to authenticated;
grant select on table public.audit_log to authenticated;

-- Note: no grants for private schema.
