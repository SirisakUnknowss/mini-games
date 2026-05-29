-- =====================================================================
-- Phase 3 — extra achievements (push count past 50)
-- =====================================================================

INSERT INTO achievements_definitions (id, name, description, tier, category, reward_coin, reward_xp, sort_order) VALUES
  -- play_volume extensions
  ('ACH_PLAY_5000',    'Sudoku Sage',        'Play 5000 games',                       'platinum', 'play_volume', 15000, 30000, 7),

  -- daily / streak extensions
  ('ACH_STREAK_14',    'Fortnight',          'Streak 14 days',                        'silver',   'daily',      500,   1000, 15),
  ('ACH_STREAK_60',    'Iron Will',          'Streak 60 days',                        'gold',     'daily',      2500,  6000, 16),
  ('ACH_STREAK_365',   'Year Long',          'Streak 365 days',                       'platinum', 'daily',      20000, 50000, 17),
  ('ACH_DAILY_10',     'Daily Habit',        'Complete 10 daily puzzles',             'bronze',   'daily',      150,   300,  18),
  ('ACH_DAILY_50',     'Daily Regular',      'Complete 50 daily puzzles',             'silver',   'daily',      750,   1500, 19),

  -- skill extensions
  ('ACH_PERFECT_5',    'Perfect 5',          '5 wins in a row with no mistakes',      'silver',   'skill',      400,   800,  23),
  ('ACH_PERFECT_25',   'Perfectionist',      '25 wins with no mistakes',              'gold',     'skill',      1500,  3000, 24),
  ('ACH_NO_HINT_MED',  'No Crutches',        'Win Medium without hints',              'silver',   'skill',      300,   600,  25),
  ('ACH_SPEEDRUN_E',   'Speedrunner Easy',   'Win Easy in under 3 minutes',           'bronze',   'skill',      150,   300,  26),
  ('ACH_SPEEDRUN_M',   'Speedrunner Med',    'Win Medium in under 6 minutes',         'silver',   'skill',      400,   800,  27),
  ('ACH_SPEEDRUN_H',   'Speedrunner Hard',   'Win Hard in under 12 minutes',          'gold',     'skill',      1000,  2000, 28),

  -- leaderboard extensions
  ('ACH_TOP_50',       'Top 50',             'Daily leaderboard top 50',              'silver',   'leaderboard', 800,   1500, 33),
  ('ACH_TOP_3',        'Podium',             'Daily leaderboard top 3',               'gold',     'leaderboard', 3000,  8000, 34),
  ('ACH_LB_WIN_5',     'Repeat Champion',    'Hit #1 on Daily 5 times',               'platinum', 'leaderboard', 8000, 20000, 35),

  -- special / fun
  ('ACH_WEEKEND',      'Weekend Warrior',    'Play on Sat and Sun',                   'bronze',   'special',    100,   200,  42),
  ('ACH_HOLIDAY',      'Holiday Player',     'Play on Dec 25, Jan 1, or Songkran',    'silver',   'special',    300,   500,  43),
  ('ACH_GLOBETROTTER', 'Globetrotter',       'Set your country in profile',           'bronze',   'special',    50,    100,  44),
  ('ACH_NAMED',        'Identified',         'Set a custom display name',             'bronze',   'special',    50,    100,  45),
  ('ACH_AVATAR',       'Self-portrait',      'Choose a custom avatar',                'bronze',   'special',    50,    100,  46),
  ('ACH_THEME_COLLECT','Theme Collector',    'Own 5 themes',                          'silver',   'special',    500,   1000, 47),
  ('ACH_RICH',         'Coin Hoarder',       'Hold 10,000 coins at once',             'gold',     'special',    1000,  2000, 48),
  ('ACH_SHARE_FIRST',  'Show-off',           'Share a daily result',                  'bronze',   'special',    100,   100,  49),
  ('ACH_COMEBACK',     'Comeback Kid',       'Resume after a 7+ day break',           'bronze',   'special',    100,   200,  50),
  ('ACH_NIGHTMARE',    'Nightmare Mode',     'Win Expert with 0 mistakes and 0 hints','platinum', 'skill',      3000,  8000, 51),
  ('ACH_QUEST_50',     'Quest Crusher',      'Claim 50 daily quest rewards',          'silver',   'daily',      500,   1000, 52),
  ('ACH_FRIEND_BEAT',  'Friendly Rival',     'Beat a friend on the daily leaderboard', 'silver',  'leaderboard',300,   500,  53),
  ('ACH_LEVEL_10',     'Apprentice',         'Reach level 10',                         'silver',  'progression', 500,  1000, 60),
  ('ACH_LEVEL_25',     'Adept',              'Reach level 25',                         'gold',    'progression', 1500, 3000, 61),
  ('ACH_LEVEL_50',     'Expert',             'Reach level 50',                         'platinum','progression', 5000, 10000, 62),
  ('ACH_LEVEL_100',    'Grandmaster',        'Reach level 100',                        'platinum','progression', 15000, 50000, 63)
ON CONFLICT (id) DO NOTHING;
