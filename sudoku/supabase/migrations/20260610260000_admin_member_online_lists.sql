-- Add admin helper functions for member list and online user list

-- 1. List all registered (non-anonymous) members
CREATE OR REPLACE FUNCTION public.get_admin_member_list()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Security: admin only
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN (
    SELECT json_agg(t ORDER BY t.created_at DESC)
    FROM (
      SELECT
        p.id,
        p.username,
        COALESCE(p.display_name, p.username) AS display_name,
        p.country,
        p.created_at,
        p.banned_at IS NOT NULL AS is_banned,
        COALESCE(w.coins, 0) AS coins
      FROM profiles p
      LEFT JOIN user_wallet w ON w.user_id = p.id
      WHERE p.is_anonymous = false
      LIMIT 200
    ) t
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_admin_member_list() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_member_list() TO authenticated;

-- 2. List currently online sessions (active within last 2 minutes)
--    For members: join with profiles to get display name
--    For guests: show "Guest"
CREATE OR REPLACE FUNCTION public.get_admin_online_list()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Security: admin only
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Clean stale sessions first
  DELETE FROM online_sessions WHERE last_seen < now() - interval '2 minutes';

  RETURN (
    SELECT json_agg(t ORDER BY t.last_seen DESC)
    FROM (
      SELECT
        os.session_id,
        os.is_guest,
        os.last_seen,
        CASE
          WHEN os.is_guest = false THEN COALESCE(p.display_name, p.username, 'Member')
          ELSE NULL
        END AS display_name,
        CASE
          WHEN os.is_guest = false THEN p.username
          ELSE NULL
        END AS username
      FROM online_sessions os
      LEFT JOIN profiles p ON p.id = os.session_id AND os.is_guest = false
    ) t
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_admin_online_list() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_online_list() TO authenticated;
