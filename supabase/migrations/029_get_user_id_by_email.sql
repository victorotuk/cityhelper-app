-- Replaces admin.listUsers() calls in Edge Functions.
-- Returns {id, email} for a single user by email, using the indexed auth.users table.
-- SECURITY DEFINER so Edge Functions can query auth.users via service_role.

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(lookup_email text)
RETURNS TABLE(id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT au.id, au.email::text
  FROM auth.users au
  WHERE lower(au.email) = lower(lookup_email)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;
