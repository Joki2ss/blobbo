-- Developer-only moderation RPCs (server-side enforcement)

-- Ensure private schema exists
create schema if not exists private;

-- Helper: raise nice errors
create or replace function private.assert(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if not condition then
    raise exception '%', message;
  end if;
end;
$$;

-- Enforce developer role from DB for RPCs
create or replace function private.require_developer()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert(auth.uid() is not null, 'Not authenticated');
  perform private.assert((select private.is_developer()), 'Not authorized');
end;
$$;

-- Immutable audit writer (centralized)
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
begin
  insert into public.audit_log(actor_user_id, action_type, target_type, target_id, metadata)
  values (p_actor_user_id, p_action_type, p_target_type, p_target_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

-- Developer: update a post with moderation fields (and/or visibility)
create or replace function public.dev_update_post(
  p_post_id uuid,
  p_visibility_status text default null,
  p_pinned_rank integer default null,
  p_moderation_tags text[] default null,
  p_reason text default null
)
returns public.feed_posts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_row public.feed_posts;
  v_visibility text;
  v_action text;
  v_meta jsonb;
begin
  perform private.require_developer();

  v_actor := auth.uid();

  select * into v_row
  from public.feed_posts
  where post_id = p_post_id;

  perform private.assert(v_row.post_id is not null, 'Post not found');

  -- Normalize visibility
  if p_visibility_status is null then
    v_visibility := v_row.visibility_status;
  else
    v_visibility := upper(trim(p_visibility_status));
  end if;

  perform private.assert(v_visibility in ('ACTIVE','PAUSED','EXPIRED','DELETED'), 'Invalid visibility_status');

  -- Validate pinned rank if provided (null allowed)
  if p_pinned_rank is not null then
    perform private.assert(p_pinned_rank >= 1 and p_pinned_rank <= 500, 'pinned_rank must be 1..500');
  end if;

  update public.feed_posts
  set
    visibility_status = v_visibility,
    pinned_rank = coalesce(p_pinned_rank, pinned_rank),
    moderation_tags = coalesce(p_moderation_tags, moderation_tags),
    last_moderated_by_user_id = v_actor,
    last_moderated_at = now()
  where post_id = p_post_id
  returning * into v_row;

  -- Choose audit action
  if v_visibility = 'DELETED' then
    v_action := 'POST_DELETE';
  elsif v_visibility = 'PAUSED' then
    v_action := 'POST_HIDE';
  else
    v_action := 'POST_EDIT';
  end if;

  v_meta := jsonb_build_object(
    'reason', nullif(trim(coalesce(p_reason, '')), ''),
    'visibility_status', v_visibility,
    'pinned_rank', v_row.pinned_rank,
    'moderation_tags', v_row.moderation_tags
  );

  perform private.write_audit(v_actor, v_action, 'post', p_post_id, v_meta);

  return v_row;
end;
$$;

revoke execute on function public.dev_update_post(uuid, text, integer, text[], text) from public;
revoke execute on function public.dev_update_post(uuid, text, integer, text[], text) from anon;
grant execute on function public.dev_update_post(uuid, text, integer, text[], text) to authenticated;

-- Developer: bulk reorder pinned ranks.
-- Input is list of {post_id, pinned_rank}. Normalizes duplicates by keeping the *first* occurrence.
create or replace function public.dev_bulk_reorder_pins(
  p_items jsonb,
  p_reason text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_count integer := 0;
  v_rows integer := 0;
  v_seen jsonb := '{}'::jsonb;
  v_item jsonb;
  v_post_id uuid;
  v_rank integer;
  v_meta jsonb;
begin
  perform private.require_developer();
  v_actor := auth.uid();

  perform private.assert(jsonb_typeof(p_items) = 'array', 'items must be a JSON array');

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_post_id := null;
    v_rank := null;

    begin
      v_post_id := (v_item ->> 'post_id')::uuid;
    exception when others then
      raise exception 'Invalid post_id in items';
    end;

    if (v_item ? 'pinned_rank') and (v_item -> 'pinned_rank') is not null then
      begin
        v_rank := (v_item ->> 'pinned_rank')::integer;
      exception when others then
        raise exception 'Invalid pinned_rank in items';
      end;
      perform private.assert(v_rank >= 1 and v_rank <= 500, 'pinned_rank must be 1..500');
    end if;

    -- de-dup by post_id (keep first)
    if (v_seen ? (v_post_id::text)) then
      continue;
    end if;
    v_seen := v_seen || jsonb_build_object(v_post_id::text, true);

    update public.feed_posts
    set
      pinned_rank = v_rank,
      last_moderated_by_user_id = v_actor,
      last_moderated_at = now()
    where post_id = v_post_id;

    get diagnostics v_rows = row_count;
    v_count := v_count + v_rows;
  end loop;

  v_meta := jsonb_build_object(
    'reason', nullif(trim(coalesce(p_reason, '')), ''),
    'count', v_count
  );
  perform private.write_audit(v_actor, 'POST_REORDER_PINS', 'post', null, v_meta);

  return v_count;
end;
$$;

revoke execute on function public.dev_bulk_reorder_pins(jsonb, text) from public;
revoke execute on function public.dev_bulk_reorder_pins(jsonb, text) from anon;
grant execute on function public.dev_bulk_reorder_pins(jsonb, text) to authenticated;
