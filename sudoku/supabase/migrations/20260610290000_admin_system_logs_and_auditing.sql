-- Migration to add system logs and data auditing RPCs for Log Monitor

CREATE TABLE IF NOT EXISTS public.system_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  level TEXT NOT NULL,       -- 'info', 'warn', 'error'
  category TEXT NOT NULL,    -- 'shop', 'auth', 'game', 'db', 'system'
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);

-- Enable RLS on system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only service role or admin functions can read/write logs directly
CREATE POLICY admin_read_logs ON public.system_logs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- 1. get_admin_system_logs RPC
CREATE OR REPLACE FUNCTION public.get_admin_system_logs(p_limit INTEGER DEFAULT 100)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT json_agg(t) INTO v_result
  FROM (
    SELECT id, created_at, level, category, message, metadata
    FROM system_logs
    ORDER BY created_at DESC
    LIMIT p_limit
  ) t;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_system_logs TO authenticated;

-- 2. get_admin_audit_anomalies RPC
CREATE OR REPLACE FUNCTION public.get_admin_audit_anomalies()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_missing_inventory JSON;
  v_missing_payment JSON;
  v_result JSON;
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- 1. Users who paid (coin transaction exists) but didn't get the item in inventory
  SELECT json_agg(t) INTO v_missing_inventory
  FROM (
    SELECT
      t.user_id,
      COALESCE(p.display_name, p.username) AS display_name,
      p.email,
      t.metadata->>'item_id' AS item_id,
      t.amount AS coins_deducted,
      t.created_at AS transaction_time
    FROM coin_transactions t
    JOIN profiles p ON p.id = t.user_id
    WHERE t.reason = 'purchase_item'
      AND NOT EXISTS (
        SELECT 1 FROM user_inventory i
        WHERE i.user_id = t.user_id AND i.item_id = t.metadata->>'item_id'
      )
  ) t;

  -- 2. Users who own a paid item in inventory but no matching transaction exists
  SELECT json_agg(t) INTO v_missing_payment
  FROM (
    SELECT
      i.user_id,
      COALESCE(p.display_name, p.username) AS display_name,
      p.email,
      i.item_id,
      s.price_coin AS item_price,
      i.acquired_at AS acquisition_time
    FROM user_inventory i
    JOIN profiles p ON p.id = i.user_id
    JOIN shop_items s ON s.id = i.item_id
    WHERE i.acquired_from = 'shop'
      AND s.price_coin > 0
      AND NOT EXISTS (
        SELECT 1 FROM coin_transactions t
        WHERE t.user_id = i.user_id
          AND t.reason = 'purchase_item'
          AND t.metadata->>'item_id' = i.item_id
      )
  ) t;

  SELECT json_build_object(
    'missing_inventory', COALESCE(v_missing_inventory, '[]'::json),
    'missing_payment', COALESCE(v_missing_payment, '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_audit_anomalies TO authenticated;

-- 3. clear_admin_system_logs RPC
CREATE OR REPLACE FUNCTION public.clear_admin_system_logs()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  DELETE FROM system_logs;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_admin_system_logs TO authenticated;
