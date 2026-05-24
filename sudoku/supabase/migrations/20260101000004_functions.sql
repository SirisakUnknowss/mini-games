-- =====================================================================
-- RPC functions for safe mutations
-- =====================================================================

-- Grant coins atomically + log transaction
CREATE OR REPLACE FUNCTION grant_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Only allow current user or service_role
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_amount = 0 THEN
    SELECT coins INTO v_new_balance FROM user_wallet WHERE user_id = p_user_id;
    RETURN v_new_balance;
  END IF;

  -- Atomic balance update
  UPDATE user_wallet
  SET
    coins = coins + p_amount,
    total_earned = CASE WHEN p_amount > 0 THEN total_earned + p_amount ELSE total_earned END,
    total_spent = CASE WHEN p_amount < 0 THEN total_spent + (-p_amount) ELSE total_spent END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING coins INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'wallet not found for user';
  END IF;

  -- Audit log
  INSERT INTO coin_transactions (user_id, amount, reason, metadata, balance_after)
  VALUES (p_user_id, p_amount, p_reason, p_metadata, v_new_balance);

  RETURN v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION grant_coins TO authenticated;

-- =====================================================================
-- Add XP atomically + handle level up
-- =====================================================================
CREATE OR REPLACE FUNCTION grant_xp(
  p_user_id UUID,
  p_amount INTEGER
) RETURNS TABLE(new_xp BIGINT, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp BIGINT;
  v_level INTEGER;
  v_old_level INTEGER;
  v_xp_for_level INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT xp, level INTO v_xp, v_old_level FROM user_progression WHERE user_id = p_user_id;
  IF v_xp IS NULL THEN
    RAISE EXCEPTION 'progression not found for user';
  END IF;

  v_xp := v_xp + p_amount;
  v_level := v_old_level;

  -- Level up loop (xpForLevel(n) = floor(100 * n^1.6))
  LOOP
    IF v_level >= 100 THEN EXIT; END IF;
    v_xp_for_level := floor(100 * power(v_level, 1.6));
    IF v_xp < v_xp_for_level THEN EXIT; END IF;
    v_xp := v_xp - v_xp_for_level;
    v_level := v_level + 1;
  END LOOP;

  UPDATE user_progression
  SET xp = v_xp, level = v_level, updated_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_xp, v_level, v_level > v_old_level;
END;
$$;

GRANT EXECUTE ON FUNCTION grant_xp TO authenticated;

-- =====================================================================
-- Increment streak after a daily puzzle is submitted
-- =====================================================================
CREATE OR REPLACE FUNCTION bump_streak_for_today(
  p_user_id UUID,
  p_date DATE
) RETURNS TABLE(current_streak INTEGER, longest_streak INTEGER, is_new_milestone BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last DATE;
  v_current INTEGER;
  v_longest INTEGER;
  v_milestone BOOLEAN := false;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT last_daily_played, current_streak, longest_streak
  INTO v_last, v_current, v_longest
  FROM user_progression WHERE user_id = p_user_id;

  IF v_last IS NULL OR p_date = v_last + interval '1 day' THEN
    v_current := COALESCE(v_current, 0) + 1;
  ELSIF p_date = v_last THEN
    -- Already played today, no change
    NULL;
  ELSE
    v_current := 1;  -- reset
  END IF;

  IF v_current > COALESCE(v_longest, 0) THEN
    v_longest := v_current;
  END IF;

  -- Milestone every 7 days
  IF v_current IN (3, 7, 14, 30, 50, 100, 200, 365) THEN
    v_milestone := true;
  END IF;

  UPDATE user_progression
  SET current_streak = v_current,
      longest_streak = v_longest,
      last_daily_played = p_date,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current, v_longest, v_milestone;
END;
$$;

GRANT EXECUTE ON FUNCTION bump_streak_for_today TO authenticated;
