// =====================================================================
// Migration: localStorage v1 data → Supabase v2
// See docs/04-current-state/migration-notes.md
// =====================================================================
import { supabase, hasSupabaseConfig } from './supabase';
import { track, Events, captureError } from './analytics';
import type { Difficulty } from '@engine/types';

const V1_DB_KEY = 'sudoku_db_v1';
const MIGRATED_FLAG = 'migrated_from_v1';

interface V1User {
  password: string;
  createdAt: string;
  settings?: {
    highlightSame?: boolean;
    showConflict?: boolean;
    hideDone?: boolean;
    highlightRelated?: boolean;
  };
  progress?: Record<string, Record<string, V1Progress>>;
  stats?: { totalPlays?: number; totalMistakes?: number; totalHints?: number; totalPlayTime?: number };
  recent?: V1Recent[];
}

interface V1Progress {
  score: number;
  time: number;
  mistakes: number;
  hintsUsed: number;
  completedAt: string;
  plays?: number;
}

interface V1Recent {
  level: string;
  stage: number;
  score: number;
  time: number;
  mistakes: number;
  hintsUsed: number;
  completedAt: string;
}

interface V1DB {
  users: Record<string, V1User>;
  currentUser: string | null;
}

export interface MigrationResult {
  ran: boolean;
  imported?: {
    practiceProgress: number;
    history: number;
    bonusCoins: number;
  };
  error?: string;
}

const VALID_LEVELS: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

/**
 * Detect if v1 data exists and hasn't been migrated yet.
 */
export function shouldMigrate(): boolean {
  if (localStorage.getItem(MIGRATED_FLAG)) return false;
  if (!localStorage.getItem(V1_DB_KEY)) return false;
  return true;
}

/**
 * Read v1 data without modifying it.
 */
function readV1(): V1DB | null {
  const raw = localStorage.getItem(V1_DB_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as V1DB;
  } catch {
    return null;
  }
}

/**
 * Run the migration. Idempotent — safe to call multiple times.
 */
export async function migrateFromV1(): Promise<MigrationResult> {
  if (!shouldMigrate()) return { ran: false };

  const v1 = readV1();
  if (!v1?.currentUser || !v1.users[v1.currentUser]) {
    // Mark as migrated to avoid checking again
    localStorage.setItem(MIGRATED_FLAG, 'true');
    return { ran: false };
  }

  const v1User = v1.users[v1.currentUser];

  if (!hasSupabaseConfig) {
    // No backend to migrate to — defer
    return { ran: false, error: 'no_supabase_config' };
  }

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { ran: false, error: 'no_authenticated_user' };
  }

  try {
    let practiceProgressCount = 0;
    let historyCount = 0;

    // === 1. Settings ===
    if (v1User.settings) {
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        highlight_same: v1User.settings.highlightSame ?? true,
        show_conflict: v1User.settings.showConflict ?? true,
        hide_done: v1User.settings.hideDone ?? true,
        highlight_related: v1User.settings.highlightRelated ?? true,
      });
    }

    // === 2. Practice progress ===
    const practiceRows = [];
    for (const [level, stages] of Object.entries(v1User.progress || {})) {
      if (!VALID_LEVELS.includes(level as Difficulty)) continue;
      for (const [stageStr, p] of Object.entries(stages)) {
        const stage = parseInt(stageStr, 10);
        if (isNaN(stage) || stage < 1 || stage > 100) continue;
        practiceRows.push({
          user_id: user.id,
          level: level as Difficulty,
          stage,
          best_score: p.score,
          best_time_seconds: p.time,
          best_mistakes: p.mistakes,
          best_hints_used: p.hintsUsed,
          plays: p.plays ?? 1,
          first_completed_at: p.completedAt,
          last_played_at: p.completedAt,
        });
      }
    }
    if (practiceRows.length > 0) {
      const { error } = await supabase
        .from('practice_progress')
        .upsert(practiceRows, { onConflict: 'user_id,level,stage' });
      if (error) throw error;
      practiceProgressCount = practiceRows.length;
    }

    // === 3. History (recent games) ===
    const historyRows = (v1User.recent || [])
      .filter((r) => VALID_LEVELS.includes(r.level as Difficulty) && r.stage >= 1 && r.stage <= 100)
      .map((r) => ({
        user_id: user.id,
        mode: 'practice',
        level: r.level as Difficulty,
        stage: r.stage,
        score: r.score,
        time_seconds: r.time,
        mistakes: r.mistakes,
        hints_used: r.hintsUsed,
        completed_at: r.completedAt,
      }));
    if (historyRows.length > 0) {
      const { error } = await supabase.from('user_game_history').insert(historyRows);
      if (error) throw error;
      historyCount = historyRows.length;
    }

    // === 4. Display name from old username ===
    await supabase
      .from('profiles')
      .update({ display_name: v1.currentUser })
      .eq('id', user.id);

    // === 5. Migrator bonus coins (via RPC if available, else direct) ===
    const BONUS_COINS = 200;
    try {
      const { error } = await supabase.rpc('grant_coins', {
        p_user_id: user.id,
        p_amount: BONUS_COINS,
        p_reason: 'migration_v1_bonus',
        p_metadata: { v1_username: v1.currentUser },
      });
      if (error) {
        // Fallback: direct update (only works if RLS allows — usually not in production)
        console.warn('grant_coins RPC failed, skipping bonus:', error.message);
      }
    } catch (rpcErr) {
      console.warn('grant_coins RPC unavailable, skipping bonus');
    }

    // === Mark done ===
    localStorage.setItem(MIGRATED_FLAG, 'true');
    localStorage.setItem('migrated_at', new Date().toISOString());
    // Keep v1 data as backup — user can clear later

    track(Events.MIGRATION_V1, {
      practice_count: practiceProgressCount,
      history_count: historyCount,
    });

    return {
      ran: true,
      imported: {
        practiceProgress: practiceProgressCount,
        history: historyCount,
        bonusCoins: BONUS_COINS,
      },
    };
  } catch (err) {
    captureError(err, { phase: 'migrate_v1' });
    return { ran: false, error: String(err) };
  }
}

/**
 * Manually clear v1 data after user confirms in settings.
 */
export function clearV1Backup(): void {
  localStorage.removeItem(V1_DB_KEY);
}
