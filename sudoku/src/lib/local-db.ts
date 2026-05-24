// =====================================================================
// IndexedDB wrapper for offline queue, cache, and game state
// See docs/02-technical/offline-sync.md
// =====================================================================
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'sudoku_daily_v2';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('game_in_progress')) {
          db.createObjectStore('game_in_progress', { keyPath: 'game_id' });
        }
      },
    });
  }
  return dbPromise;
}

// === Cache ===
export async function cacheSet(key: string, value: unknown, expiresInMs?: number): Promise<void> {
  const db = await getDb();
  await db.put('cache', {
    key,
    value,
    expires_at: expiresInMs ? Date.now() + expiresInMs : undefined,
  });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const db = await getDb();
  const entry = await db.get('cache', key);
  if (!entry) return null;
  if (entry.expires_at && entry.expires_at < Date.now()) {
    await db.delete('cache', key);
    return null;
  }
  return entry.value as T;
}

// === Queue ===
export interface QueueItem {
  id: string;
  action: string;
  payload: unknown;
  created_at: number;
  retries: number;
  last_error?: string;
}

export async function queueAdd(action: string, payload: unknown): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.add('queue', { id, action, payload, created_at: Date.now(), retries: 0 });
  return id;
}

export async function queueAll(): Promise<QueueItem[]> {
  const db = await getDb();
  return db.getAll('queue');
}

export async function queueRemove(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('queue', id);
}

export async function queueUpdate(item: QueueItem): Promise<void> {
  const db = await getDb();
  await db.put('queue', item);
}

// === Game in progress (resume) ===
export interface GameInProgress {
  game_id: string;
  mode: 'daily' | 'practice';
  date?: string;
  level?: string;
  stage?: number;
  puzzle: string;
  user_board: number[];
  hint_cells: number[];
  moves: Array<{ r: number; c: number; n: number; t: number }>;
  started_at: number;
  paused_at?: number;
  elapsed_seconds: number;
  mistakes: number;
  hints_left: number;
}

export async function saveGame(game: GameInProgress): Promise<void> {
  const db = await getDb();
  await db.put('game_in_progress', game);
}

export async function loadGame(gameId: string): Promise<GameInProgress | null> {
  const db = await getDb();
  return (await db.get('game_in_progress', gameId)) ?? null;
}

export async function listGames(): Promise<GameInProgress[]> {
  const db = await getDb();
  return db.getAll('game_in_progress');
}

export async function deleteGame(gameId: string): Promise<void> {
  const db = await getDb();
  await db.delete('game_in_progress', gameId);
}
