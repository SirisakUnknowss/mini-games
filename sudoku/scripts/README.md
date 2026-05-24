# Scripts

## verify-phase-0.sh

ตรวจสอบว่า Phase 0 พร้อมหรือยัง — ใช้รัน:

```bash
npm run phase0:verify
# หรือ
./scripts/verify-phase-0.sh
```

จะเช็ค:
- โครงสร้างไฟล์ (src/engine, lib, ui, supabase, tests, docs)
- Build configs (tsconfig, vite, vitest, capacitor, .env.example)
- Migration files + seed
- Edge functions
- CI/CD workflows
- Tests passing
- Production build succeeded
- Analytics + Error tracking libs installed
- v1 migration logic wired
- Capacitor native projects
- Supabase CLI installed
