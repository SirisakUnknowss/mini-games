// =====================================================================
// Quest definitions and generator
// See docs/01-game-design/daily-quest.md
// =====================================================================
import { seededRng, hashString, shuffle } from './rng';

export type QuestTier = 1 | 2 | 3;

export interface QuestDef {
  id: string;
  description: string;
  tier: QuestTier;
  target: number;
  rewardCoin: number;
  rewardXp: number;
  /** Event types that increment progress */
  trigger: QuestTrigger;
}

export type QuestTrigger =
  | { type: 'play_any'; count: number }
  | { type: 'play_daily'; count: number }
  | { type: 'play_level'; level: string; count: number }
  | { type: 'win_no_hint'; count: number }
  | { type: 'win_no_mistake'; count: number }
  | { type: 'win_fast'; level?: string; maxSeconds: number; count: number }
  | { type: 'leaderboard_rank'; max: number }
  | { type: 'login'; count: number };

/** Quest pool — sampled to create daily quests */
export const QUEST_POOL: QuestDef[] = [
  // Tier 1: Easy
  { id: 'Q_DAILY', tier: 1, description: 'Play today\'s Daily Puzzle', target: 1, rewardCoin: 50, rewardXp: 50,
    trigger: { type: 'play_daily', count: 1 } },
  { id: 'Q_PLAY_ANY', tier: 1, description: 'Win any game', target: 1, rewardCoin: 30, rewardXp: 30,
    trigger: { type: 'play_any', count: 1 } },
  { id: 'Q_LOGIN', tier: 1, description: 'Open the app', target: 1, rewardCoin: 20, rewardXp: 20,
    trigger: { type: 'login', count: 1 } },

  // Tier 2: Medium
  { id: 'Q_PLAY_3', tier: 2, description: 'Win 3 games', target: 3, rewardCoin: 80, rewardXp: 100,
    trigger: { type: 'play_any', count: 3 } },
  { id: 'Q_EASY_2', tier: 2, description: 'Win 2 Easy games', target: 2, rewardCoin: 60, rewardXp: 80,
    trigger: { type: 'play_level', level: 'easy', count: 2 } },
  { id: 'Q_MEDIUM_1', tier: 2, description: 'Win 1 Medium game', target: 1, rewardCoin: 70, rewardXp: 100,
    trigger: { type: 'play_level', level: 'medium', count: 1 } },
  { id: 'Q_NO_HINT_1', tier: 2, description: 'Win 1 game without using hints', target: 1, rewardCoin: 100, rewardXp: 100,
    trigger: { type: 'win_no_hint', count: 1 } },
  { id: 'Q_FAST_EASY', tier: 2, description: 'Win Easy in under 5 minutes', target: 1, rewardCoin: 80, rewardXp: 100,
    trigger: { type: 'win_fast', level: 'easy', maxSeconds: 300, count: 1 } },

  // Tier 3: Hard
  { id: 'Q_PERFECT', tier: 3, description: 'Win a game with zero mistakes', target: 1, rewardCoin: 150, rewardXp: 200,
    trigger: { type: 'win_no_mistake', count: 1 } },
  { id: 'Q_HARD_1', tier: 3, description: 'Win 1 Hard game', target: 1, rewardCoin: 180, rewardXp: 250,
    trigger: { type: 'play_level', level: 'hard', count: 1 } },
  { id: 'Q_EXPERT_1', tier: 3, description: 'Win 1 Expert game', target: 1, rewardCoin: 250, rewardXp: 400,
    trigger: { type: 'play_level', level: 'expert', count: 1 } },
  { id: 'Q_TOP_500', tier: 3, description: 'Reach Daily Leaderboard top 500', target: 1, rewardCoin: 200, rewardXp: 200,
    trigger: { type: 'leaderboard_rank', max: 500 } },
  { id: 'Q_TOP_100', tier: 3, description: 'Reach Daily Leaderboard top 100', target: 1, rewardCoin: 400, rewardXp: 400,
    trigger: { type: 'leaderboard_rank', max: 100 } },
  { id: 'Q_PLAY_5', tier: 3, description: 'Win 5 games today', target: 5, rewardCoin: 200, rewardXp: 250,
    trigger: { type: 'play_any', count: 5 } },
];

const POOL_BY_TIER: Record<QuestTier, QuestDef[]> = {
  1: QUEST_POOL.filter(q => q.tier === 1),
  2: QUEST_POOL.filter(q => q.tier === 2),
  3: QUEST_POOL.filter(q => q.tier === 3),
};

/**
 * Generate 3 daily quests for a user on a given date.
 * Deterministic per (userId, date).
 */
export function generateDailyQuests(userId: string, dateIso: string): QuestDef[] {
  const seed = hashString(userId + ':' + dateIso);
  const rng = seededRng(seed);
  return [
    shuffle(POOL_BY_TIER[1], rng)[0],
    shuffle(POOL_BY_TIER[2], rng)[0],
    shuffle(POOL_BY_TIER[3], rng)[0],
  ];
}
