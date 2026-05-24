# 🔨 Refactor Plan

> Step-by-step plan to evolve v1 → target architecture

## 🎯 Strategy

**Incremental, not big-bang.** Refactor while building new features.

---

## 📋 Phase 0: Foundation (Week 1-2)

### Step 1: Setup Project Structure

```bash
# Create new structure
mkdir -p src/{engine,lib,ui,state}
mkdir -p src/ui/{views,components,styles}
mkdir -p src/ui/styles/{themes,components}
mkdir -p supabase/{migrations,functions}
mkdir -p public/{avatar,bg,icons}
mkdir -p tests
```

### Step 2: Add Build Tools

```bash
npm init -y
npm install -D vite typescript @types/node vitest \
  eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install @supabase/supabase-js idb zustand workbox-window
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: { name: 'Sudoku Daily', short_name: 'Sudoku' },
    }),
  ],
});
```

### Step 3: Migrate Files

| Old | New | Action |
|---|---|---|
| `sudoku.js` | `src/engine/generator.ts` | Convert to TS, export named |
| `db.js` | `src/lib/local-db.ts` | Keep, will deprecate |
| `app.js` | Split into multiple | See Step 4 |
| `style.css` | Split into modules | See Step 5 |
| `index.html` | `index.html` | Update script tags → ES module |

### Step 4: Split `app.js`

```
src/
├── main.ts                    # entry point
├── engine/
│   ├── generator.ts           # from sudoku.js
│   ├── solver.ts              # NEW (uniqueness check)
│   ├── validator.ts           # NEW (hasConflict)
│   └── scoring.ts             # NEW (computeScore)
├── ui/
│   ├── views/
│   │   ├── login.ts           # from app.js login section
│   │   ├── menu.ts            # menu rendering
│   │   ├── stages.ts          # stage select
│   │   ├── game.ts            # game logic + render
│   │   ├── profile.ts         # profile rendering
│   │   └── settings.ts        # settings
│   └── components/
│       ├── board.ts
│       ├── numpad.ts
│       └── modal.ts
├── state/
│   └── game-state.ts          # Zustand store
└── lib/
    ├── local-db.ts            # from db.js
    └── api.ts                 # Supabase wrapper (NEW)
```

### Step 5: Split CSS

```
src/ui/styles/
├── tokens.css                 # CSS variables (extracted)
├── reset.css                  # box-sizing etc.
├── themes/
│   └── default.css            # extracted theme variables
├── components/
│   ├── button.css
│   ├── card.css
│   ├── input.css
│   ├── board.css              # game board
│   ├── numpad.css
│   ├── modal.css
│   └── nav.css
└── views/
    ├── login.css
    ├── menu.css
    └── game.css
```

### Step 6: Add Tests

```ts
// tests/engine/generator.test.ts
import { describe, it, expect } from 'vitest';
import { generatePuzzle } from '../../src/engine/generator';
import { countSolutions } from '../../src/engine/solver';

describe('generator', () => {
  it('deterministic with same seed', () => {
    const a = generatePuzzle({ difficulty: 'medium', seed: 1 });
    const b = generatePuzzle({ difficulty: 'medium', seed: 1 });
    expect(a.puzzle).toEqual(b.puzzle);
  });

  it('produces unique solutions', () => {
    const { puzzle } = generatePuzzle({ difficulty: 'hard', seed: 1 });
    expect(countSolutions(puzzle, 2)).toBe(1);
  });
});
```

### Step 7: Setup Supabase Local

```bash
npm install -g supabase
supabase init
supabase start
```

→ Local Postgres + Auth + Functions

Apply migrations:
```bash
supabase db reset  # runs migrations
```

### Step 8: Add API Layer

```ts
// src/lib/api.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const api = {
  auth: {
    signInAnonymously: () => supabase.auth.signInAnonymously(),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    // ...
  },
  daily: {
    getPuzzle: (date) => supabase.from('daily_puzzles_public').select().eq('date', date).single(),
    submitScore: (payload) => supabase.functions.invoke('submit-daily-score', { body: payload }),
  },
  // ...
};
```

### Step 9: Migrate Auth to Supabase

Replace `db.js login/signup` with `api.auth.*`:

```ts
// OLD:
const r = DB.signup(username, password);

// NEW:
const { error } = await api.auth.signUp(email, password);
```

### Step 10: Data Migration Helper

For existing localStorage users:

```ts
// src/lib/migrate-from-v1.ts
async function migrateV1Data() {
  const raw = localStorage.getItem('sudoku_db_v1');
  if (!raw) return;

  const db = JSON.parse(raw);
  if (!db.currentUser) return;

  const user = db.users[db.currentUser];

  // Anonymous sign-in
  const { data } = await api.auth.signInAnonymously();
  const userId = data.user.id;

  // Sync practice progress
  for (const level of Object.keys(user.progress || {})) {
    for (const stage of Object.keys(user.progress[level])) {
      const p = user.progress[level][stage];
      await api.practice.upsert({
        user_id: userId, level, stage: parseInt(stage),
        best_score: p.score, best_time_seconds: p.time, ...
      });
    }
  }

  // Mark migrated, remove old
  localStorage.removeItem('sudoku_db_v1');
  localStorage.setItem('migrated_from_v1', 'true');
}
```

---

## 📋 Phase 1+ Refactor (Ongoing)

### Whenever you touch a file:
1. Convert `.js` → `.ts`
2. Add types
3. Extract pure functions to engine
4. Add unit test

### Don't refactor what works
- ถ้า code v1 ใช้ได้ ไม่ต้องแก้ทันที
- แก้เมื่อเพิ่ม feature ใหม่ใกล้บริเวณนั้น

---

## ✅ Refactor Acceptance Criteria

After Phase 0:

- [ ] All v1 features work in new structure
- [ ] Local Supabase running
- [ ] Anonymous user auto-created on first open
- [ ] Game saves/loads from Supabase (not localStorage only)
- [ ] At least 1 unit test passing
- [ ] CI runs lint + test on PR
- [ ] Vite dev server hot reloads
- [ ] Production build < 200KB initial JS

---

## 🚨 Risks

| Risk | Mitigation |
|---|---|
| Refactor takes longer than 2 weeks | Hard time-box, ship "ugly" working version |
| Break existing functionality | Keep v1 files as backup until parity |
| Supabase local issues | Document setup in detail (developer-onboarding.md) |
| Type errors blocking work | Use `// @ts-expect-error` in transition |
