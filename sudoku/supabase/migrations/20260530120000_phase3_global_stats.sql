-- =====================================================================
-- Phase 3 — Global aggregate views so users can compare themselves to
-- the average. Read-only views; RLS allows public select.
-- =====================================================================

CREATE OR REPLACE VIEW global_daily_stats AS
SELECT
  daily_date AS date,
  COUNT(*)                              AS submissions,
  AVG(time_seconds)::INTEGER            AS avg_time_seconds,
  AVG(mistakes)::NUMERIC(5,2)           AS avg_mistakes,
  AVG(hints_used)::NUMERIC(5,2)         AS avg_hints,
  AVG(score)::INTEGER                   AS avg_score,
  MIN(time_seconds)                     AS best_time_seconds,
  MAX(score)                            AS best_score
FROM user_game_history
WHERE mode = 'daily' AND daily_date IS NOT NULL
GROUP BY daily_date;

CREATE OR REPLACE VIEW global_stats_summary AS
SELECT
  COUNT(*)                              AS total_games,
  COUNT(DISTINCT user_id)               AS total_players,
  AVG(time_seconds)::INTEGER            AS avg_time_seconds,
  AVG(mistakes)::NUMERIC(5,2)           AS avg_mistakes,
  AVG(hints_used)::NUMERIC(5,2)         AS avg_hints,
  AVG(score)::INTEGER                   AS avg_score
FROM user_game_history
WHERE completed_at > now() - interval '30 days';

-- Allow anonymous + authenticated reads on these aggregate views
GRANT SELECT ON global_daily_stats   TO anon, authenticated;
GRANT SELECT ON global_stats_summary TO anon, authenticated;

COMMENT ON VIEW global_daily_stats   IS 'Per-day daily-puzzle aggregates across all players.';
COMMENT ON VIEW global_stats_summary IS 'Last-30-day aggregate across all modes + players.';
