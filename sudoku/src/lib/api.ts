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
  today_guests: number;
  today_members: number;
  week: number;
  total: number;
  online: number;
  online_guests: number;
  online_members: number;
}

/** Get or create a stable session UUID in localStorage (no auth required) */
export function getSessionId(): string {
  const KEY = 'sudoku_session_id_v1';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * Get or create a human-readable guest display ID (e.g. "G-A1B2C3").
 * Persisted in localStorage — same device = same ID even after login.
 */
export function getGuestDisplayId(): string {
  const KEY = 'sudoku_guest_display_id_v1';
  let id = localStorage.getItem(KEY);
  if (!id) {
    // Alphabet without confusing chars (O/0, I/1, S/5, Z/2)
    const chars = 'ABCDEFGHJKLMNPQRTUVWXY3467';
    const rand = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    id = `G-${rand}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * Record a visit for today + mark as guest or member.
 * Uses session_id from localStorage — no auth required.
 */
export async function trackVisit(isGuest: boolean): Promise<void> {
  try {
    const session_id = getSessionId();
    const visited_date = new Date().toISOString().slice(0, 10);
    await supabase
      .from('visitor_sessions')
      .upsert(
        { session_id, visited_date, is_guest: isGuest },
        { onConflict: 'session_id,visited_date' }
      );
  } catch { /* offline / demo mode */ }
}

/**
 * Heartbeat — call every 30s to stay "online".
 * Upserts into online_sessions; stale rows (>2min) = offline.
 */
export async function heartbeat(isGuest: boolean): Promise<void> {
  try {
    const session_id = getSessionId();
    await supabase
      .from('online_sessions')
      .upsert(
        { session_id, last_seen: new Date().toISOString(), is_guest: isGuest },
        { onConflict: 'session_id' }
      );
  } catch { /* offline / demo mode */ }
}

/**
 * Remove this session from online list (call on page close).
 */
export async function leaveOnline(): Promise<void> {
  try {
    const session_id = getSessionId();
    await supabase.from('online_sessions').delete().eq('session_id', session_id);
  } catch { /* ignore */ }
}

// === Guest Leaderboard ===

export interface GuestLeaderboardRow {
  session_id: string;
  guest_display_id: string;
  daily_date: string;
  time_seconds: number;
  mistakes: number;
  hints_used: number;
  score: number;
  rank: number;
  total_players: number;
  completed_at: string;
}

export interface SubmitGuestScorePayload {
  mode: 'daily' | 'practice';
  daily_date?: string;
  level: string;
  time_seconds: number;
  mistakes: number;
  hints_used: number;
  score: number;
}

/** Save a guest game result (no auth required). */
export async function submitGuestScore(payload: SubmitGuestScorePayload): Promise<void> {
  try {
    const session_id = getSessionId();
    const guest_display_id = getGuestDisplayId();
    await supabase.from('guest_game_history').insert({
      session_id,
      guest_display_id,
      mode: payload.mode,
      daily_date: payload.daily_date ?? null,
      level: payload.level,
      time_seconds: payload.time_seconds,
      mistakes: payload.mistakes,
      hints_used: payload.hints_used,
      score: payload.score,
    });
  } catch { /* offline / demo mode */ }
}

/** Fetch guest leaderboard for a given date. */
export async function getGuestLeaderboard(date: string, limit = 100): Promise<GuestLeaderboardRow[]> {
  const { data, error } = await supabase
    .from('guest_leaderboard_view')
    .select('*')
    .eq('daily_date', date)
    .order('rank', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as GuestLeaderboardRow[];
}

/**
 * Move all guest scores on this device to a real user account.
 * Called automatically after a guest signs up / logs in.
 */
export async function migrateGuestScores(): Promise<number> {
  try {
    const session_id = getSessionId();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const { data, error } = await supabase.rpc('migrate_guest_scores', {
      p_session_id: session_id,
      p_user_id: user.id,
    });
    if (error) { console.warn('[migrateGuestScores]', error); return 0; }
    return (data as number) ?? 0;
  } catch { return 0; }
}

/**
 * Fetch full visitor stats: today (guest/member), week, total, online now.
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
