-- =====================================================================
-- Seed data — runs after `supabase db reset`
-- =====================================================================

-- Free starter items
INSERT INTO shop_items (id, category, subcategory, name, description, price_coin, rarity, unlock_type, sort_order) VALUES
  ('theme_classic', 'theme', NULL, 'Classic', 'The original theme', 0, 'common', 'free', 1),
  ('theme_paper', 'theme', NULL, 'Paper', 'Warm paper-like background', 0, 'common', 'free', 2),
  ('theme_dark', 'theme', NULL, 'Dark Mode', 'Easy on the eyes', 0, 'common', 'level', 3),
  ('theme_pastel', 'theme', NULL, 'Pastel Dream', 'Soft pink and blue', 200, 'common', 'shop', 4),
  ('theme_ocean', 'theme', NULL, 'Ocean', 'Cool blue tones', 300, 'common', 'shop', 5),
  ('theme_forest', 'theme', NULL, 'Forest', 'Natural green tones', 300, 'common', 'shop', 6),
  ('theme_sunset', 'theme', NULL, 'Sunset', 'Orange and purple', 400, 'rare', 'shop', 7),
  ('theme_neon', 'theme', NULL, 'Neon Night', 'Cyberpunk vibes', 500, 'rare', 'shop', 8),
  ('theme_sakura', 'theme', NULL, 'Sakura', 'Cherry blossom pink', 600, 'epic', 'shop', 9),
  ('theme_thai', 'theme', NULL, 'Thai Heritage', 'Gold and red traditional', 800, 'epic', 'shop', 10),
  ('theme_mono', 'theme', NULL, 'Mono Pro', 'Premium black and white', 1000, 'epic', 'shop', 11);

UPDATE shop_items SET unlock_value = '3' WHERE id = 'theme_dark';

-- Backgrounds (subset)
INSERT INTO shop_items (id, category, name, price_coin, rarity, unlock_type, sort_order) VALUES
  ('bg_default', 'background', 'Default Gradient', 0, 'common', 'free', 1),
  ('bg_blank_white', 'background', 'Blank White', 0, 'common', 'free', 2),
  ('bg_solid_navy', 'background', 'Navy Solid', 100, 'common', 'shop', 3),
  ('bg_solid_forest', 'background', 'Forest Solid', 100, 'common', 'shop', 4),
  ('bg_pattern_dots', 'background', 'Dot Pattern', 200, 'common', 'shop', 5),
  ('bg_pattern_waves', 'background', 'Wavy Pattern', 200, 'common', 'shop', 6),
  ('bg_photo_mountain', 'background', 'Mountain Photo', 400, 'rare', 'shop', 7),
  ('bg_photo_space', 'background', 'Space Photo', 400, 'rare', 'shop', 8),
  ('bg_anim_rain', 'background', 'Animated Rain', 1000, 'epic', 'shop', 9);

-- Avatar items (sample subset)
INSERT INTO shop_items (id, category, subcategory, name, price_coin, rarity, unlock_type, sort_order) VALUES
  ('avatar_face_happy', 'avatar', 'face', 'Happy Face', 0, 'common', 'free', 1),
  ('avatar_face_cool', 'avatar', 'face', 'Cool Face', 50, 'common', 'shop', 2),
  ('avatar_face_nerd', 'avatar', 'face', 'Nerd Face', 200, 'rare', 'shop', 3),
  ('avatar_face_lion', 'avatar', 'face', 'Lion Face', 500, 'epic', 'shop', 4),

  ('avatar_hat_cap', 'avatar', 'hat', 'Cap', 100, 'common', 'shop', 1),
  ('avatar_hat_top', 'avatar', 'hat', 'Top Hat', 200, 'rare', 'shop', 2),
  ('avatar_hat_crown', 'avatar', 'hat', 'Crown', 800, 'epic', 'shop', 3),

  ('avatar_pet_dog', 'avatar', 'pet', 'Dog', 300, 'common', 'shop', 1),
  ('avatar_pet_cat', 'avatar', 'pet', 'Cat', 300, 'common', 'shop', 2),
  ('avatar_pet_dragon', 'avatar', 'pet', 'Dragon', 2000, 'epic', 'shop', 3),

  ('avatar_frame_bronze', 'avatar', 'frame', 'Bronze Frame', 200, 'common', 'shop', 1),
  ('avatar_frame_gold', 'avatar', 'frame', 'Gold Frame', 600, 'rare', 'shop', 2),
  ('avatar_frame_rainbow', 'avatar', 'frame', 'Rainbow Frame', 1500, 'epic', 'shop', 3);

-- Consumables
INSERT INTO shop_items (id, category, name, description, price_coin, rarity, unlock_type, sort_order) VALUES
  ('item_streak_freeze', 'consumable', 'Streak Freeze', 'Protects your streak for 1 day', 200, 'common', 'shop', 1),
  ('item_hint_pack', 'consumable', 'Hint Pack +3', 'Adds 3 hints to next game', 100, 'common', 'shop', 2),
  ('item_coin_boost_2x', 'consumable', 'Coin Boost 2× (24h)', 'Double all coin earnings for 24 hours', 500, 'rare', 'shop', 3);

-- =====================================================================
-- Achievements (subset — see docs/01-game-design/achievements.md for full list)
-- =====================================================================
INSERT INTO achievements_definitions (id, name, description, tier, category, reward_coin, reward_xp, sort_order) VALUES
  ('ACH_FIRST_WIN', 'First Win', 'Win your first game', 'bronze', 'play_volume', 50, 100, 1),
  ('ACH_PLAY_10', 'Beginner', 'Play 10 games', 'bronze', 'play_volume', 100, 200, 2),
  ('ACH_PLAY_50', 'Regular', 'Play 50 games', 'silver', 'play_volume', 300, 500, 3),
  ('ACH_PLAY_100', 'Dedicated', 'Play 100 games', 'silver', 'play_volume', 500, 1000, 4),
  ('ACH_PLAY_500', 'Veteran', 'Play 500 games', 'gold', 'play_volume', 1500, 3000, 5),
  ('ACH_PLAY_1000', 'Master', 'Play 1000 games', 'diamond', 'play_volume', 5000, 10000, 6),

  ('ACH_DAILY_FIRST', 'First Daily', 'Play your first Daily Puzzle', 'bronze', 'daily', 50, 100, 10),
  ('ACH_STREAK_3', 'Trio', 'Streak 3 days', 'bronze', 'daily', 100, 200, 11),
  ('ACH_STREAK_7', 'Week Warrior', 'Streak 7 days', 'silver', 'daily', 300, 500, 12),
  ('ACH_STREAK_30', 'Monthly', 'Streak 30 days', 'gold', 'daily', 1500, 3000, 13),
  ('ACH_STREAK_100', 'Centurion', 'Streak 100 days', 'diamond', 'daily', 5000, 10000, 14),

  ('ACH_PERFECT_1', 'Flawless', 'Win with no mistakes', 'bronze', 'skill', 100, 200, 20),
  ('ACH_NO_HINT_HARD', 'Pure Skill', 'Win Hard without hints', 'gold', 'skill', 600, 1500, 21),
  ('ACH_NO_HINT_EXPERT', 'Genius', 'Win Expert without hints', 'diamond', 'skill', 2000, 5000, 22),

  ('ACH_TOP_100', 'Top 100', 'Daily leaderboard top 100', 'silver', 'leaderboard', 500, 1000, 30),
  ('ACH_TOP_10', 'Top 10', 'Daily leaderboard top 10', 'gold', 'leaderboard', 2000, 5000, 31),
  ('ACH_TOP_1', 'Daily Champion', 'Rank #1 on Daily Leaderboard', 'diamond', 'leaderboard', 5000, 15000, 32),

  ('ACH_NIGHT_OWL', 'Night Owl', 'Play between 23:00 and 04:00', 'bronze', 'special', 100, 100, 40),
  ('ACH_EARLY_BIRD', 'Early Bird', 'Play between 05:00 and 07:00', 'bronze', 'special', 100, 100, 41);
