-- Fix get_visitor_stats() function to calculate and return all visitor/session metrics expected by the client
CREATE OR REPLACE FUNCTION public.get_visitor_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_online          BIGINT;
  v_online_guests   BIGINT;
  v_online_members  BIGINT;

  v_today           BIGINT;
  v_today_guests    BIGINT;
  v_today_members   BIGINT;

  v_week            BIGINT;
  v_total           BIGINT;
BEGIN
  -- Clean up stale online sessions (> 2 minutes)
  DELETE FROM online_sessions WHERE last_seen < now() - interval '2 minutes';

  -- Calculate online counts
  SELECT COUNT(*), 
         COUNT(*) FILTER (WHERE is_guest = true), 
         COUNT(*) FILTER (WHERE is_guest = false)
    INTO v_online, v_online_guests, v_online_members
    FROM online_sessions;

  -- Calculate today's counts
  SELECT COUNT(*), 
         COUNT(*) FILTER (WHERE is_guest = true), 
         COUNT(*) FILTER (WHERE is_guest = false)
    INTO v_today, v_today_guests, v_today_members
    FROM visitor_sessions
   WHERE visited_date = CURRENT_DATE;

  -- Calculate last 7 days unique sessions
  SELECT COUNT(DISTINCT session_id)
    INTO v_week
    FROM visitor_sessions
   WHERE visited_date >= CURRENT_DATE - INTERVAL '6 days';

  -- Calculate total unique sessions
  SELECT COUNT(DISTINCT session_id)
    INTO v_total
    FROM visitor_sessions;

  RETURN json_build_object(
    'online',          COALESCE(v_online, 0),
    'online_guests',   COALESCE(v_online_guests, 0),
    'online_members',  COALESCE(v_online_members, 0),
    'today',           COALESCE(v_today, 0),
    'today_guests',    COALESCE(v_today_guests, 0),
    'today_members',   COALESCE(v_today_members, 0),
    'week',            COALESCE(v_week, 0),
    'total',           COALESCE(v_total, 0)
  );
END;
$function$;
