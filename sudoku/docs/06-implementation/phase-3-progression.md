# 📦 Phase 3: Progression (Week 13-15)

> XP + Level + Achievements

## 🗓️ Week 13: XP & Level

### Task P.1: XP system
- [ ] Add XP to all reward events (server-side)
- [ ] Update `user_progression.xp` atomic
- [ ] XP curve `floor(100 * N^1.6)`

### Task P.2: Level up logic
- [ ] Detect level up in Edge Function
- [ ] Grant level rewards (coins + items)
- [ ] Animation in UI

### Task P.3: XP bar UI
- [ ] In header
- [ ] In profile
- [ ] Fill animation

### Task P.4: Level-gated unlocks
- [ ] Shop items show locked + condition
- [ ] Unlock animation when reaching level

---

## 🗓️ Week 14: Achievements

### Task AC.1: Achievement defs (seed)
- [ ] All 50+ achievements in DB
- [ ] Categorized

### Task AC.2: Achievement checker
- [ ] Run after each game/event
- [ ] Server-side (Edge Function)
- [ ] Grant rewards

### Task AC.3: Achievement screen
- [ ] List by category
- [ ] Progress bars
- [ ] Locked vs unlocked
- [ ] Hidden achievements

### Task AC.4: Notification on unlock
- [ ] Toast in UI
- [ ] Push notif (optional setting)
- [ ] Sound + animation

### Task AC.5: Achievement in profile
- [ ] Recent 12 grid
- [ ] Total count
- [ ] Link to full list

---

## 🗓️ Week 15: Stats & Polish

### Task St.1: Stats dashboard
- [ ] Total games, win rate, avg time per difficulty
- [ ] Streak history calendar
- [ ] Best score per category

### Task St.2: Compare to global
- [ ] "Your time vs avg" per difficulty
- [ ] Percentile in achievements
- [ ] Privacy: opt-out

### Task St.3: Weekly recap
- [ ] Email/push: "Your week in Sudoku"
- [ ] Stats summary
- [ ] Top moments

### Task St.4: Onboarding refinement
- [ ] Day 1-7 sequence (push + in-app)
- [ ] First-time achievements highlighted
- [ ] First shop visit prompt

---

## 📊 Acceptance Criteria

- [ ] All 50 achievements unlockable
- [ ] Level up triggers reward
- [ ] XP gained tracked correctly
- [ ] Stats dashboard accurate
- [ ] Weekly recap sent (opt-in)
- [ ] D30 retention > 8%
