-- Auto-create a profile row for each new Auth user.
-- SECURITY: role stays USER by default; no self-elevation.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, role, is_hidden_from_public)
  values (new.id, 'USER', false)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Trigger on Supabase Auth users
-- Note: must be run as an elevated role (e.g., via SQL Editor as postgres).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.handle_new_auth_user() from anon;
revoke execute on function public.handle_new_auth_user() from authenticated;
