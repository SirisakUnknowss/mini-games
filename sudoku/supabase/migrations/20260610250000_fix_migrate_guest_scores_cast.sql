-- Fix migrate_guest_scores(): cast guest level::text to difficulty_enum explicitly
CREATE OR REPLACE FUNCTION public.migrate_guest_scores(p_session_id uuid, p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  migrated INT := 0;
BEGIN
  -- Insert unclaimed guest history into user_game_history
  -- Cast level from text -> difficulty_enum explicitly
  INSERT INTO user_game_history (
    user_id, mode, daily_date, level,
    time_seconds, mistakes, hints_used, score, completed_at
  )
  SELECT
    p_user_id,
    mode,
    daily_date,
    level::difficulty_enum,
    time_seconds,
    mistakes,
    hints_used,
    score,
    completed_at
  FROM guest_game_history
  WHERE session_id = p_session_id
    AND claimed_user_id IS NULL
    AND level IS NOT NULL
    AND level::text IN (
      SELECT unnest(enum_range(NULL::difficulty_enum))::text
    )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS migrated = ROW_COUNT;

  -- Mark as claimed (including rows with invalid/null level)
  UPDATE guest_game_history
     SET claimed_user_id = p_user_id
   WHERE session_id = p_session_id
     AND claimed_user_id IS NULL;

  RETURN migrated;
END;
$function$;
