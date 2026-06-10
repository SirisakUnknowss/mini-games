// =====================================================================
// API wrapper — typed access to Supabase tables + Edge Functions
// See docs/02-technical/api-spec.md
// =====================================================================
import { supabase } from './supabase';
import type { Move, Difficulty } from '@engine/types';

// === Daily Puzzle ===
export async function getDailyPuzzle(date: string) {
  const { data, error } = await supabase
    .from('daily_puzzles_public')
    .select('*')
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// === Leaderboard ===
export async function getLeaderboard(date: string, limit = 100) {
  const { data, error } = await supabase
    .from('leaderboard_view')
    .select('*')
    .eq('date', date)
    .order('rank', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getMyRank(date: string) {
  return supabase.functions.invoke('get-my-rank', { body: { date } });
}

// === Submit ===
export interface SubmitDailyPayload {
  date: string;
  started_at: string;
  completed_at: string;
  time_seconds: number;
  mistakes: number;
  hints_used: number;
  moves: Move[];
}

export async function submitDailyScore(payload: SubmitDailyPayload) {
  return supabase.functions.invoke('submit-daily-score', { body: payload });
}

export interface SubmitPracticePayload {
  level: Difficulty;
  stage: number;
  time_seconds: number;
  mistakes: number;
  hints_used: number;
}

export async function submitPracticeScore(payload: SubmitPracticePayload) {
  return supabase.functions.invoke('submit-practice-score', { body: payload });
}

// === Quests ===
export async function getDailyQuests(date: string) {
  const { data, error } = await supabase
    .from('user_daily_quests')
    .select('*')
    .eq('date', date);
  if (error) throw error;
  return data ?? [];
}

export async function claimQuestReward(date: string, questId: string) {
  return supabase.functions.invoke('claim-quest-reward', { body: { date, quest_id: questId } });
}

// === Wallet / Progression ===
export async function getWallet() {
  const { data, error } = await supabase
    .from('user_wallet')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProgression() {
  const { data, error } = await supabase
    .from('user_progression')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

// === Profile ===
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(updates: { display_name?: string; country?: string; bio?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);
  if (error) throw error;
}

// === Shop ===
export async function getShopItems(category?: string) {
  let q = supabase.from('shop_items').select('*').eq('available', true);
  if (category) q = q.eq('category', category);
  const { data, error } = await q.order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function getInventory() {
  const { data, error } = await supabase.from('user_inventory').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function getEquipped() {
  const { data, error } = await supabase.from('user_equipped').select('*').maybeSingle();
  if (error) throw error;
  return data;
}

export async function purchaseItem(itemId: string) {
  return supabase.functions.invoke('purchase-item', { body: { item_id: itemId } });
}

export async function equipItem(payload: { theme_id?: string; background_id?: string; avatar?: any }) {
  return supabase.functions.invoke('equip-item', { body: payload });
}

// === Achievements ===
export async function getAchievementDefinitions() {
  const { data, error } = await supabase.from('achievements_definitions').select('*').order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function getUserAchievements() {
  const { data, error } = await supabase.from('user_achievements').select('*');
  if (error) throw error;
  return data ?? [];
}

// === Global stats (Phase 3) ===
export async function getGlobalSummary() {
  const { data, error } = await supabase
    .from('global_stats_summary')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

// === Visitor Counter ===

export interface VisitorStats {
  today: number;
  week: number;
  total: number;
}

/** Get or create a stable session UUID in localStorage (no auth required) */
function getSessionId(): string {
  const KEY = 'sudoku_session_id_v1';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * Record a visit for today (upsert — safe to call multiple times, no auth needed).
 * Uses a stable session_id from localStorage so every device is counted once per day.
 */
export async function trackVisit(): Promise<void> {
  try {
    const session_id = getSessionId();
    const visited_date = new Date().toISOString().slice(0, 10);
    await supabase
      .from('visitor_sessions')
      .upsert({ session_id, visited_date }, { onConflict: 'session_id,visited_date' });
  } catch {
    // offline / demo mode — ignore
  }
}

/**
 * Fetch today / week / all-time unique visitor counts.
 * Returns null when Supabase is not configured or request fails.
 */
export async function getVisitorStats(): Promise<VisitorStats | null> {
  try {
    const { data, error } = await supabase.rpc('get_visitor_stats');
    if (error || !data) return null;
    return data as VisitorStats;
  } catch {
    return null;
  }
}

// === Settings ===
export async function getSettings() {
  const { data, error } = await supabase.from('user_settings').select('*').maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSettings(updates: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', user.id);
  if (error) throw error;
}
