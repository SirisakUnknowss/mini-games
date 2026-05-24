# 🔌 Offline Sync Strategy

> Offline-first approach — เล่นได้แม้ไม่มีเน็ต, sync เมื่อกลับมา online

## 🎯 Goals

1. เล่น Sudoku ได้แม้ offline
2. ข้อมูลไม่หาย (action queue)
3. Conflict resolution: server is source of truth
4. UI feel responsive ผ่าน optimistic updates

---

## 📦 Local Storage Strategy

### IndexedDB (via `idb` library)

**Stores:**
| Store | Purpose |
|---|---|
| `cache` | Cached daily puzzles, shop catalog, achievements defs |
| `queue` | Pending actions to sync |
| `user_state` | Local snapshot ของ user data |
| `game_in_progress` | Resume incomplete games |

### Schema
```ts
interface Cache {
  key: string;
  value: any;
  expires_at?: number;
}

interface QueueItem {
  id: string;          // UUID
  action: string;      // 'submit_score', 'claim_quest', 'purchase'
  payload: any;
  created_at: number;
  retries: number;
  last_error?: string;
}

interface GameInProgress {
  game_id: string;
  mode: 'daily' | 'practice';
  date?: string;
  level?: string;
  stage?: number;
  puzzle: string;
  user_board: number[][];
  moves: Move[];
  started_at: number;
  paused_at?: number;
}
```

---

## 🔄 Sync Patterns

### Pattern A: Cache-first Read (Static Data)
ใช้กับ: shop catalog, achievements defs, daily puzzle (today's), themes

```ts
async function getDailyPuzzle(date: string) {
  // 1. Try cache
  const cached = await idb.get('cache', `puzzle:${date}`);
  if (cached) return cached.value;

  // 2. Fetch from server
  const puzzle = await api.getDailyPuzzle(date);

  // 3. Cache it
  await idb.put('cache', { key: `puzzle:${date}`, value: puzzle });
  return puzzle;
}
```

### Pattern B: Optimistic Update + Queue (Mutations)

```ts
async function submitScore(payload: SubmitScorePayload) {
  // 1. Update UI optimistically
  store.set('last_submitted_score', payload.score);

  // 2. Try sync immediately
  if (navigator.onLine) {
    try {
      const result = await api.submitScore(payload);
      return result;
    } catch (err) {
      // fall through to queue
    }
  }

  // 3. Queue for later
  await idb.add('queue', {
    id: uuid(),
    action: 'submit_score',
    payload,
    created_at: Date.now(),
    retries: 0,
  });

  return { queued: true };
}
```

### Pattern C: Realtime + Cache (Leaderboard)

ดู leaderboard:
1. Show cached version immediately
2. Fetch fresh
3. Subscribe realtime updates

---

## 🔧 Sync Worker

```ts
// src/lib/sync.ts
class SyncWorker {
  private running = false;

  start() {
    window.addEventListener('online', () => this.drain());
    setInterval(() => this.drain(), 60_000);  // every 1 min
  }

  async drain() {
    if (this.running || !navigator.onLine) return;
    this.running = true;

    try {
      const items = await idb.getAll('queue');
      items.sort((a, b) => a.created_at - b.created_at);

      for (const item of items) {
        try {
          await this.process(item);
          await idb.delete('queue', item.id);
        } catch (err) {
          item.retries++;
          item.last_error = String(err);
          if (item.retries > 5) {
            await this.moveToDeadLetter(item);
            await idb.delete('queue', item.id);
          } else {
            await idb.put('queue', item);
          }
        }
      }
    } finally {
      this.running = false;
    }
  }

  async process(item: QueueItem) {
    switch (item.action) {
      case 'submit_score':
        return await api.submitScore(item.payload);
      case 'claim_quest':
        return await api.claimQuest(item.payload);
      case 'purchase':
        return await api.purchase(item.payload);
      // ...
    }
  }
}
```

---

## ⚔️ Conflict Resolution

### Score submission
- Server unique constraint `(date, user_id)` กัน double submit
- ถ้า queue → server response → drop from queue
- ถ้า server reject "already submitted" → drop silently

### Coin balance
- **Server is source of truth**
- Client optimistic + reconcile when sync
- ถ้า client guess ผิด → UI snap to server value

### Settings
- Last-write-wins
- ใช้ `updated_at` เปรียบเทียบ

### Practice progress
- Server keeps **best score**
- Client send all attempts → server pick max

### Quest progress
- Client tracks locally
- Server recomputes from actual events
- ถ้าไม่ตรง → server is source of truth

---

## 🎮 Game Resume

```ts
// Auto-save every 10 seconds during game
setInterval(async () => {
  if (currentGame && !gameWon) {
    await idb.put('game_in_progress', {
      game_id: currentGame.id,
      ...currentGame,
      paused_at: Date.now(),
    });
  }
}, 10_000);

// On app open
async function checkResume() {
  const games = await idb.getAll('game_in_progress');
  if (games.length > 0) {
    const game = games[0];
    showResumePrompt(game);  // "Continue last game?"
  }
}
```

**Note:** Daily puzzle resume only valid until end-of-day UTC

---

## 🔍 What to Cache vs Not

### ✅ Cache
- Shop catalog (refresh weekly)
- Achievement defs (refresh on app version change)
- Daily puzzle (until end of day)
- User profile (refresh on update)
- Avatar assets

### ❌ Don't Cache
- Leaderboard (always fresh)
- Coin balance (use server)
- Realtime data

---

## 📶 Network State UI

```ts
// Show banner when offline
window.addEventListener('offline', () => {
  showBanner('คุณกำลังออฟไลน์ — เล่นได้ปกติ จะ sync เมื่อเชื่อมเน็ต');
});
window.addEventListener('online', () => {
  hideBanner();
  syncWorker.drain();
});
```

### Indicators
- Queue badge: "3 actions pending sync"
- Last sync timestamp
- Manual "Sync now" button

---

## 🚀 Service Worker (PWA)

```ts
// workbox config
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST);

// Static assets — cache first
registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({ cacheName: 'static' })
);

// API GET — stale-while-revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/rest/v1/'),
  new StaleWhileRevalidate({ cacheName: 'api' })
);

// API POST — never cache, fall back to queue (handled in app code)
```

---

## 🧪 Testing

```ts
describe('offline sync', () => {
  it('queues actions when offline', async () => {
    setOnline(false);
    await submitScore(payload);
    const queue = await idb.getAll('queue');
    expect(queue.length).toBe(1);
  });

  it('drains queue when back online', async () => {
    setOnline(false);
    await submitScore(payload);
    setOnline(true);
    await syncWorker.drain();
    expect(await idb.getAll('queue')).toHaveLength(0);
  });

  it('handles duplicate submission gracefully', async () => {
    await submitScore(payload);
    await submitScore(payload);  // server rejects 2nd
    expect(await idb.getAll('queue')).toHaveLength(0);
  });
});
```
