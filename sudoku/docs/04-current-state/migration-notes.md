# 🚚 Data Migration: localStorage → Supabase

> สำหรับ user เก่าที่มี progress ใน localStorage ของ v1

## 🎯 Goal

ถ้า user ใช้ v1 อยู่ → เปิด v2 ครั้งแรก → progress ย้ายไป Supabase อัตโนมัติ → เล่นต่อได้

---

## 📋 Data Mapping

### v1 localStorage → v2 Postgres

| v1 (localStorage) | v2 (Supabase) |
|---|---|
| `users[username]` | `auth.users` (with email if upgraded) |
| `users[u].password` | bcrypt in `auth.users.encrypted_password` |
| `users[u].createdAt` | `profiles.created_at` |
| `users[u].settings` | `user_settings` |
| `users[u].progress[level][stage]` | `practice_progress` rows |
| `users[u].stats.totalPlays` | computed from `user_game_history` |
| `users[u].stats.totalMistakes` | computed |
| `users[u].stats.totalHints` | computed |
| `users[u].stats.totalPlayTime` | computed |
| `users[u].recent[]` | `user_game_history` rows |
| ❌ (no leaderboard in v1) | N/A |
| ❌ (no coins in v1) | Start fresh: 100c bonus for migrators |

---

## 🔄 Migration Algorithm

### Trigger
- เมื่อ v2 app เปิดครั้งแรก
- Check: `localStorage.sudoku_db_v1` exists + `localStorage.migrated_from_v1` not set

### Flow

```
v2 app start
  ↓
Check localStorage for v1 data
  ↓ (found)
Show modal: "Welcome back! Let's save your progress."
  ↓
[Modal options]
  - "Sign up with email" — link anon → email
  - "Continue as guest" — anonymous
  ↓
[Sign user in (anonymous if guest)]
  ↓
For each v1 user (usually 1):
  - Skip if not current user
  - Migrate practice_progress
  - Migrate user_game_history (recent[])
  - Migrate user_settings
  - Compute + insert progression
  - Bonus: grant 200 coins as "migrator gift"
  ↓
Set localStorage.migrated_from_v1 = true
  ↓
Show success: "Your progress is now saved across devices!"
```

---

## 💻 Implementation

```ts
// src/lib/migrate-from-v1.ts
import { api } from './api';

interface V1User {
  password: string;
  createdAt: string;
  settings: any;
  progress: Record<string, Record<string, any>>;
  stats: any;
  recent: any[];
}

interface V1DB {
  users: Record<string, V1User>;
  currentUser: string | null;
}

export async function migrateFromV1(): Promise<{ migrated: boolean; error?: string }> {
  // Already migrated?
  if (localStorage.getItem('migrated_from_v1') === 'true') {
    return { migrated: false };
  }

  const raw = localStorage.getItem('sudoku_db_v1');
  if (!raw) {
    return { migrated: false };
  }

  let db: V1DB;
  try {
    db = JSON.parse(raw);
  } catch {
    return { migrated: false, error: 'Invalid v1 data' };
  }

  if (!db.currentUser || !db.users[db.currentUser]) {
    return { migrated: false };
  }

  const v1User = db.users[db.currentUser];

  // Ensure logged in (anonymous OK)
  const { data: { user }, error: authErr } = await api.auth.getUser();
  if (authErr || !user) {
    return { migrated: false, error: 'No auth user' };
  }

  // Begin migration
  try {
    // 1. Settings
    await api.settings.update({
      highlight_same: v1User.settings?.highlightSame ?? true,
      show_conflict: v1User.settings?.showConflict ?? true,
      hide_done: v1User.settings?.hideDone ?? true,
      highlight_related: v1User.settings?.highlightRelated ?? true,
    });

    // 2. Practice progress
    const rows = [];
    for (const level of Object.keys(v1User.progress || {})) {
      for (const stage of Object.keys(v1User.progress[level])) {
        const p = v1User.progress[level][stage];
        rows.push({
          user_id: user.id,
          level: level as Difficulty,
          stage: parseInt(stage),
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
    if (rows.length > 0) {
      await api.practice.bulkInsert(rows);
    }

    // 3. Recent games → history
    const historyRows = (v1User.recent || []).map(r => ({
      user_id: user.id,
      mode: 'practice',
      level: r.level,
      stage: r.stage,
      score: r.score,
      time_seconds: r.time,
      mistakes: r.mistakes,
      hints_used: r.hintsUsed,
      completed_at: r.completedAt,
    }));
    if (historyRows.length > 0) {
      await api.history.bulkInsert(historyRows);
    }

    // 4. Migrator bonus (200 coins)
    await api.coins.grant({
      amount: 200,
      reason: 'migration_v1_bonus',
    });

    // 5. Display name preserved
    if (v1User /* has username */) {
      await api.profile.update({ display_name: db.currentUser });
    }

    // Mark done
    localStorage.setItem('migrated_from_v1', 'true');
    localStorage.setItem('migrated_at', new Date().toISOString());
    // Keep v1 data as backup for 30 days (don't delete yet)

    return { migrated: true };
  } catch (err) {
    return { migrated: false, error: String(err) };
  }
}
```

---

## 🎁 Migrator Incentive

- **200 starter coins** bonus
- **1 streak freeze** extra
- Special achievement: `ACH_EARLY_BIRD` — "Migrated from v1"
- Special avatar frame: "OG Player"

---

## 🚨 Edge Cases

### User has multiple v1 accounts in localStorage
- Only migrate `currentUser`
- Show option: "Found other accounts: [list] — restore later?"

### Migration fails partway
- Wrap in transaction (Edge Function approach)
- Rollback all if any step fails
- Show error + retry button

### v1 data corrupted
- Skip migration silently
- Don't block user from using v2

### User declines migration
- Don't ask again (set `declined_migration`)
- Can manually trigger from settings

### v1 user upgrades anon → email later
- Already migrated → just link email
- Migration was to anonymous, now linked

---

## 📋 Server-side Migration Endpoint

```ts
// supabase/functions/migrate-v1-data/index.ts
export default async (req: Request) => {
  const { v1Data } = await req.json();
  const userId = getUserId(req);

  // Validate v1Data structure
  if (!isValidV1Data(v1Data)) {
    return badRequest('invalid_v1_data');
  }

  // Transaction
  return db.transaction(async tx => {
    // Insert practice rows
    // Insert history rows
    // Grant 200 coins
    // Mark migrated in user_migration_log
    return { success: true };
  });
};
```

Optional: client uploads full v1 data → server processes (atomic, retryable)

---

## 📋 Removing v1 Code

หลังจาก migrate stable แล้ว (3-6 เดือน):
- Remove `migrateFromV1` function
- Delete `sudoku_db_v1` from localStorage on app start
- Update version

---

## 🔍 Acceptance Criteria

- [ ] v1 user เปิด v2 ครั้งแรก → data ย้ายถูกต้อง
- [ ] Practice progress (best scores) intact
- [ ] Settings preserved
- [ ] Display name preserved
- [ ] Bonus coins granted
- [ ] No duplicate migration
- [ ] Failure rolls back cleanly
- [ ] User declined → no nag
