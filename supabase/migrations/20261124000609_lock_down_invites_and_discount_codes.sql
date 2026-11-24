-- invites: the policy named "Public read by token" was USING (true), so it
-- exposed every invite — email, role and signup token — to anonymous callers.
-- RLS cannot see the client's WHERE clause, so token scoping has to happen
-- inside SECURITY DEFINER functions instead.

create or replace function public.get_invite_by_token(p_token text)
returns table (email text, full_name text, role text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select i.email, i.full_name, i.role, i.expires_at
  from invites i
  where i.token = p_token
    and i.used_at is null
    and i.expires_at > now();
end;
$$;

comment on function public.get_invite_by_token(text) is
  'Returns a single unused, unexpired invite matching the exact token. Replaces direct anon SELECT on invites, which leaked the whole table.';

create or replace function public.mark_invite_used(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update invites
     set used_at = now()
   where token = p_token
     and used_at is null
     and expires_at > now();
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

comment on function public.mark_invite_used(text) is
  'Marks an invite consumed. Previously signup.html attempted a direct UPDATE, which anon had no policy for, so it always failed silently and invites stayed reusable.';

revoke all on function public.get_invite_by_token(text) from public;
revoke all on function public.mark_invite_used(text)    from public;
grant execute on function public.get_invite_by_token(text) to anon, authenticated;
grant execute on function public.mark_invite_used(text)    to anon, authenticated;

drop policy if exists "Public read by token" on public.invites;

-- discount_codes: anon could read every active code with its value and usage
-- counts. Nothing client-side needs this — /api/validate-discount uses the
-- service role key and increment_discount_use is SECURITY DEFINER, so both
-- bypass RLS. Dashboard CRUD stays covered by "Admins manage codes".
drop policy if exists "Public read active codes" on public.discount_codes;
