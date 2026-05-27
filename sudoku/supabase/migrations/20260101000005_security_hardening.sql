-- =====================================================================
-- Security hardening — fix advisors (security_invoker views, search_path, perms)
-- =====================================================================

DROP VIEW IF EXISTS daily_puzzles_public;
CREATE VIEW daily_puzzles_public
  WITH (security_invoker = true) AS
SELECT date, difficulty, clues, puzzle, solution_hash, generated_at
FROM daily_puzzles
WHERE date <= CURRENT_DATE;

DROP VIEW IF EXISTS user_dashboard;
CREATE VIEW user_dashboard
  WITH (security_invoker = true) AS
SELECT p.id, p.username, p.display_name, p.country,
  prog.xp, prog.level, prog.current_streak, prog.longest_streak, prog.streak_freezes,
  w.coins,
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = p.id) AS achievements_count
FROM profiles p
LEFT JOIN user_progression prog ON prog.user_id = p.id
LEFT JOIN user_wallet w ON w.user_id = p.id;

DROP VIEW IF EXISTS leaderboard_view;
CREATE VIEW leaderboard_view
  WITH (security_invoker = true) AS
SELECT l.date, l.user_id, l.score, l.time_seconds, l.mistakes, l.hints_used, l.submitted_at,
  p.username, p.display_name, p.country, e.avatar, e.theme_id,
  ROW_NUMBER() OVER (PARTITION BY l.date
    ORDER BY l.score DESC, l.time_seconds ASC, l.mistakes ASC, l.submitted_at ASC) AS rank,
  COUNT(*) OVER (PARTITION BY l.date) AS total_players
FROM daily_leaderboard l
JOIN profiles p ON p.id = l.user_id
LEFT JOIN user_equipped e ON e.user_id = l.user_id;

ALTER FUNCTION create_profile_for_user() SET search_path = public, auth;
ALTER FUNCTION trigger_set_updated_at() SET search_path = public;

REVOKE EXECUTE ON FUNCTION grant_coins(UUID, INTEGER, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION grant_xp(UUID, INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION bump_streak_for_today(UUID, DATE) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION create_profile_for_user() FROM PUBLIC, anon, authenticated;

CREATE POLICY "Admin only access" ON flagged_submissions FOR ALL USING (false);
