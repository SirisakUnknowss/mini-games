-- =====================================================================
-- Row Level Security policies
-- See docs/02-technical/database-schema.md
-- =====================================================================

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_wallet
ALTER TABLE user_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet"
  ON user_wallet FOR SELECT USING (auth.uid() = user_id);

-- coin_transactions
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
  ON coin_transactions FOR SELECT USING (auth.uid() = user_id);

-- user_progression
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own progression"
  ON user_progression FOR SELECT USING (auth.uid() = user_id);

-- user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL USING (auth.uid() = user_id);

-- daily_puzzles
ALTER TABLE daily_puzzles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read past/today daily puzzles"
  ON daily_puzzles FOR SELECT USING (date <= CURRENT_DATE);

-- daily_leaderboard
ALTER TABLE daily_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read leaderboard"
  ON daily_leaderboard FOR SELECT USING (true);

-- user_daily_quests
ALTER TABLE user_daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own quests"
  ON user_daily_quests FOR SELECT USING (auth.uid() = user_id);

-- user_quest_bonus
ALTER TABLE user_quest_bonus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bonus"
  ON user_quest_bonus FOR SELECT USING (auth.uid() = user_id);

-- practice_progress
ALTER TABLE practice_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own practice"
  ON practice_progress FOR SELECT USING (auth.uid() = user_id);

-- user_game_history
ALTER TABLE user_game_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own history"
  ON user_game_history FOR SELECT USING (auth.uid() = user_id);

-- shop_items
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read shop"
  ON shop_items FOR SELECT USING (available = true);

-- user_inventory
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own inventory"
  ON user_inventory FOR SELECT USING (auth.uid() = user_id);

-- user_equipped (public for leaderboard avatar render)
ALTER TABLE user_equipped ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read equipped"
  ON user_equipped FOR SELECT USING (true);

CREATE POLICY "Users update own equipped"
  ON user_equipped FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users insert own equipped"
  ON user_equipped FOR INSERT WITH CHECK (auth.uid() = user_id);

-- achievements_definitions
ALTER TABLE achievements_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ach defs"
  ON achievements_definitions FOR SELECT USING (true);

-- user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ach"
  ON user_achievements FOR SELECT USING (auth.uid() = user_id);

-- push_tokens
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tokens"
  ON push_tokens FOR ALL USING (auth.uid() = user_id);

-- flagged_submissions — admin only (no policies = locked)
ALTER TABLE flagged_submissions ENABLE ROW LEVEL SECURITY;
