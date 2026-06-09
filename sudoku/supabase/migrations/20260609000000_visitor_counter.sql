-- =====================================================================
-- Visitor Counter — tracks unique visitors per day
-- Each (user_id, visited_date) is unique → 1 row per user per day
-- =====================================================================

CREATE TABLE IF NOT EXISTS visitor_logs (
  id           BIGSERIAL    PRIMARY KEY,
  user_id      UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visited_date DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),

  UNIQUE (user_id, visited_date)
);

-- Index for fast daily count queries
CREATE INDEX IF NOT EXISTS visitor_logs_date_idx ON visitor_logs (visited_date);

-- =====================================================================
-- RLS
-- =====================================================================
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

-- Any authenticated (including anonymous) user can upsert their own row
CREATE POLICY "visitor_logs_upsert_own"
  ON visitor_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Anyone (anon token or authenticated) can read aggregate counts
-- We expose only via the helper function below, but grant SELECT for convenience
CREATE POLICY "visitor_logs_select_all"
  ON visitor_logs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- =====================================================================
-- Helper function — returns visitor stats as JSON
-- Runs as SECURITY DEFINER so anon callers can get counts
-- =====================================================================
CREATE OR REPLACE FUNCTION get_visitor_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_count     BIGINT;
  week_count      BIGINT;
  total_count     BIGINT;
BEGIN
  SELECT COUNT(*)
    INTO today_count
    FROM visitor_logs
   WHERE visited_date = CURRENT_DATE;

  SELECT COUNT(DISTINCT user_id)
    INTO week_count
    FROM visitor_logs
   WHERE visited_date >= CURRENT_DATE - INTERVAL '6 days';

  SELECT COUNT(DISTINCT user_id)
    INTO total_count
    FROM visitor_logs;

  RETURN json_build_object(
    'today',  today_count,
    'week',   week_count,
    'total',  total_count
  );
END;
$$;

-- Grant execute to anon + authenticated
GRANT EXECUTE ON FUNCTION get_visitor_stats() TO anon, authenticated;

COMMENT ON TABLE visitor_logs IS 'One row per user per day — used to count daily/weekly/total unique visitors.';
COMMENT ON FUNCTION get_visitor_stats() IS 'Returns {today, week, total} unique visitor counts.';
