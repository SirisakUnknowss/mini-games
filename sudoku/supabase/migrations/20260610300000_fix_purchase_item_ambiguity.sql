-- Fix ambiguity error by renaming the table return column item_id -> purchased_item_id

DROP FUNCTION IF EXISTS public.purchase_item(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.purchase_item(
  p_user_id UUID,
  p_item_id TEXT
) RETURNS TABLE(new_balance INTEGER, purchased_item_id TEXT)
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
