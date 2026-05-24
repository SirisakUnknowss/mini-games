# 🛤️ Key User Flows

> Step-by-step ของ flow สำคัญ

## 🌟 Flow 1: First-time Open → First Win

```
Open app
  ↓
[Anonymous sign-in auto]
  ↓
Onboarding Step 1: Welcome → "Get Started"
  ↓
Step 2: Mini tutorial (4×4 puzzle)
  ↓
Step 3: "Build streak — play daily" intro
  ↓
Step 4: Choose name + country
  ↓
[Home screen]
  ↓
Click "Play Daily Puzzle"
  ↓
[Game screen]
  ↓
Play to completion
  ↓
[Win Modal]
  - Score
  - Rank
  - Reward animation
  - "Share" + "Continue"
  ↓
Continue → Home (now shows daily ✓)
  ↓
Toast: "Achievement unlocked: First Win"
  ↓
Push permission prompt
  ↓
End of session
```

**Success metrics:**
- Time from open to first win: < 10 min
- D1 retention: > 35%

---

## 📅 Flow 2: Returning User (Daily Routine)

```
Push notif: "Daily puzzle ready!"
  ↓
Open app
  ↓
[Home screen]
  - Streak: 🔥 7 days
  - Daily puzzle: Not yet
  - Daily quests: 0/3
  ↓
Click "Play Daily"
  ↓
[Game]
  ↓
Win → [Win Modal]
  - "+150 coins, +200 XP"
  - "Quest progress: 1/3"
  - "Share rank #142"
  ↓
[Share dialog]
  ↓
Back to Home
  ↓
"Daily Quest 2/3 — Play 3 games"
  ↓
Click practice → finish 2 more games
  ↓
Quest complete → "+150 coins"
  ↓
"All 3 quests done! +100 bonus + loot"
  ↓
End session
```

---

## 🛒 Flow 3: First Purchase

```
[Home] → Tap "Shop" in nav
  ↓
[Shop home]
  - Featured: "Sakura theme — NEW"
  - 540 coins
  ↓
Tap Sakura
  ↓
[Item Detail Modal]
  ↓
Tap "Try Preview"
  ↓
Theme applied, "Preview mode" banner
  ↓
User likes → tap "Buy Now"
  ↓
[Confirmation Modal]
  - "Buy Sakura for 600?"
  - "Insufficient (need 60 more)"
  ↓
User dismisses
  ↓
"How to earn more" hint shown
  ↓
Goes back to home, plays daily
  ↓
+150 coins → balance 690
  ↓
Returns to shop
  ↓
Buy → confirm → success
  ↓
"Equip now?" → Yes
  ↓
Theme applied permanently
```

---

## 🔥 Flow 4: Streak Recovery

```
User's streak: 7 days
  ↓
Misses day 8 (didn't play)
  ↓
Day 9 morning — opens app
  ↓
[Notification arrived 6:00 AM]
  "🛡️ Streak Freeze used — your streak is safe!"
  ↓
Home shows streak: 🔥 7 days (kept)
  - Streak freezes: 0 remaining
  ↓
"Next free freeze in 22 days"
  - Or "Buy more in shop"
  ↓
User plays day 9 normally → streak 8
```

**If no freeze available:**
```
Day 9 morning open
  ↓
Modal: "Your streak ended at 7 days"
  ↓
"Start a new streak — play today!"
  ↓
User plays → streak 1
```

---

## 🏆 Flow 5: Leaderboard Engagement

```
[Home] → "Leaderboard" nav
  ↓
[Leaderboard — Today]
  - Top 10 visible
  - "You: #142"
  ↓
Pull to refresh → see live updates
  ↓
Tap "Jump to my rank" → scroll to position
  ↓
Tap user above → mini profile modal
  ↓
"Yesterday" tab → see history
  ↓
Back to today → play again → improve rank
  ↓
Realtime update: "You moved up to #98!"
```

---

## 🎯 Flow 6: Achievement Discovery

```
Plays games normally
  ↓
Background: achievement checker running
  ↓
Trigger: 10 wins → ACH_PLAY_10 unlocked
  ↓
Toast appears: "🏆 Achievement: Beginner +100 coins"
  ↓
Tap toast → Achievement screen
  ↓
See list, see locked ones
  ↓
"In progress: 47/100 games — keep going!"
  ↓
Closes, plays more to chase milestone
```

---

## 👤 Flow 7: Anonymous → Sign Up

```
Anonymous user, 14-day streak, 3000 coins
  ↓
Opens Settings → "Save my progress"
  ↓
[Sign up screen]
  - Email + password
  - Or Google / Apple
  ↓
Submit → email verification
  ↓
Click link → verified
  ↓
Profile.is_anonymous → false
  ↓
Toast: "Your progress is saved! Use any device to play."
  ↓
Streak/coin/items intact
  ↓
Can install on phone + use same login
```

---

## 🎮 Flow 8: Game Resume

```
User mid-game → app crashes / closes
  ↓
[Auto-save every 10s]
  ↓
User opens app later
  ↓
[Home]
  ↓
Resume prompt modal:
  "Continue your game?
   Medium · 4:23 elapsed"
  [ Continue ] [ New Game ]
  ↓
Tap Continue
  ↓
[Game screen] state restored
  - Timer resumes
  - Board state intact
  ↓
Finish → submit (with original started_at)
```

---

## 📤 Flow 9: Share Daily Result

```
[Win Modal] → tap Share
  ↓
[Share Sheet] (native)
  - Pre-formatted text:
    "🧩 Sudoku Daily #2026-05-23
     ⏱ 7:42 · ❌ 0 · 💡 0
     🏆 Rank #142 / 8,432
     sudokudaily.app"
  ↓
User picks Instagram Story / Twitter / Line
  ↓
[App-specific share UI]
  ↓
Posts
  ↓
Friend taps link → installs → first-time flow
```

---

## ⚙️ Flow 10: Settings Change

```
[Profile/Settings nav]
  ↓
[Settings screen]
  ↓
Toggle "Highlight same number" off
  ↓
[Auto-save to server]
  ↓
Back to game → settings applied immediately
```

---

## 🚫 Edge Flows

### Offline mid-game
```
Playing → wifi drops
  ↓
[Network indicator: offline]
  ↓
Continue playing normally
  ↓
Finish → action queued
  ↓
"Score will sync when online"
  ↓
Network back → auto-sync
  ↓
Toast: "Score submitted: rank #142"
```

### Daily reset while playing
```
Started daily at 23:55 UTC
  ↓
Plays past midnight UTC
  ↓
Finishes 00:08 UTC
  ↓
Submitted with original date (yesterday's)
  ↓
"Today's daily is now available"
  ↓
User can play new daily
```

### Insufficient permissions
```
First push notif prompt → user denies
  ↓
App works fine
  ↓
After 3 days → soft prompt: "Enable notif for streak warning?"
  ↓
If still no → silent, no nag
```
