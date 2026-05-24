# 🎮 Browser Games Collection

โปรเจกต์รวมเกมเล่นใน browser แบบไม่ต้อง build/server — เปิดไฟล์ HTML ได้เลย
ทุกเกมเขียนด้วย **HTML + CSS + Vanilla JS** เก็บข้อมูลทั้งหมดใน **localStorage**

**ทั้ง 3 เกมมี:**
- 🔐 ระบบ Login / Signup (multi-user ใน localStorage)
- 📊 หน้า Profile + สถิติส่วนตัว
- ⚙️ Settings ต่อ user (เปลี่ยนรหัสผ่าน, ล้างสถิติ, ลบบัญชี)
- 🏆 Global Leaderboard (รวม high score ของผู้ใช้ทุกคนในเครื่อง)

---

## 📂 โครงสร้างโปรเจกต์

```
MatchThree/
├── README.md
├── match-three/            ← เกม 1: Match Three
│   ├── index.html
│   ├── style.css
│   ├── db.js               ← user/data layer (key: mt_db_v1)
│   └── app.js              ← UI + game logic
├── suika/                  ← เกม 2: Ball Merge (Suika-like)
│   ├── index.html
│   ├── style.css
│   ├── db.js               ← key: suika_db_v1
│   ├── game.js             ← physics + canvas rendering
│   └── app.js              ← UI + user system
└── sudoku/                 ← เกม 3: Sudoku
    ├── index.html
    ├── style.css
    ├── sudoku.js           ← puzzle generator (seeded)
    ├── db.js               ← key: sudoku_db_v1
    ├── app.js              ← UI controllers
    └── ARCHITECTURE.md     ← เอกสารเชิงลึก
```

---

## 🎯 เกม 1: Match Three (`match-three/`)

**แนวเกม:** จับคู่ 3 แบบคลาสสิก (Bejeweled / Candy Crush-style)

### กลไก
- กระดาน **8×8** มีสัญลักษณ์ 6 ชนิด (🍎🍇🍋🍒🍊💎)
- คลิกเลือกช่องแล้วคลิกข้างเคียงเพื่อสลับ
- จับคู่ ≥3 แนวตั้ง/แนวนอน → ระเบิด + ของใหม่ตกลงมา
- **Combo chain**: chain ติดกัน x1, x2, x3 ... ทวีคูณคะแนน

### ระบบ
| ระบบ | รายละเอียด |
|---|---|
| Score | `match_count × 10 × combo` |
| Timer | 3 / 5 / 10 นาที (ตั้งใน settings) |
| Stats | high score, total score, total plays, total matches, max combo, play time |
| Leaderboard | คะแนนสูงสุด (per user) ของผู้เล่นทุกคนในเครื่อง |

### Database (`mt_db_v1`)
```ts
{
  currentUser: string | null,
  users: {
    [username]: {
      password, createdAt,
      settings: { animations, durationMin },
      stats: { totalPlays, totalScore, totalMatches, totalPlayTime, highScore, maxCombo },
      recent: [{ score, matches, maxCombo, duration, playedAt }]  // 20 ล่าสุด
    }
  }
}
```

---

## 🏀 เกม 2: Ball Merge / Suika (`suika/`)

**แนวเกม:** ปล่อยลูกบอลลงมา ชนชนิดเดียวกันรวมร่างเป็นลูกถัดไป

### กลไก
- เลื่อนเมาส์เล็ง, คลิกปล่อย
- ลูกชนิดเดียวกันชน → รวมร่าง + ได้คะแนน
- ลูกค้างเหนือเส้น danger นานเกินไป → จบเกม

### ลำดับวิวัฒนาการ (11 ระดับ)
🏓 → 🎱 → 🥎 → ⚾ → 🎾 → 🏐 → ⚽ → 🏀 → 🌕 → 🪩 → 🌎

### Physics (custom, ไม่ใช้ engine)
- Gravity `0.4`, friction `0.99`, bounce `0.3`
- Collision pairwise O(n²), แก้ overlap + impulse
- **Pattern:** mark `merged=true` ในรอบ collision แล้วค่อย filter หลัง loop จบ (ป้องกัน null pointer ระหว่าง iterate)

### ระบบ
| ระบบ | รายละเอียด |
|---|---|
| Score | สะสมตามคะแนนของลูกที่ merge (1, 3, 6, 10, ..., 66) |
| Stats | high score, highest ball reached, total plays, total merges, total score, play time |
| Settings | แสดงเส้นเล็ง / preview ลูกถัดไปบนกระดาน |

### Database (`suika_db_v1`)
```ts
{
  currentUser, users: {
    [username]: {
      password, createdAt,
      settings: { showAim, showPreview },
      stats: { totalPlays, totalScore, totalMerges, totalPlayTime, highScore, highestBall },
      recent: [{ score, merges, highestBall, duration, playedAt }]
    }
  }
}
```

### โครงสร้างไฟล์ภายใน
- `game.js` — encapsulate physics เป็น `window.SuikaGame` มี `start({ settings, onScoreChange, onNextChange, onGameOver })` และ `stop()`
- `app.js` — สั่ง start/stop เมื่อเข้า/ออกหน้าเกม, จัดการ user system

---

## 🧩 เกม 3: Sudoku (`sudoku/`)

**แนวเกม:** Sudoku 9×9 มี 4 ระดับความยาก × 100 ด่าน

📄 **ดู [`sudoku/ARCHITECTURE.md`](sudoku/ARCHITECTURE.md) สำหรับรายละเอียดเชิงลึก**

### ฟีเจอร์หลัก
- 4 ระดับ (Easy / Medium / Hard / Expert) × 100 ด่าน = **400 ด่าน**
- ปริศนา reproducible — seeded RNG ตาม (level, stage)
- ระบบตัวช่วย 3 ครั้ง/ด่าน
- จับเวลา + นับจำนวนผิด
- ปุ่มเลขซ่อนเมื่อกรอกครบ 9 ตัว
- ระบบคะแนน → จัดอันดับ
- หน้าโปรไฟล์ + สถิติแยกตามระดับ

### สูตรคะแนน
```
score = max(100, base - timeSec*2 - mistakes*50 - hintsUsed*150)
base: easy 1000 / medium 2000 / hard 3500 / expert 5000
```

---

## 🗄️ การเก็บข้อมูล (localStorage keys)

| Key | เกม |
|---|---|
| `mt_db_v1` | Match Three |
| `suika_db_v1` | Ball Merge |
| `sudoku_db_v1` | Sudoku |

> ทั้ง 3 keys **แยกกันคนละเกม** — ลบ key หนึ่งไม่กระทบอีกเกม
> ผู้ใช้ที่สร้างในเกม A ใช้ login เกม B ไม่ได้ (account แยกตามเกม)

---

## 🔐 Auth Pattern (เหมือนกันทั้ง 3 เกม)

แต่ละเกมมี `db.js` ของตัวเอง ใช้ pattern เดียวกัน:

```js
DB.signup(username, password)     // → { ok, err? }
DB.login(username, password)      // → { ok, err? }
DB.logout()
DB.getCurrentUser()               // → { username, password, settings, stats, recent, ... } | null
DB.updateSettings(partial)
DB.changePassword(oldPw, newPw)   // → { ok, err? }
DB.resetProgress()                // ล้างสถิติ ไม่ลบบัญชี
DB.deleteAccount()
DB.recordGame({...})              // → { isNewBest }
DB.getGlobalLeaderboard(limit)    // → [{ name, score, ... }]
DB.listUsers()                    // → [username, ...]
```

### ⚠️ ไม่ใช่ security จริง
- รหัสผ่าน hash ด้วย `btoa('<game>-salt-v1::' + pw)` — แค่ obfuscate
- ถ้าจะไป production ต้องย้ายไป server + bcrypt/argon2 + session/JWT

---

## 🚀 ถ้าจะเอาไป Production

### ทั่วไป
1. **Backend จริง** — ทุก DB ตอนนี้อยู่ใน localStorage; ต้องมี API + database จริง (PostgreSQL / Supabase / Firebase)
2. **Auth จริง** — bcrypt + session/JWT, email verification, reset password
3. **Global Leaderboard ข้ามอุปกรณ์** — ตอนนี้ "global" คือแค่ในเครื่องเดียวกัน
4. **Build system** — Vite / esbuild เพื่อ minify
5. **Framework** — React/Vue ถ้าจะขยาย UI ซับซ้อนขึ้น
6. **PWA** — manifest + service worker เพื่อเล่น offline + ติดตั้งบนมือถือ
7. **Asset polish** — เปลี่ยน emoji → SVG เพื่อความสม่ำเสมอข้าม OS
8. **Testing** — unit test (logic) + Playwright (E2E)
9. **Anti-cheat** — user แก้ localStorage โดยตรงเพื่อปลอมคะแนนได้ ต้อง server-side validate

### เฉพาะเกม
- **Match Three**: เพิ่ม deadlock detection (no possible move → shuffle), booster, level system
- **Suika**: ใช้ physics engine จริง (Matter.js), เพิ่ม particle / sound
- **Sudoku**: เพิ่ม uniqueness check ใน generator, notes/pencil marks, daily challenge

---

## 🔧 รัน

เปิดไฟล์ `index.html` ของแต่ละเกมใน browser ได้ตรงๆ:
- `match-three/index.html`
- `suika/index.html`
- `sudoku/index.html`

หรือยิง local server:
```bash
python3 -m http.server 8000
# http://localhost:8000/match-three/
# http://localhost:8000/suika/
# http://localhost:8000/sudoku/
```

ไม่ต้อง npm install อะไรทั้งสิ้น ✨
