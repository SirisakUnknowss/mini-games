-- =====================================================================
-- Triggers — auto-create user records on signup
-- =====================================================================

CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
BEGIN
  generated_username := 'user_' || substr(NEW.id::text, 1, 8);

  INSERT INTO profiles (id, username, is_anonymous)
  VALUES (
    NEW.id,
    generated_username,
    COALESCE(NEW.is_anonymous, false)
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_wallet (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO user_progression (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  -- Initial coin transaction log
  INSERT INTO coin_transactions (user_id, amount, reason, balance_after, metadata)
  VALUES (NEW.id, 100, 'signup_bonus', 100, '{}'::jsonb);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- =====================================================================
-- updated_at auto-update
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_wallet
  BEFORE UPDATE ON user_wallet
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_progression
  BEFORE UPDATE ON user_progression
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_settings
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_equipped
  BEFORE UPDATE ON user_equipped
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
