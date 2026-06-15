-- Add avatar_url (Google profile picture) to member list and detail functions

-- 1. Update get_admin_member_list with avatar_url
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
        ) AS avatar_url
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

-- 2. Update get_admin_member_detail to include avatar_url in profile
CREATE OR REPLACE FUNCTION public.get_admin_member_detail(p_user_id UUID)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile     json;
  v_progression json;
  v_wallet      json;
  v_game_stats  json;
  v_recent_games json;
  v_inventory   json;
  v_achievements json;
  v_coin_log    json;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Profile (now includes avatar_url)
  SELECT row_to_json(t) INTO v_profile FROM (
    SELECT
      p.id,
      p.username,
      p.display_name,
      p.country,
      p.bio,
      p.is_anonymous,
      p.banned_at,
      p.ban_reason,
      p.created_at,
      p.updated_at,
      au.email,
      au.last_sign_in_at,
      COALESCE(
        au.raw_user_meta_data->>'avatar_url',
        au.raw_user_meta_data->>'picture'
      ) AS avatar_url
    FROM profiles p
    JOIN auth.users au ON au.id = p.id
    WHERE p.id = p_user_id
  ) t;

  -- Progression
  SELECT row_to_json(t) INTO v_progression FROM (
    SELECT level, xp, prestige, current_streak, longest_streak,
           last_daily_played, streak_freezes, updated_at
    FROM user_progression
    WHERE user_id = p_user_id
  ) t;

  -- Wallet
  SELECT row_to_json(t) INTO v_wallet FROM (
    SELECT coins, total_earned, total_spent, updated_at
    FROM user_wallet
    WHERE user_id = p_user_id
  ) t;

  -- Aggregate game stats
  SELECT row_to_json(t) INTO v_game_stats FROM (
    SELECT
      COUNT(*)::int                                           AS total_games,
      COUNT(*) FILTER (WHERE mode = 'daily')::int            AS daily_games,
      COUNT(*) FILTER (WHERE mode = 'practice')::int         AS practice_games,
      MIN(time_seconds)                                       AS best_time,
      ROUND(AVG(time_seconds))::int                          AS avg_time,
      ROUND(AVG(mistakes), 2)                                AS avg_mistakes,
      ROUND(AVG(score))::int                                 AS avg_score,
      MAX(score)                                             AS best_score,
      COUNT(*) FILTER (WHERE mistakes = 0)::int              AS perfect_games
    FROM user_game_history
    WHERE user_id = p_user_id
  ) t;

  -- Recent 15 games
  SELECT json_agg(t ORDER BY t.completed_at DESC) INTO v_recent_games FROM (
    SELECT mode, level, score, time_seconds, mistakes, hints_used,
           daily_date, completed_at
    FROM user_game_history
    WHERE user_id = p_user_id
    ORDER BY completed_at DESC
    LIMIT 15
  ) t;

  -- Inventory
  SELECT json_agg(t ORDER BY t.acquired_at DESC) INTO v_inventory FROM (
    SELECT i.item_id, s.name, s.category, s.rarity, s.price_coin,
           i.acquired_at, i.acquired_from
    FROM user_inventory i
    LEFT JOIN shop_items s ON s.id = i.item_id
    WHERE i.user_id = p_user_id
  ) t;

  -- Achievements
  SELECT json_agg(t ORDER BY t.unlocked_at DESC) INTO v_achievements FROM (
    SELECT ua.achievement_id, ad.name, ad.tier, ad.category,
           ua.unlocked_at
    FROM user_achievements ua
    LEFT JOIN achievements_definitions ad ON ad.id = ua.achievement_id
    WHERE ua.user_id = p_user_id
  ) t;

  -- Coin ledger (last 20)
  SELECT json_agg(t ORDER BY t.created_at DESC) INTO v_coin_log FROM (
    SELECT amount, reason, balance_after, created_at
    FROM coin_transactions
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 20
  ) t;

  RETURN json_build_object(
    'profile',      v_profile,
    'progression',  v_progression,
    'wallet',       v_wallet,
    'game_stats',   v_game_stats,
    'recent_games', COALESCE(v_recent_games, '[]'::json),
    'inventory',    COALESCE(v_inventory,    '[]'::json),
    'achievements', COALESCE(v_achievements, '[]'::json),
    'coin_log',     COALESCE(v_coin_log,     '[]'::json)
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_admin_member_detail(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_admin_member_detail(UUID) TO authenticated;
