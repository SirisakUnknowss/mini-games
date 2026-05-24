# 🌐 API Spec

> API ของ Sudoku Daily — แบ่งเป็น Supabase REST (auto) + Edge Functions (custom)

## 🔑 Base URL

```
Production:  https://<project-ref>.supabase.co
Dev:         http://localhost:54321
```

## 🔐 Authentication

ทุก request ที่ authenticated ใส่ header:
```
Authorization: Bearer <jwt_token>
apikey: <anon_or_service_key>
```

JWT มาจาก `supabase.auth.signIn(...)` หรือ anonymous session

---

## 📥 Supabase Auto REST (PostgREST)

### Profiles

#### `GET /rest/v1/profiles?id=eq.<uuid>`
ดึง profile ของ user

#### `PATCH /rest/v1/profiles?id=eq.<uuid>`
อัปเดต display_name, country, bio
```json
{ "display_name": "ผู้เล่นใหม่", "country": "TH" }
```

### Daily Puzzle (read-only public)

#### `GET /rest/v1/daily_puzzles_public?date=eq.2026-05-23`
```json
{
  "date": "2026-05-23",
  "difficulty": "hard",
  "clues": 28,
  "puzzle": "530070000600195000...",
  "solution_hash": "abc123...",
  "generated_at": "..."
}
```

⚠️ **ไม่มี `solution` field** — ดึงจาก server validation เท่านั้น

### Leaderboard

#### `GET /rest/v1/leaderboard_view?date=eq.2026-05-23&order=score.desc,time_seconds.asc&limit=100`
ดึง Top 100 ของวันนั้น

#### `GET /rest/v1/leaderboard_view?date=eq.2026-05-23&user_id=eq.<uuid>`
ตำแหน่งของ user (ใช้ window function ผ่าน RPC ดีกว่า — ดูล่าง)

### Inventory

#### `GET /rest/v1/user_inventory?user_id=eq.<uuid>`

#### `GET /rest/v1/user_equipped?user_id=eq.<uuid>`

### Shop Catalog

#### `GET /rest/v1/shop_items?available=eq.true&order=sort_order.asc`

### Practice Progress

#### `GET /rest/v1/practice_progress?user_id=eq.<uuid>&level=eq.medium`

### Achievements

#### `GET /rest/v1/achievements_definitions`

#### `GET /rest/v1/user_achievements?user_id=eq.<uuid>`

---

## ⚡ Edge Functions (Custom Logic)

ทุก function อยู่ที่ `supabase/functions/<name>/index.ts`
Endpoint: `POST /functions/v1/<name>`

### 1. `submit-daily-score`
ส่งคะแนน daily puzzle

**Request:**
```typescript
POST /functions/v1/submit-daily-score
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "date": "2026-05-23",
  "time_seconds": 412,
  "mistakes": 1,
  "hints_used": 0,
  "moves": [
    { "r": 0, "c": 2, "n": 4, "t": 1230 },
    { "r": 0, "c": 5, "n": 8, "t": 3400 },
    // ...
  ],
  "started_at": "2026-05-23T07:15:00Z",
  "completed_at": "2026-05-23T07:21:52Z"
}
```

**Response (200):**
```typescript
{
  "success": true,
  "score": 3400,
  "rank": 142,
  "total_players": 8432,
  "rewards": {
    "coins": 150,
    "xp": 200,
    "achievements_unlocked": ["ACH_NO_HINT_HARD"]
  },
  "is_personal_best": true
}
```

**Errors:**
- `400 invalid_payload`
- `403 already_submitted`
- `403 cheat_detected`
- `404 puzzle_not_found`

**Logic:**
1. Fetch `daily_puzzles` of date
2. Replay moves → verify final = solution
3. Sanity check time/mistakes
4. Compute score server-side
5. INSERT `daily_leaderboard`
6. Compute rank (window function)
7. Grant coins/XP atomically
8. Run achievement checker
9. Update streak
10. Update progression

---

### 2. `update-quest-progress`
อัปเดต quest progress เมื่อมี game event

**Request:**
```json
{
  "events": [
    { "type": "game_complete", "level": "medium", "time": 540, "mistakes": 0, "hints": 0 }
  ]
}
```

**Response:**
```typescript
{
  "updated_quests": [
    { "quest_id": "Q_PLAY_3", "progress": 2, "target": 3, "completed": false },
    { "quest_id": "Q_NO_HINT_1", "progress": 1, "target": 1, "completed": true }
  ]
}
```

---

### 3. `claim-quest-reward`
รับรางวัล quest

**Request:**
```json
{ "date": "2026-05-23", "quest_id": "Q_PLAY_3" }
```

**Response:**
```typescript
{
  "success": true,
  "rewarded": { "coins": 80, "xp": 50 },
  "new_balance": 540
}
```

---

### 4. `claim-quest-bonus`
รับ bonus เมื่อทำครบ 3 quest

**Request:**
```json
{ "date": "2026-05-23" }
```

**Response:**
```typescript
{
  "success": true,
  "rewarded": { "coins": 100, "xp": 200 },
  "loot_item": "avatar_hat_random_rare"
}
```

---

### 5. `purchase-item`
ซื้อของในร้าน

**Request:**
```json
{ "item_id": "theme_sakura" }
```

**Response:**
```typescript
{
  "success": true,
  "item_id": "theme_sakura",
  "new_balance": 240
}
```

**Errors:**
- `403 already_owned`
- `403 insufficient_coins`
- `404 item_not_found`

---

### 6. `equip-item`
เปลี่ยน item ที่ใส่อยู่

**Request:**
```json
{
  "theme_id": "theme_sakura",
  "background_id": "bg_pattern_dots",
  "avatar": { "face": "face_happy", "hat": "hat_crown", ... }
}
```

**Response:**
```typescript
{ "success": true }
```

Logic: เช็คทุก item ใน inventory ก่อน equip

---

### 7. `submit-practice-score`
ส่งคะแนน practice mode

**Request:**
```json
{
  "level": "medium",
  "stage": 42,
  "time_seconds": 380,
  "mistakes": 2,
  "hints_used": 1,
  "moves": [...]
}
```

**Response:**
```typescript
{
  "score": 1200,
  "is_personal_best": true,
  "rewards": { "coins": 10, "xp": 100 }
}
```

---

### 8. `generate-daily-puzzle`
สร้าง daily puzzle ล่วงหน้า (cron-only, service key)

**Request:**
```json
{ "dates": ["2026-05-24", "2026-05-25", ...] }
```

**Response:**
```typescript
{ "generated": [...], "skipped_existing": [...] }
```

⚠️ Require service role key (Edge Function uses env)

---

### 9. `process-streaks`
Cron daily — reset streaks ของคนที่พลาด

**Trigger:** pg_cron at 00:30 UTC

**Logic:**
```sql
For each user:
  If last_daily_played < yesterday AND current_streak > 0:
    If streak_freezes > 0:
      Consume 1 freeze
      (Keep streak)
    Else:
      Reset current_streak = 0
```

---

### 10. `distribute-leaderboard-rewards`
Cron daily — แจกรางวัล leaderboard ของเมื่อวาน

**Trigger:** pg_cron at 00:05 UTC

**Logic:**
```sql
For yesterday's leaderboard:
  Top 1 → 2000 coin + achievement ACH_TOP_1
  Top 10 → 500 coin + ACH_TOP_10
  Top 100 → 200 coin
  Top 500 → 100 coin
  Top 1000 → 50 coin
```

---

### 11. `register-push-token`
ลงทะเบียน FCM token

**Request:**
```json
{ "token": "fcm_xxx", "platform": "android", "device_info": {...} }
```

---

### 12. `get-my-rank`
ดึงตำแหน่งของ user ใน leaderboard วันที่กำหนด

**Request:**
```json
{ "date": "2026-05-23" }
```

**Response:**
```typescript
{
  "rank": 142,
  "total": 8432,
  "score": 3400,
  "percentile": 98.3
}
```

**Logic (SQL):**
```sql
WITH ranked AS (
  SELECT user_id,
    RANK() OVER (PARTITION BY date ORDER BY score DESC, time_seconds ASC) AS rank,
    COUNT(*) OVER (PARTITION BY date) AS total
  FROM daily_leaderboard WHERE date = $1
)
SELECT * FROM ranked WHERE user_id = auth.uid()
```

---

## 🔄 Realtime Channels

### `daily-leaderboard:{date}`
Subscribe เพื่อ live update เมื่อมีคน submit ใหม่

```ts
supabase.channel(`daily-leaderboard:${date}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'daily_leaderboard',
    filter: `date=eq.${date}`
  }, callback)
  .subscribe();
```

**Note:** ใช้กับเฉพาะ Top 100 update — ไม่ subscribe ทั้ง table

---

## 📊 Rate Limiting

- **Auto REST:** Supabase default
- **Edge Functions:** Per-user 100 req/min (implement ใน middleware)
- **Submit score:** 1 req/วัน/user (DB unique constraint)

---

## 🐛 Error Format

ทุก Edge Function ใช้ format:
```json
{
  "error": {
    "code": "ALREADY_SUBMITTED",
    "message": "You have already submitted today's puzzle",
    "details": {...}
  }
}
```

Codes:
- `INVALID_PAYLOAD`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `ALREADY_EXISTS`
- `INSUFFICIENT_FUNDS`
- `CHEAT_DETECTED`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

---

## 🧪 Testing

ตัวอย่าง test (Vitest):
```ts
describe('submit-daily-score', () => {
  it('rejects too-fast solves', async () => {
    const res = await callFunction('submit-daily-score', {
      date: '2026-05-23',
      time_seconds: 30,  // < min
      moves: validMoves,
    });
    expect(res.error.code).toBe('CHEAT_DETECTED');
  });
});
```
