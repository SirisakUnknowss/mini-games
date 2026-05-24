-- =====================================================================
-- Views
-- =====================================================================

-- User dashboard
CREATE OR REPLACE VIEW user_dashboard AS
SELECT
  p.id,
  p.username,
  p.display_name,
  p.country,
  prog.xp,
  prog.level,
  prog.current_streak,
  prog.longest_streak,
  prog.streak_freezes,
  w.coins,
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = p.id) AS achievements_count
FROM profiles p
LEFT JOIN user_progression prog ON prog.user_id = p.id
LEFT JOIN user_wallet w ON w.user_id = p.id;

-- Leaderboard with profile + avatar
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT
  l.date,
  l.user_id,
  l.score,
  l.time_seconds,
  l.mistakes,
  l.hints_used,
  l.submitted_at,
  p.username,
  p.display_name,
  p.country,
  e.avatar,
  e.theme_id,
  ROW_NUMBER() OVER (
    PARTITION BY l.date
    ORDER BY l.score DESC, l.time_seconds ASC, l.mistakes ASC, l.submitted_at ASC
  ) AS rank,
  COUNT(*) OVER (PARTITION BY l.date) AS total_players
FROM daily_leaderboard l
JOIN profiles p ON p.id = l.user_id
LEFT JOIN user_equipped e ON e.user_id = l.user_id;
