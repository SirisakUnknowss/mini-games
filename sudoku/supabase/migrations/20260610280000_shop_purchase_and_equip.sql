-- Migration to add purchase_item and equip_item RPC functions

-- 1. purchase_item: Atomic shop item purchase
CREATE OR REPLACE FUNCTION public.purchase_item(
  p_user_id UUID,
  p_item_id TEXT
) RETURNS TABLE(new_balance INTEGER, item_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price INTEGER;
  v_available BOOLEAN;
  v_owned BOOLEAN;
  v_new_balance INTEGER;
BEGIN
  -- Verify caller matches user_id or is service_role
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Get item price and availability
  SELECT price_coin, available INTO v_price, v_available
  FROM shop_items
  WHERE id = p_item_id;

  IF v_price IS NULL OR NOT v_available THEN
    RAISE EXCEPTION 'item_not_found';
  END IF;

  -- Check if already owned
  SELECT EXISTS(
    SELECT 1 FROM user_inventory
    WHERE user_id = p_user_id AND item_id = p_item_id
  ) INTO v_owned;

  IF v_owned THEN
    RAISE EXCEPTION 'already_owned';
  END IF;

  -- Check if they have enough coins
  IF NOT EXISTS(
    SELECT 1 FROM user_wallet
    WHERE user_id = p_user_id AND coins >= v_price
  ) THEN
    RAISE EXCEPTION 'insufficient_coins';
  END IF;

  -- Deduct coins
  v_new_balance := grant_coins(p_user_id, -v_price, 'purchase_item', jsonb_build_object('item_id', p_item_id));

  -- Insert into user_inventory
  INSERT INTO user_inventory (user_id, item_id, acquired_from)
  VALUES (p_user_id, p_item_id, 'shop');

  RETURN QUERY SELECT v_new_balance, p_item_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_item TO authenticated;

-- 2. equip_item: Atomic shop item equipping with ownership checks
CREATE OR REPLACE FUNCTION public.equip_item(
  p_user_id UUID,
  p_theme_id TEXT DEFAULT NULL,
  p_background_id TEXT DEFAULT NULL,
  p_avatar JSONB DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owned BOOLEAN;
BEGIN
  -- Verify caller
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- 1. Verify theme ownership if provided
  IF p_theme_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM shop_items WHERE id = p_theme_id AND price_coin = 0
    ) OR EXISTS (
      SELECT 1 FROM user_inventory WHERE user_id = p_user_id AND item_id = p_theme_id
    ) INTO v_owned;

    IF NOT v_owned THEN
      RAISE EXCEPTION 'theme_not_owned';
    END IF;
  END IF;

  -- 2. Verify background ownership if provided
  IF p_background_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM shop_items WHERE id = p_background_id AND price_coin = 0
    ) OR EXISTS (
      SELECT 1 FROM user_inventory WHERE user_id = p_user_id AND item_id = p_background_id
    ) INTO v_owned;

    IF NOT v_owned THEN
      RAISE EXCEPTION 'background_not_owned';
    END IF;
  END IF;

  -- 3. Verify avatar items ownership if provided
  IF p_avatar IS NOT NULL THEN
    DECLARE
      v_val TEXT;
    BEGIN
      FOR v_val IN SELECT value FROM jsonb_each_text(p_avatar) LOOP
        IF v_val IS NOT NULL AND v_val <> '' THEN
          SELECT EXISTS (
            SELECT 1 FROM shop_items WHERE id = v_val AND price_coin = 0
          ) OR EXISTS (
            SELECT 1 FROM user_inventory WHERE user_id = p_user_id AND item_id = v_val
          ) INTO v_owned;

          IF NOT v_owned THEN
            RAISE EXCEPTION 'avatar_item_not_owned: %', v_val;
          END IF;
        END IF;
      END LOOP;
    END;
  END IF;

  -- 4. Update or Insert user_equipped
  INSERT INTO user_equipped (user_id, theme_id, background_id, avatar, updated_at)
  VALUES (
    p_user_id,
    p_theme_id,
    p_background_id,
    COALESCE(p_avatar, '{}'::jsonb),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    theme_id = COALESCE(p_theme_id, user_equipped.theme_id),
    background_id = COALESCE(p_background_id, user_equipped.background_id),
    avatar = COALESCE(p_avatar, user_equipped.avatar),
    updated_at = now();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.equip_item TO authenticated;
