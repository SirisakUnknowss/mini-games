-- Add user_id to online_sessions so admin can see who is online now

ALTER TABLE public.online_sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS online_sessions_user_id_idx ON public.online_sessions(user_id)
  WHERE user_id IS NOT NULL;

-- Update get_admin_member_list to include is_online flag
CREATE OR REPLACE FUNCTION public.get_admin_member_list()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Clean up stale sessions first
  DELETE FROM online_sessions WHERE last_seen < now() - interval '2 minutes';

  RETURN (
    SELECT json_agg(t ORDER BY t.created_at DESC)
    FROM (
      SELECT
        p.id,
        p.username,
        COALESCE(p.display_name, p.username) AS display_name,
        p.country,
        p.created_at,
        p.banned_at IS NOT NULL        AS is_banned,
        COALESCE(w.coins, 0)           AS coins,
        COALESCE(prog.level, 1)        AS level,
        COALESCE(prog.xp, 0)           AS xp,
        COALESCE(prog.current_streak, 0) AS current_streak,
        prog.last_daily_played,
        prog.updated_at                AS last_active,
        (SELECT COUNT(*) FROM user_game_history h WHERE h.user_id = p.id)::int AS game_count,
        COALESCE(
          au.raw_user_meta_data->>'avatar_url',
          au.raw_user_meta_data->>'picture'
        ) AS avatar_url,
        EXISTS (
          SELECT 1 FROM online_sessions os
          WHERE os.user_id = p.id
        ) AS is_online
      FROM profiles p
      JOIN auth.users au ON au.id = p.id
      LEFT JOIN user_wallet      w    ON w.user_id    = p.id
      LEFT JOIN user_progression prog ON prog.user_id = p.id
      WHERE p.is_anonymous = false
      LIMIT 500
    ) t
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_admin_member_list() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_admin_member_list() TO authenticated;
