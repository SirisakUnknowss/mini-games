-- Admin Shop Analytics: RPC returning KPIs, top items, category breakdown, recent purchases
CREATE OR REPLACE FUNCTION public.get_admin_shop_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_purchases    INT;
  v_total_coins_spent  BIGINT;
  v_unique_buyers      INT;
  v_avg_coins          INT;
  v_top_items          JSON;
  v_category_breakdown JSON;
  v_recent_purchases   JSON;
BEGIN
  -- Security: admin only
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- 1. KPI: total purchases (items bought via shop)
  SELECT COALESCE(COUNT(*), 0)
    INTO v_total_purchases
    FROM user_inventory
   WHERE acquired_from = 'shop';

  -- 2. KPI: total coins spent on shop (sum of item prices)
  SELECT COALESCE(SUM(si.price_coin), 0)
    INTO v_total_coins_spent
    FROM user_inventory ui
    JOIN shop_items si ON si.id = ui.item_id
   WHERE ui.acquired_from = 'shop';

  -- 3. KPI: unique buyers
  SELECT COALESCE(COUNT(DISTINCT user_id), 0)
    INTO v_unique_buyers
    FROM user_inventory
   WHERE acquired_from = 'shop';

  -- 4. KPI: avg coins spent per buyer
  SELECT CASE WHEN v_unique_buyers > 0
    THEN (v_total_coins_spent / v_unique_buyers)::int
    ELSE 0
  END INTO v_avg_coins;

  -- 5. Top 10 most purchased items
  SELECT json_agg(t) INTO v_top_items
  FROM (
    SELECT
      si.id,
      si.name,
      si.category,
      COALESCE(si.subcategory, '') AS subcategory,
      si.price_coin,
      COALESCE(si.rarity, 'common') AS rarity,
      COUNT(ui.user_id)::int AS purchase_count,
      (COUNT(ui.user_id) * si.price_coin)::bigint AS total_revenue
    FROM shop_items si
    LEFT JOIN user_inventory ui ON ui.item_id = si.id AND ui.acquired_from = 'shop'
    GROUP BY si.id, si.name, si.category, si.subcategory, si.price_coin, si.rarity
    ORDER BY purchase_count DESC, total_revenue DESC
    LIMIT 10
  ) t;

  -- 6. Category breakdown
  SELECT json_agg(t) INTO v_category_breakdown
  FROM (
    SELECT
      si.category,
      COUNT(ui.user_id)::int AS purchase_count,
      COALESCE(SUM(si.price_coin), 0)::bigint AS total_coins
    FROM shop_items si
    LEFT JOIN user_inventory ui ON ui.item_id = si.id AND ui.acquired_from = 'shop'
    GROUP BY si.category
    ORDER BY purchase_count DESC
  ) t;

  -- 7. Recent 30 purchases
  SELECT json_agg(t) INTO v_recent_purchases
  FROM (
    SELECT
      ui.acquired_at,
      si.name AS item_name,
      si.category,
      si.price_coin,
      COALESCE(si.rarity, 'common') AS rarity,
      COALESCE(p.display_name, p.username, 'Unknown') AS buyer_name,
      p.username AS buyer_username
    FROM user_inventory ui
    JOIN shop_items si ON si.id = ui.item_id
    LEFT JOIN profiles p ON p.id = ui.user_id
    WHERE ui.acquired_from = 'shop'
    ORDER BY ui.acquired_at DESC
    LIMIT 30
  ) t;

  RETURN json_build_object(
    'total_purchases',    v_total_purchases,
    'total_coins_spent',  v_total_coins_spent,
    'unique_buyers',      v_unique_buyers,
    'avg_coins_per_buyer', v_avg_coins,
    'top_items',          COALESCE(v_top_items, '[]'::json),
    'category_breakdown', COALESCE(v_category_breakdown, '[]'::json),
    'recent_purchases',   COALESCE(v_recent_purchases, '[]'::json)
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_admin_shop_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_shop_stats() TO authenticated;
