-- Cloud feed support (additive)
-- Adds missing columns used by the existing app feed UI and safely grants authenticated read on the public feed view.

-- 1) Add app-facing columns to feed_posts (non-breaking)
alter table public.feed_posts
  add column if not exists owner_business_name text,
  add column if not exists owner_category text,
  add column if not exists location jsonb;

-- 2) Recreate the public view to include these columns
-- NOTE: Postgres cannot change column names/order with CREATE OR REPLACE VIEW.
-- Drop first to allow evolution of the view definition.
drop view if exists public.public_feed_posts;

create view public.public_feed_posts
with (security_invoker = true)
as
select
  fp.post_id,
  fp.owner_user_id,
  fp.owner_business_name,
  fp.owner_category,
  fp.location,
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

-- 3) Minimal access for signed-in users to browse the public feed.
-- Still deny-by-default for anon.
revoke all on public.public_feed_posts from public;
revoke all on public.public_feed_posts from anon;
grant select on public.public_feed_posts to authenticated;

-- 4) Allow owners to delete their own posts (PostEditor uses a delete action).
-- This is NOT a chat-delete semantic; posts are independent objects.
drop policy if exists "feed_posts_delete_owner" on public.feed_posts;
create policy "feed_posts_delete_owner"
on public.feed_posts
for delete
to authenticated
using ((select auth.uid()) is not null and owner_user_id = (select auth.uid()));
