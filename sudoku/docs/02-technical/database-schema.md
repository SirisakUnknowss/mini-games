# 🗄️ Database Schema

> Postgres schema สำหรับ Supabase — Source of truth

ไฟล์ migration จริงอยู่ที่ `supabase/migrations/` (ดู [`05-infrastructure/supabase-setup.md`](../05-infrastructure/supabase-setup.md))

---

## 📋 Tables Overview

| Table | Purpose | Owner |
|---|---|---|
| `profiles` | ข้อมูล user (extend auth.users) | per-user |
| `user_progression` | XP, level, streak | per-user |
| `user_wallet` | Coin balance | per-user |
| `coin_transactions` | Audit log ของ coin change | append-only |
| `daily_puzzles` | Puzzle ของแต่ละวัน | public read |
| `daily_leaderboard` | Score submissions | per-user write, public read |
| `user_daily_quests` | Quest progress | per-user |
| `user_quest_bonus` | Daily 3-quest bonus claim | per-user |
| `practice_progress` | Practice mode (100 ด่าน × 4 level) | per-user |
| `user_game_history` | Recent games (rolling 50) | per-user |
| `shop_items` | Catalog items | public read |
| `user_inventory` | What user owns | per-user |
| `user_equipped` | Current cosmetic | per-user |
| `achievements_definitions` | Catalog | public read |
| `user_achievements` | Unlocked achievements | per-user |
| `user_settings` | Game preferences | per-user |
| `push_tokens` | FCM tokens | per-user |

---

## 🔧 Common Setup

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Reusable types
CREATE TYPE difficulty_enum AS ENUM (
  'easy', 'easy-medium', 'medium',
  'medium-hard', 'hard', 'hard-expert', 'expert'
);
```

---

## 👤 Auth & Profile

Supabase Auth จัดการ `auth.users` ให้แล้ว (email, encrypted_password, etc.)
เราเก็บข้อมูลเสริมที่ `public.profiles`:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  country TEXT,                            -- ISO 3166 (e.g., 'TH')
  bio TEXT,
  is_anonymous BOOLEAN DEFAULT false,       -- guest user flag
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_username ON profiles(username);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, is_anonymous)
  VALUES (NEW.id, 'user_' || substr(NEW.id::text, 1, 8), NEW.is_anonymous);
  INSERT INTO user_wallet (user_id) VALUES (NEW.id);
  INSERT INTO user_progression (user_id) VALUES (NEW.id);
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();
```

---

## 🪙 Wallet & Transactions

```sql
CREATE TABLE user_wallet (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL DEFAULT 100,
  total_earned BIGINT NOT NULL DEFAULT 100,
  total_spent BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (coins >= 0)
);

ALTER TABLE user_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet"
  ON user_wallet FOR SELECT USING (auth.uid() = user_id);
-- INSERT/UPDATE via Edge Function only (SECURITY DEFINER)

CREATE TABLE coin_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,                  -- + earn, - spend
  reason TEXT NOT NULL,                     -- 'daily_quest', 'shop', 'achievement'
  metadata JSONB,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coin_tx_user ON coin_transactions(user_id, created_at DESC);

ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
  ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
```

---

## 📈 Progression

```sql
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

ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own progression"
  ON user_progression FOR SELECT USING (auth.uid() = user_id);
```

---

## 📅 Daily Puzzles

```sql
CREATE TABLE daily_puzzles (
  date DATE PRIMARY KEY,
  difficulty difficulty_enum NOT NULL,
  clues INTEGER NOT NULL,
  puzzle CHAR(81) NOT NULL,        -- '530070000...'
  solution CHAR(81) NOT NULL,
  solution_hash TEXT NOT NULL,      -- SHA-256 ของ solution (อันที่ส่ง client)
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generation_seed TEXT NOT NULL
);

CREATE INDEX idx_daily_puzzles_date ON daily_puzzles(date DESC);

ALTER TABLE daily_puzzles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read daily puzzles"
  ON daily_puzzles FOR SELECT USING (date <= CURRENT_DATE);
-- ห้าม SELECT puzzle ของ "พรุ่งนี้"

-- ⚠️ Important: client ดึง puzzle ได้ แต่ solution ห้ามส่งตรงๆ
-- ใช้ view แทน:
CREATE VIEW daily_puzzles_public AS
SELECT date, difficulty, clues, puzzle, solution_hash, generated_at
FROM daily_puzzles
WHERE date <= CURRENT_DATE;
```

---

## 🏆 Leaderboard

```sql
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

ALTER TABLE daily_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read leaderboard"
  ON daily_leaderboard FOR SELECT USING (true);
-- INSERT via Edge Function only
```

---

## 🎯 Quests

```sql
CREATE TABLE user_daily_quests (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quest_id TEXT NOT NULL,                   -- 'Q_PLAY_3'
  tier INTEGER NOT NULL,                    -- 1/2/3
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

ALTER TABLE user_daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_bonus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own quests"
  ON user_daily_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own bonus"
  ON user_quest_bonus FOR SELECT USING (auth.uid() = user_id);
-- INSERT/UPDATE via Edge Function
```

---

## 🎮 Practice Mode

```sql
CREATE TABLE practice_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level difficulty_enum NOT NULL,
  stage INTEGER NOT NULL,                   -- 1-100
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

ALTER TABLE practice_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own practice"
  ON practice_progress FOR SELECT USING (auth.uid() = user_id);
```

---

## 📜 Game History

```sql
CREATE TABLE user_game_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,                       -- 'daily' | 'practice'
  level difficulty_enum NOT NULL,
  stage INTEGER,                            -- null for daily
  daily_date DATE,                          -- null for practice
  score INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  mistakes INTEGER NOT NULL,
  hints_used INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_user_time ON user_game_history(user_id, completed_at DESC);

-- Keep last 100 rows per user (cron cleanup)
-- See infrastructure docs for cleanup job

ALTER TABLE user_game_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own history"
  ON user_game_history FOR SELECT USING (auth.uid() = user_id);
```

---

## 🛍️ Shop

```sql
CREATE TABLE shop_items (
  id TEXT PRIMARY KEY,                      -- 'theme_sakura'
  category TEXT NOT NULL,                   -- 'theme' | 'background' | 'avatar' | 'consumable' | 'bundle'
  subcategory TEXT,                         -- e.g., 'hat', 'pet' for avatar
  name TEXT NOT NULL,
  description TEXT,
  price_coin INTEGER NOT NULL,
  rarity TEXT,                              -- 'common' | 'rare' | 'epic' | 'legendary'
  unlock_type TEXT NOT NULL DEFAULT 'shop', -- 'free' | 'shop' | 'level' | 'achievement' | 'streak'
  unlock_value TEXT,
  asset_url TEXT,
  preview_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shop_category ON shop_items(category, sort_order);

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shop" ON shop_items FOR SELECT USING (available = true);

CREATE TABLE user_inventory (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES shop_items(id),
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acquired_from TEXT NOT NULL,              -- 'shop' | 'reward' | 'achievement' | 'gift'
  PRIMARY KEY (user_id, item_id)
);

CREATE INDEX idx_inventory_user ON user_inventory(user_id);

ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own inventory"
  ON user_inventory FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE user_equipped (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id TEXT REFERENCES shop_items(id),
  background_id TEXT REFERENCES shop_items(id),
  avatar JSONB NOT NULL DEFAULT '{}',       -- { face, hat, eyes, body, pet, frame, baseColor }
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_equipped ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read equipped (for leaderboard avatar)"
  ON user_equipped FOR SELECT USING (true);

CREATE POLICY "Users update own equipped"
  ON user_equipped FOR UPDATE USING (auth.uid() = user_id);
```

---

## 🏅 Achievements

```sql
CREATE TABLE achievements_definitions (
  id TEXT PRIMARY KEY,                      -- 'ACH_FIRST_WIN'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tier TEXT NOT NULL,                       -- 'bronze' | 'silver' | 'gold' | 'diamond'
  category TEXT NOT NULL,
  reward_coin INTEGER DEFAULT 0,
  reward_xp INTEGER DEFAULT 0,
  reward_item_id TEXT REFERENCES shop_items(id),
  hidden BOOLEAN DEFAULT false,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE achievements_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ach defs" ON achievements_definitions FOR SELECT USING (true);

CREATE TABLE user_achievements (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements_definitions(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ach" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
```

---

## ⚙️ Settings

```sql
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

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL USING (auth.uid() = user_id);
```

---

## 🔔 Push Tokens

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,                   -- 'web' | 'ios' | 'android'
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tokens"
  ON push_tokens FOR ALL USING (auth.uid() = user_id);
```

---

## 📊 Useful Views

```sql
-- User dashboard view
CREATE VIEW user_dashboard AS
SELECT
  p.id, p.username, p.display_name,
  prog.xp, prog.level, prog.current_streak, prog.longest_streak,
  w.coins,
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = p.id) AS achievements_count
FROM profiles p
LEFT JOIN user_progression prog ON prog.user_id = p.id
LEFT JOIN user_wallet w ON w.user_id = p.id;

-- Leaderboard with profile info
CREATE VIEW leaderboard_view AS
SELECT
  l.date, l.user_id, l.score, l.time_seconds, l.mistakes, l.hints_used, l.submitted_at,
  p.username, p.display_name, p.country,
  e.avatar
FROM daily_leaderboard l
JOIN profiles p ON p.id = l.user_id
LEFT JOIN user_equipped e ON e.user_id = l.user_id;
```

---

## 🧹 Cleanup Jobs (pg_cron)

```sql
-- Trim user_game_history to last 100 per user (daily 03:00 UTC)
SELECT cron.schedule('trim-game-history', '0 3 * * *', $$
  DELETE FROM user_game_history
  WHERE id IN (
    SELECT id FROM (
      SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY completed_at DESC) AS rn
      FROM user_game_history
    ) t WHERE rn > 100
  )
$$);

-- Drop daily_leaderboard older than 90 days (weekly)
SELECT cron.schedule('drop-old-leaderboard', '0 4 * * 0', $$
  DELETE FROM daily_leaderboard WHERE date < CURRENT_DATE - interval '90 days'
$$);

-- Reset streak for inactive (daily 00:30 UTC, also handled by Edge Function)
-- See offline-sync / leaderboard docs
```

---

## 🔍 Indexes Summary

ทุก foreign key มี index implicit ใน Postgres (sometimes), แต่เพิ่ม explicit ที่ต้อง query:

- `idx_profiles_username` — login lookup
- `idx_coin_tx_user` — transaction history
- `idx_leaderboard_rank` — ranking query (composite)
- `idx_quests_user_date` — fetch today's quests
- `idx_inventory_user` — user's items
- `idx_history_user_time` — recent games

---

## 🚀 Migration Order

ดู `supabase/migrations/0001_init.sql` (ตัวอย่างใน [`05-infrastructure/supabase-setup.md`](../05-infrastructure/supabase-setup.md))

Order:
1. Extensions + types
2. profiles + trigger
3. user_wallet, user_progression, user_settings
4. coin_transactions
5. daily_puzzles
6. daily_leaderboard
7. user_daily_quests, user_quest_bonus
8. practice_progress
9. user_game_history
10. shop_items
11. user_inventory, user_equipped
12. achievements_definitions, user_achievements
13. push_tokens
14. Views
15. Cron jobs
16. Seed data (shop_items, achievements_definitions)
