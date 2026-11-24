-- Postgres grants EXECUTE to PUBLIC by default, which shows in proacl as the
-- grantee-less "=X/postgres" entry. anon inherits PUBLIC, so the previous
-- "revoke execute ... from anon" did nothing. The PUBLIC grant itself has to go.

-- get_all_staff: dashboard.html is the only caller and is always authenticated.
revoke execute on function public.get_all_staff() from public;
grant  execute on function public.get_all_staff() to authenticated;

-- increment_discount_use: booking.html calls this anonymously, so anon keeps
-- access — but state it explicitly rather than leaning on the PUBLIC default.
revoke execute on function public.increment_discount_use(text) from public;
grant  execute on function public.increment_discount_use(text) to anon, authenticated;
