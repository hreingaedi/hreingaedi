-- NOTE: this migration was a NO-OP. Kept so the repo mirrors the migration
-- history Supabase recorded. See the next migration for the working fix:
-- EXECUTE was held by PUBLIC, which anon inherits, so revoking from anon
-- specifically changed nothing.
revoke execute on function public.get_all_staff() from anon;
