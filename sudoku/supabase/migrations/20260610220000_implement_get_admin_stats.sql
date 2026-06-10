-- Implement get_admin_stats() function for Admin Dashboard
CREATE OR REPLACE FUNCTION public.get_admin_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_online_now              INT;
  v_online_guests           INT;
  v_online_members          INT;

  v_visitors_today          INT;
  v_visitors_guests_today   INT;
  v_visitors_members_today  INT;

  v_visitors_week           INT;
  v_visitors_total          INT;

  v_total_members           INT;

  v_games_members_today     INT;
  v_games_guests_today      INT;
  v_games_members_total     INT;
  v_games_guests_total      INT;

  v_trend                   JSON;
  v_diff_breakdown          JSON;
  v_hourly                  JSON;
BEGIN
  -- Security: Check if user is the designated admin
  IF auth.uid() IS NULL OR auth.uid()::text <> 'a2dac4b1-a905-4838-ae30-9c32d395da80' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- 1. Online stats (active in last 2 minutes)
  DELETE FROM online_sessions WHERE last_seen < now() - interval '2 minutes';
  
  SELECT COALESCE(COUNT(*), 0),
         COALESCE(COUNT(*) FILTER (WHERE is_guest = true), 0),
         COALESCE(COUNT(*) FILTER (WHERE is_guest = false), 0)
    INTO v_online_now, v_online_guests, v_online_members
    FROM online_sessions;

  -- 2. Visitors stats
  SELECT COALESCE(COUNT(*), 0),
         COALESCE(COUNT(*) FILTER (WHERE is_guest = true), 0),
         COALESCE(COUNT(*) FILTER (WHERE is_guest = false), 0)
    INTO v_visitors_today, v_visitors_guests_today, v_visitors_members_today
    FROM visitor_sessions
   WHERE visited_date = CURRENT_DATE;

  SELECT COALESCE(COUNT(DISTINCT session_id), 0)
    INTO v_visitors_week
    FROM visitor_sessions
   WHERE visited_date >= CURRENT_DATE - INTERVAL '6 days';

  SELECT COALESCE(COUNT(DISTINCT session_id), 0)
    INTO v_visitors_total
    FROM visitor_sessions;

  -- 3. Total registered members (exclude anonymous accounts)
  SELECT COALESCE(COUNT(*), 0)
    INTO v_total_members
    FROM profiles
   WHERE is_anonymous = false;

  -- 4. Games played stats
  SELECT COALESCE(COUNT(*), 0)
    INTO v_games_members_today
    FROM user_game_history
   WHERE completed_at::date = CURRENT_DATE;

  SELECT COALESCE(COUNT(*), 0)
    INTO v_games_guests_today
    FROM guest_game_history
   WHERE completed_at::date = CURRENT_DATE;

  SELECT COALESCE(COUNT(*), 0)
    INTO v_games_members_total
    FROM user_game_history;

  SELECT COALESCE(COUNT(*), 0)
    INTO v_games_guests_total
    FROM guest_game_history;

  -- 5. Trend: 14-day visitor trend
  SELECT json_agg(t) INTO v_trend
  FROM (
    SELECT 
      visited_date::text AS d,
      COALESCE(COUNT(*) FILTER (WHERE is_guest = true), 0) AS guests,
      COALESCE(COUNT(*) FILTER (WHERE is_guest = false), 0) AS members
    FROM visitor_sessions
    WHERE visited_date >= CURRENT_DATE - INTERVAL '13 days'
    GROUP BY visited_date
    ORDER BY visited_date ASC
  ) t;

  -- 6. Difficulty breakdown
  SELECT json_agg(t) INTO v_diff_breakdown
  FROM (
    SELECT 
      level::text AS difficulty,
      COALESCE(COUNT(*), 0) AS cnt,
      COALESCE(AVG(score)::int, 0) AS avg_score,
      COALESCE(AVG(time_seconds)::int, 0) AS avg_time,
      COALESCE(AVG(mistakes)::numeric(4,1), 0.0) AS avg_mistakes
    FROM (
      SELECT score, time_seconds, mistakes, level FROM user_game_history
      UNION ALL
      SELECT score, time_seconds, mistakes, level FROM guest_game_history
    ) combined
    GROUP BY level
    ORDER BY 
      CASE level::text
        WHEN 'easy' THEN 1
        WHEN 'easy-medium' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'medium-hard' THEN 4
        WHEN 'hard' THEN 5
        WHEN 'hard-expert' THEN 6
        WHEN 'expert' THEN 7
        ELSE 8
      END
  ) t;

  -- 7. Hourly activity today (Bangkok timezone: UTC+7)
  SELECT json_agg(t) INTO v_hourly
  FROM (
    SELECT 
      EXTRACT(HOUR FROM (completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'))::int AS hr,
      COUNT(*)::int AS cnt
    FROM (
      SELECT completed_at FROM user_game_history WHERE completed_at::date = CURRENT_DATE
      UNION ALL
      SELECT completed_at FROM guest_game_history WHERE completed_at::date = CURRENT_DATE
    ) combined
    GROUP BY hr
    ORDER BY hr ASC
  ) t;

  RETURN json_build_object(
    'online_now',             v_online_now,
    'online_guests',          v_online_guests,
    'online_members',         v_online_members,
    'visitors_today',         v_visitors_today,
    'visitors_guests_today',  v_visitors_guests_today,
    'visitors_members_today', v_visitors_members_today,
    'visitors_week',          v_visitors_week,
    'visitors_total',         v_visitors_total,
    'total_members',          v_total_members,
    'games_members_today',    v_games_members_today,
    'games_guests_today',     v_games_guests_today,
    'games_members_total',    v_games_members_total,
    'games_guests_total',     v_games_guests_total,
    'trend_14d',              COALESCE(v_trend, '[]'::json),
    'difficulty_breakdown',   COALESCE(v_diff_breakdown, '[]'::json),
    'hourly_today',           COALESCE(v_hourly, '[]'::json)
  );
END;
$function$;

-- Security permissions
REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
