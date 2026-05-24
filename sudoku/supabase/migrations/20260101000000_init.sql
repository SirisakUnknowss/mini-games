-- =====================================================================
-- Sudoku Daily — Initial Schema
-- See docs/02-technical/database-schema.md for documentation
-- =====================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- pg_cron must be enabled in Supabase Dashboard → Database → Extensions

-- Custom types
CREATE TYPE difficulty_enum AS ENUM (
  'easy', 'easy-medium', 'medium',
  'medium-hard', 'hard', 'hard-expert', 'expert'
);

-- =====================================================================
-- profiles (extends auth.users)
-- =====================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  country TEXT,
  bio TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  banned_at TIMESTAMPTZ,
  ban_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_username ON profiles(username);

-- =====================================================================
-- user_wallet
-- =====================================================================
CREATE TABLE user_wallet (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL DEFAULT 100,
  total_earned BIGINT NOT NULL DEFAULT 100,
  total_spent BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (coins >= 0)
);

-- =====================================================================
-- coin_transactions
-- =====================================================================
CREATE TABLE coin_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coin_tx_user ON coin_transactions(user_id, created_at DESC);

-- =====================================================================
-- user_progression
-- =====================================================================
CREATE TABLE user_progression (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp BIGINT NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  prestige INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_daily_played DATE,
  streak_freezes INTEGER NOT NULL DEFAULT 1,
  next_free_freeze_at TIMESTAMPTZ DEFAULT now() + interval '30 days',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (xp >= 0),
  CHECK (level >= 1),
  CHECK (current_streak >= 0)
);

-- =====================================================================
-- user_settings
-- =====================================================================
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  highlight_same BOOLEAN DEFAULT true,
  show_conflict BOOLEAN DEFAULT true,
  hide_done BOOLEAN DEFAULT true,
  highlight_related BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  haptic_enabled BOOLEAN DEFAULT true,
  notifications_daily BOOLEAN DEFAULT true,
  notifications_streak BOOLEAN DEFAULT true,
  notifications_achievement BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'th',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- daily_puzzles
-- =====================================================================
CREATE TABLE daily_puzzles (
  date DATE PRIMARY KEY,
  difficulty difficulty_enum NOT NULL,
  clues INTEGER NOT NULL,
  puzzle CHAR(81) NOT NULL,
  solution CHAR(81) NOT NULL,
  solution_hash TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generation_seed TEXT NOT NULL
);

CREATE INDEX idx_daily_puzzles_date ON daily_puzzles(date DESC);

-- View hiding solution
CREATE VIEW daily_puzzles_public AS
SELECT date, difficulty, clues, puzzle, solution_hash, generated_at
FROM daily_puzzles
WHERE date <= CURRENT_DATE;

-- =====================================================================
-- daily_leaderboard
-- =====================================================================
CREATE TABLE daily_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  mistakes INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, user_id),
  CHECK (score >= 0),
  CHECK (time_seconds > 0)
);

CREATE INDEX idx_leaderboard_rank
  ON daily_leaderboard (date, score DESC, time_seconds ASC, mistakes ASC, submitted_at ASC);

-- =====================================================================
-- user_daily_quests
-- =====================================================================
CREATE TABLE user_daily_quests (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quest_id TEXT NOT NULL,
  tier INTEGER NOT NULL,
  target INTEGER NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  reward_coin INTEGER NOT NULL,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, date, quest_id)
);

CREATE INDEX idx_quests_user_date ON user_daily_quests(user_id, date);

CREATE TABLE user_quest_bonus (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

-- =====================================================================
-- practice_progress
-- =====================================================================
CREATE TABLE practice_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level difficulty_enum NOT NULL,
  stage INTEGER NOT NULL,
  best_score INTEGER NOT NULL,
  best_time_seconds INTEGER NOT NULL,
  best_mistakes INTEGER NOT NULL,
  best_hints_used INTEGER NOT NULL,
  plays INTEGER NOT NULL DEFAULT 1,
  first_completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, level, stage),
  CHECK (stage BETWEEN 1 AND 100)
);

CREATE INDEX idx_practice_user ON practice_progress(user_id);

-- =====================================================================
-- user_game_history (last 100 per user, trimmed by cron)
-- =====================================================================
CREATE TABLE user_game_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  level difficulty_enum NOT NULL,
  stage INTEGER,
  daily_date DATE,
  score INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  mistakes INTEGER NOT NULL,
  hints_used INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_user_time ON user_game_history(user_id, completed_at DESC);

-- =====================================================================
-- shop_items
-- =====================================================================
CREATE TABLE shop_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price_coin INTEGER NOT NULL,
  rarity TEXT,
  unlock_type TEXT NOT NULL DEFAULT 'shop',
  unlock_value TEXT,
  asset_url TEXT,
  preview_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shop_category ON shop_items(category, sort_order);

-- =====================================================================
-- user_inventory
-- =====================================================================
CREATE TABLE user_inventory (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES shop_items(id),
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acquired_from TEXT NOT NULL,
  PRIMARY KEY (user_id, item_id)
);

CREATE INDEX idx_inventory_user ON user_inventory(user_id);

-- =====================================================================
-- user_equipped
-- =====================================================================
CREATE TABLE user_equipped (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id TEXT REFERENCES shop_items(id),
  background_id TEXT REFERENCES shop_items(id),
  avatar JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- achievements
-- =====================================================================
CREATE TABLE achievements_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tier TEXT NOT NULL,
  category TEXT NOT NULL,
  reward_coin INTEGER DEFAULT 0,
  reward_xp INTEGER DEFAULT 0,
  reward_item_id TEXT REFERENCES shop_items(id),
  hidden BOOLEAN DEFAULT false,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE user_achievements (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements_definitions(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

-- =====================================================================
-- push_tokens
-- =====================================================================
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);

-- =====================================================================
-- flagged_submissions (anti-cheat audit)
-- =====================================================================
CREATE TABLE flagged_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  submission_id BIGINT,
  flag_reason TEXT,
  payload JSONB,
  reviewed BOOLEAN DEFAULT false,
  action TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
