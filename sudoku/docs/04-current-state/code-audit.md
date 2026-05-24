# 🔍 Current Code Audit (v1)

> Review code ปัจจุบันใน `sudoku/` ก่อน refactor

**ที่อยู่:** `/Users/unknowss/Documents/GitHub/mini-games/sudoku/`

**ไฟล์ปัจจุบัน:**
```
sudoku/
├── ARCHITECTURE.md      ← มีอยู่แล้ว, จะ deprecate
├── index.html           ~235 บรรทัด
├── style.css            ~500 บรรทัด
├── sudoku.js            ~85 บรรทัด (engine)
├── db.js                ~175 บรรทัด (localStorage)
└── app.js               ~530 บรรทัด (UI + logic)
```

---

## 👍 สิ่งที่ดี (Keep)

### 1. แยกชั้นค่อนข้างชัด
- `sudoku.js` = pure engine (no DOM)
- `db.js` = data layer
- `app.js` = UI

**Verdict:** Architecture pattern ดี — แค่ต้องขยายเป็น proper modules

### 2. Seeded RNG
- ใช้ LCG → deterministic
- ทำให้ "ด่าน N" ได้ puzzle เดิมเสมอ

**Keep:** Algorithm ใช้ต่อได้, แค่เปลี่ยน seed source

### 3. Score formula
- Logical, มี penalty cap
- Implement ใน [`leaderboard.md`](../01-game-design/leaderboard.md) ใช้ต่อ

### 4. UI/UX foundation
- Card-based layout
- Glassmorphism style
- Mobile-responsive (clamp font sizes)

### 5. Hint system
- Manhattan distance → ใกล้ selected → smart
- Visual differentiation (สีเขียว)

### 6. Settings ที่มี
- highlight same, conflict, hide done, related — ทุกอันมีประโยชน์, keep ใน v2

---

## 🔴 สิ่งที่ต้องแก้ (Critical)

### 1. ❌ ไม่มี Uniqueness Check
**ไฟล์:** `sudoku.js:64-81`

```js
// Random remove cells — no uniqueness check
const positions = shuffle(Array.from({length:81}, (_,i) => i), rng);
for (const p of positions) {
  if (removed >= cellsToRemove) break;
  puzzle[r][c] = 0;
}
```

**Impact:** Hard/Expert อาจมีหลายเฉลย
**Fix:** ดู [`02-technical/puzzle-generator.md`](../02-technical/puzzle-generator.md)

### 2. ❌ Security: localStorage Password
**ไฟล์:** `db.js:30-33`

```js
function hashPw(pw) {
  return btoa('sudoku-salt-v1::' + pw);
}
```

**Impact:** decode base64 = เห็น password
**Fix:** ใช้ Supabase Auth + bcrypt (server)

### 3. ❌ No Anti-cheat
- Score คำนวณ client → trust ไม่ได้
- localStorage แก้ได้ → คะแนนปลอม

**Fix:** Server-side validation ใน Edge Function

### 4. ❌ No Cross-device Sync
- localStorage ผูกกับ browser/device
- ลงแอปใหม่ → ข้อมูลหาย

**Fix:** Supabase + cloud sync

### 5. ❌ DOM/Logic Coupling ใน app.js
**ไฟล์:** `app.js` — global state vars

```js
let currentLevel = null;
let currentStage = null;
let solution = null;
let given = null;
// ...
```

**Impact:** Untestable, hard to extend
**Fix:** State management (Zustand) + separation

---

## ⚠️ สิ่งที่ควรแก้ (High Priority)

### 1. No TypeScript
- ทุกไฟล์ `.js` → ไม่มี type safety
- Bug รัน runtime แทน compile

**Fix:** Migrate to TypeScript ทีละไฟล์

### 2. Username regex รับภาษาไทยแต่ใช้ pattern ไม่ตรง
**ไฟล์:** `db.js:54`

```js
if (!/^[a-zA-Z0-9_฀-๿]{3,20}$/.test(username))
```

`฀-๿` = unicode range ที่อาจไม่ครอบคลุมตัวอักษรไทยทั้งหมด (ขาดสระบาง, วรรณยุกต์)

**Fix:** `฀-๿` หรือใช้ `\p{Script=Thai}` regex u flag

### 3. No Undo/Redo
- ผู้เล่น Sudoku ระดับสูงต้องการ undo
- Common pain point

**Fix:** Implement command pattern + stack

### 4. No Pencil Marks (Notes)
- Essential feature สำหรับ Hard/Expert
- ทุก Sudoku app ดังๆ มี

**Fix:** Add note mode + notes data structure

### 5. Mistake Counting "Forever"
**ไฟล์:** `app.js:294`

```js
if (n !== solution[r][c]) {
  mistakes++;
}
```

- กรอกผิด → +1, แก้ → ไม่ลด
- กรอกเลข 5 ตัวผิด → +5 ครั้ง

**Q:** intent หรือ bug?
- Sudoku.com counts mistakes differently (กรอกผิดในช่อง = 1)
- ตอนนี้: ผิด 5 ครั้งใน 1 ช่อง = 5 mistakes

**Fix:** Decide rule + document. Consider: max 3 mistakes → game over (option)

### 6. No Loading State
**ไฟล์:** `app.js:166`

```js
setTimeout(() => { ... }, 30);  // hack to show loading
```

**Fix:** Real loading state, web worker for generation

### 7. Modal Cleanup Memory Leak
**ไฟล์:** `app.js:480-486`

```js
const newOk = okBtn.cloneNode(true);
okBtn.parentNode.replaceChild(newOk, okBtn);
```

DOM cloning to reset listeners → ทำเสี่ยง memory leak

**Fix:** Proper event listener management

---

## 🟡 สิ่งที่ควรปรับปรุง (Nice-to-have)

### 1. Hardcoded Strings (i18n)
- ภาษาไทยเขียนตรงๆ ในโค้ด
- Hard to translate

**Fix:** i18n library (`@formatjs/intl`) ใน phase 4+

### 2. No Animations
- ชนะ = แค่ modal โผล่
- Sudoku ที่ดังมี animation ทำให้ปลื้ม

**Fix:** Confetti, cell glow, row complete animation

### 3. No Sound
- Sudoku quality games มีเสียง tap + win
- ปิดได้ใน setting

### 4. No Haptic
- Mobile feel ดีกว่ามากเมื่อมี haptic
- ใช้ Capacitor plugin

### 5. CSS organize
- ทุก style ในไฟล์เดียว
- Hard to maintain when add themes

**Fix:** Split: `tokens.css`, `themes/*.css`, `components/*.css`

### 6. No Error Boundary
- JS error → blank screen
- ไม่มี graceful degradation

**Fix:** Try/catch + error UI

---

## 📊 Code Metrics

| Metric | Value |
|---|---|
| Total LOC | ~1,525 |
| JS LOC | ~790 |
| Largest file | `app.js` 530 lines |
| Unit tests | 0 ❌ |
| TypeScript | 0% ❌ |
| Comments | Sparse |
| External deps | 0 (vanilla) |

---

## 🎯 Priority Matrix

| Issue | Impact | Effort | Priority |
|---|---|---|---|
| Uniqueness check | 🔴 High | Medium | P0 |
| Anti-cheat (server validate) | 🔴 High | High | P0 |
| Migrate to Supabase | 🔴 High | High | P0 |
| TypeScript migration | 🟡 Medium | Medium | P1 |
| Add undo/redo | 🟡 Medium | Medium | P1 |
| Pencil marks | 🟡 Medium | Medium | P1 |
| Refactor state mgmt | 🟡 Medium | Medium | P1 |
| Animations | 🟢 Low | Low | P2 |
| Sound + haptic | 🟢 Low | Low | P2 |
| i18n | 🟢 Low | High | P3 |

---

## 📋 Recommended Refactor Strategy

**Choice:** Incremental rewrite (not big-bang)

### Why?
- v1 ใช้ได้, ไม่ broken
- Big-bang เสียเวลา + bug ใหม่
- Incremental ทำได้ตอน implement feature ใหม่

### Order
ดู [`refactor-plan.md`](./refactor-plan.md)
