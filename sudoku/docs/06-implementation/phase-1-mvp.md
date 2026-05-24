# 📦 Phase 1: MVP Tasks

> Detailed task breakdown for Phase 1 (6 weeks, week 3-8)

## 🎯 Phase 1 Goal

Daily puzzle + Daily leaderboard + Daily quest + Streak → soft launch

**Exit criteria:**
- 500+ real users signed up
- D7 retention > 15%
- Daily completion rate > 50%

---

## 🗓️ Week 3-4: Daily Puzzle System

### Task 1.1: Engine — Solver with Uniqueness Check
- [ ] Create `src/engine/solver.ts`
- [ ] Implement `countSolutions(puzzle, cap=2)`
- [ ] Optimize with MRV heuristic
- [ ] Unit tests: 20+ puzzle solutions verified
- [ ] Performance: < 100ms for medium, < 500ms for expert

**Acceptance:** `countSolutions(samplePuzzle) === 1` for all hand-verified puzzles

### Task 1.2: Engine — Generator with Uniqueness
- [ ] Update `src/engine/generator.ts`
- [ ] Add `removeClues` with uniqueness check
- [ ] Add `generateDailyPuzzle({ date, difficulty })`
- [ ] Performance: < 2s p95

### Task 1.3: Database — daily_puzzles table
- [ ] Create migration `00X_daily_puzzles.sql`
- [ ] RLS: public read for `date <= today`
- [ ] View: `daily_puzzles_public` (no solution)

### Task 1.4: Edge Function — generate-daily-puzzle
- [ ] Create function
- [ ] Generate 30 days ahead
- [ ] Skip existing dates
- [ ] Cron schedule: 23:00 UTC daily

### Task 1.5: Pre-populate 30 Days
- [ ] Run function manually first time
- [ ] Verify all 30 days created
- [ ] Manual check 5 random puzzles for uniqueness

### Task 1.6: UI — Daily Puzzle Card on Home
- [ ] Create `src/ui/views/home.ts`
- [ ] Daily puzzle card component
- [ ] Show date, difficulty, "Play" button
- [ ] Show "Completed" state if already played

### Task 1.7: UI — Game Screen for Daily
- [ ] Adapt existing game screen
- [ ] Track moves with timestamps
- [ ] Disable hint penalty UI (different from practice)
- [ ] Submit on win

---

## 🗓️ Week 5-6: Leaderboard + Auth

### Task 2.1: Auth — Supabase Integration
- [ ] Setup `src/lib/auth.ts`
- [ ] Anonymous sign-in on first open
- [ ] Email sign-up flow
- [ ] Google OAuth (later if time)
- [ ] Sign-in/out UI

### Task 2.2: Profile — Setup
- [ ] Profile creation trigger (DB)
- [ ] Profile screen with display name edit
- [ ] Auto-assign default avatar

### Task 2.3: Database — daily_leaderboard table
- [ ] Migration
- [ ] Indexes
- [ ] View `leaderboard_view` with joined profile

### Task 2.4: Edge Function — submit-daily-score (Anti-cheat)
- [ ] Validate payload
- [ ] Replay moves verify
- [ ] Sanity checks (time, mistakes, hints)
- [ ] Compute score server-side
- [ ] Insert into leaderboard
- [ ] Compute rank
- [ ] Return result

**Acceptance:** Cheat tests pass (see `02-technical/anti-cheat.md`)

### Task 2.5: Edge Function — get-my-rank
- [ ] Window function query
- [ ] Cache 60 sec

### Task 2.6: UI — Leaderboard Screen
- [ ] `src/ui/views/leaderboard.ts`
- [ ] Today tab with Top 100
- [ ] Yesterday tab
- [ ] My rank sticky
- [ ] Pull to refresh
- [ ] Pagination

### Task 2.7: Realtime — Live Updates
- [ ] Subscribe to `daily-leaderboard:${date}`
- [ ] Update UI on new submission
- [ ] Unsubscribe on screen leave

### Task 2.8: Win Modal — Updated for Daily
- [ ] Show rank
- [ ] Show rewards
- [ ] Share button
- [ ] Wordle-style share text

---

## 🗓️ Week 7: Quest + Streak

### Task 3.1: Database — Quest tables
- [ ] `user_daily_quests`
- [ ] `user_quest_bonus`

### Task 3.2: Quest Generator
- [ ] Define pool in code: `src/engine/quests.ts`
- [ ] `generateDailyQuests(userId, date)` — seeded, 3 tiers
- [ ] Avoid duplicate with yesterday

### Task 3.3: Edge Function — update-quest-progress
- [ ] Increment based on game events
- [ ] Mark complete when target reached

### Task 3.4: Edge Function — claim-quest-reward
- [ ] Atomic grant coins/xp
- [ ] Mark claimed

### Task 3.5: Edge Function — claim-quest-bonus
- [ ] Verify 3 claims
- [ ] Grant bonus

### Task 3.6: UI — Quest Card on Home
- [ ] Show 3 quests
- [ ] Progress bars
- [ ] Claim buttons

### Task 3.7: Coin Wallet
- [ ] `user_wallet` table + RLS
- [ ] `coin_transactions` table
- [ ] UI: coin balance in header

### Task 3.8: Streak System
- [ ] `user_progression` table
- [ ] Increment streak on daily complete
- [ ] Cron job: process streaks 00:30 UTC
- [ ] Streak freeze auto-use
- [ ] UI: streak badge on home

### Task 3.9: Streak Freeze
- [ ] Item in shop (200c)
- [ ] Consume logic in cron
- [ ] Free freeze every 30 days

---

## 🗓️ Week 8: Polish + Soft Launch

### Task 4.1: Onboarding Flow
- [ ] Welcome screen
- [ ] Tutorial puzzle (4×4)
- [ ] Daily intro
- [ ] Name + country picker

### Task 4.2: Push Notifications
- [ ] Web Push setup
- [ ] FCM token registration
- [ ] Daily reminder notification
- [ ] Streak warning notification

### Task 4.3: Settings Screen
- [ ] Migrate v1 settings
- [ ] Add notification toggles
- [ ] Account management

### Task 4.4: Profile Stats Screen
- [ ] Show progression
- [ ] Recent games list
- [ ] Streak history

### Task 4.5: Migration from v1
- [ ] Implement `migrateFromV1`
- [ ] Test with sample data
- [ ] Modal prompt for v1 users

### Task 4.6: Error Handling
- [ ] Global error boundary
- [ ] Offline indicator
- [ ] Retry UI for failed requests

### Task 4.7: Performance Audit
- [ ] Lighthouse score > 90
- [ ] Bundle size < 200KB initial
- [ ] First load < 3s on 3G

### Task 4.8: Analytics
- [ ] PostHog integration
- [ ] Track 20 core events
- [ ] Setup funnels

### Task 4.9: Error Tracking
- [ ] Sentry SDK integration
- [ ] Test error captures

### Task 4.10: PWA Setup
- [ ] Service worker
- [ ] Manifest with icons
- [ ] Install prompt

### Task 4.11: Bug Bash
- [ ] Test all user flows
- [ ] Mobile testing (iOS Safari + Android Chrome)
- [ ] Tablet testing

### Task 4.12: Launch Prep
- [ ] Landing page
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Discord/Twitter setup (optional)
- [ ] Announce in Thai Sudoku groups

### Task 4.13: Soft Launch! 🎉
- [ ] Share to personal network
- [ ] Monitor errors closely (first 48h)
- [ ] Daily user feedback collection
- [ ] Tune balance based on data

---

## 📊 Tracking Tasks

Use GitHub Issues with milestone "Phase 1 MVP":
- Tag: `phase-1`, `priority-p0/p1/p2`
- Track via Project board

---

## 🚨 Risks for Phase 1

| Risk | Mitigation |
|---|---|
| Generator too slow for expert | Have fallback puzzle list |
| Anti-cheat too strict, rejects legit | Log + manual review first week |
| Onboarding too long → drop-off | A/B test shorter version |
| Push notif permission denied | Soft prompt on day 3 |
| Migration breaks existing users | Keep v1 data 90 days backup |

---

## 🎯 Phase 1 Definition of Done

- [ ] All 4 weeks tasks complete
- [ ] No P0/P1 bugs
- [ ] Lighthouse score > 90
- [ ] Test coverage > 60% for engine
- [ ] Smoke test all flows in staging
- [ ] Beta tester feedback addressed (5+ testers)
- [ ] Privacy/Terms published
- [ ] Soft launch executed
- [ ] Day 1 stats reviewed
