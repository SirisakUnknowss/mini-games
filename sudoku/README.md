# 🧩 Sudoku Daily

> Sudoku ที่คนเปิดเล่นทุกวัน — Daily puzzle + Global leaderboard + Customization

**สถานะ:** Pre-MVP — เอกสารและ infra พร้อม, ยังไม่ implement v2

---

## 📚 เอกสาร

ทุกอย่างเกี่ยวกับโปรเจ็กต์อยู่ใน [`docs/`](./docs/)

**เริ่มอ่านที่:**
- [`docs/README.md`](./docs/README.md) — Index ของเอกสารทั้งหมด
- [`docs/00-overview/vision.md`](./docs/00-overview/vision.md) — เรากำลังทำอะไรเพื่อใคร
- [`docs/00-overview/roadmap.md`](./docs/00-overview/roadmap.md) — Phase และ timeline
- [`docs/06-implementation/developer-onboarding.md`](./docs/06-implementation/developer-onboarding.md) — ลงมือทำงาน

---

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Start Supabase local
supabase start

# 3. Copy env
cp .env.example .env.local
# (เติม anon key จาก `supabase status`)

# 4. Apply migrations + seed
supabase db reset

# 5. Run dev
npm run dev
```

App: `http://localhost:5173`
Studio: `http://localhost:54323`

---

## 📁 Structure

```
sudoku/
├── docs/                # 📖 All documentation
├── src/                 # Source code (TBD — phase 0 refactor)
├── supabase/
│   ├── migrations/      # DB schema
│   ├── functions/       # Edge Functions
│   ├── config.toml
│   └── seed.sql
├── tests/
├── .github/workflows/   # CI/CD
└── package.json
```

---

## 🛠️ Current v1 Code

ไฟล์ v1 (vanilla JS) ยังอยู่ที่ root:
- `index.html`
- `app.js`
- `db.js`
- `sudoku.js`
- `style.css`

**จะถูก refactor ใน Phase 0** (ดู [`docs/04-current-state/refactor-plan.md`](./docs/04-current-state/refactor-plan.md))

---

## 📋 Next Steps

1. อ่าน [`docs/06-implementation/developer-onboarding.md`](./docs/06-implementation/developer-onboarding.md)
2. ทำตาม Phase 0 ใน [`docs/00-overview/roadmap.md`](./docs/00-overview/roadmap.md)
3. ทำ refactor ตาม [`docs/04-current-state/refactor-plan.md`](./docs/04-current-state/refactor-plan.md)

---

## 📞 Owner

sirisak.unknowss@gmail.com
