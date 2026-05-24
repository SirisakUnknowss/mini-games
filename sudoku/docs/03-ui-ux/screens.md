# 📱 Screens / Views

> List ทุก screen ในแอป + state ของแต่ละ screen

## 🗺️ Screen Map

```
┌────────────────────────────────────────────┐
│             [Anonymous user]               │
│                  ↓                          │
│              Home Screen                    │
│  ├── Daily Puzzle Card                     │
│  ├── Daily Quest Card                      │
│  ├── Practice Mode Card                    │
│  └── Streak Indicator                      │
│                  ↓                          │
│         ┌────────┴────────────┐            │
│         ↓                      ↓            │
│   Game Screen           Leaderboard         │
│         ↓                                   │
│   Win Modal                                 │
│   ├── Share                                 │
│   └── Continue → Home                       │
│                                             │
│  Bottom nav:                               │
│  Home · Leaderboard · Shop · Profile       │
└────────────────────────────────────────────┘
```

---

## 🏠 1. Home Screen

**Route:** `/` (default)

**Purpose:** Hub ให้ user เห็นว่าวันนี้มีอะไรให้ทำ

**Components:**
- Header: avatar + streak + coin balance + level
- **Daily Puzzle Card** (เด่นสุด)
  - Date + difficulty badge
  - "Play" button
  - "Completed today ✓" state
  - Time + rank ถ้าจบแล้ว
- **Daily Quests** (3 quest cards)
- **Practice Mode** (เข้า view-stages เลือก difficulty)
- **What's new** banner (event/announcement)

**States:**
- Loading
- Loaded
- Daily already done
- Offline (cached UI + indicator)

---

## 🎮 2. Game Screen

**Route:** `/play?mode=daily|practice&level=&stage=`

**Purpose:** Main gameplay

**Layout:**
```
┌─────────────────────────────────┐
│ ← Mode · Difficulty       💡 3   │
├─────────────────────────────────┤
│  ⏱ 04:23   ❌ 0   💎 +50         │
├─────────────────────────────────┤
│                                 │
│         9×9 Board                │
│                                 │
├─────────────────────────────────┤
│  Note button  Erase  Undo       │
│  [ 1 2 3 4 5 6 7 8 9 ]          │
└─────────────────────────────────┘
```

**Features:**
- Tap cell → highlight
- Numpad → place number
- Pencil mark mode (Phase 2)
- Undo/Redo (Phase 2)
- Hint button (3 charges)
- Pause button → settings/exit
- Auto-save every 10 sec

**States:**
- Loading puzzle
- Playing
- Paused
- Win → Win Modal
- Resumed game

---

## 🏆 3. Leaderboard Screen

**Route:** `/leaderboard`

**Tabs:**
- Today
- Yesterday
- This week
- Friends (Phase 2)

**Layout:**
```
┌─────────────────────────────────┐
│ Leaderboard · Today (Hard)       │
│ ⏱ Resets in 14h 32m              │
├─────────────────────────────────┤
│ 🥇 SudokuMaster   4,820  5:42   │
│ 🥈 user_jp_42     4,780  5:51   │
│ ...                              │
│ ─────── You #142 ───────────    │
│ 142. YOU         3,400  9:18    │
└─────────────────────────────────┘
```

**Features:**
- Infinite scroll
- Pull to refresh
- "Jump to my rank" button (sticky)
- Tap user → mini-profile modal
- Avatar + country flag visible

---

## 🛍️ 4. Shop Screen

**Route:** `/shop`

**Tabs:**
- Themes
- Backgrounds
- Avatar
- Bundles
- Consumables

**Layout:**
```
┌─────────────────────────────────┐
│ Shop                     💰 540  │
├─────────────────────────────────┤
│ [Themes][BG][Avatar][Bundle]    │
├─────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │ 🌸    │  │ 🌃    │  │ ⚡    │  │
│  │Sakura │  │Neon   │  │Light  │  │
│  │ 600 💰 │  │500 💰 │  │FREE   │  │
│  │OWNED  │  │ BUY   │  │EQUIP  │  │
│  └──────┘  └──────┘  └──────┘  │
└─────────────────────────────────┘
```

**Item States:**
- `LOCKED` (need level/achievement) — grayed + condition
- `BUY` — has price
- `INSUFFICIENT_FUNDS` — grayed price
- `OWNED` — checkmark
- `EQUIPPED` — highlighted border

**Modal: Item Detail**
- Larger preview
- Description
- "Try preview" → apply temporarily
- Buy button

---

## 👤 5. Profile Screen

**Route:** `/profile`

**Sections:**
- Avatar (large)
- Display name + edit
- Level + XP bar
- Stats grid (totals)
- Achievements grid (recent 12, link to all)
- Recent games (last 10)
- Streak history (calendar view)
- Edit avatar button → Avatar Editor

**States:**
- Own profile (editable)
- Other user profile (Phase 2)

---

## 🎨 6. Avatar Editor

**Route:** `/profile/avatar`

**Layout:**
```
┌─────────────────────────────────┐
│ ← Edit Avatar          [ Save ] │
├─────────────────────────────────┤
│                                 │
│          [ Big avatar ]          │
│                                 │
├─────────────────────────────────┤
│ Tabs: Face Hat Eyes Body Pet    │
├─────────────────────────────────┤
│  Grid of owned items             │
│  (locked items grayed)           │
│                                 │
│  Tap item → preview              │
└─────────────────────────────────┘
```

**Features:**
- Live preview
- Tap → equip immediately
- "Remove" option (no item in slot)
- Pull from shop if locked

---

## 🏅 7. Achievements Screen

**Route:** `/achievements`

**Layout:**
- Filter by category
- Progress bar overall (X/50)
- Card per achievement
  - Icon + name + description
  - Tier color
  - Status: Locked / Unlocked + date
  - Reward preview

**Sections:**
- Recently unlocked (top)
- In progress (with progress bar e.g., "47/100 games")
- Locked
- Hidden (only show after unlock)

---

## ⚙️ 8. Settings Screen

**Route:** `/settings`

**Sections:**
- **Gameplay**
  - Highlight same number
  - Show conflicts
  - Hide done numbers
  - Highlight row/col/box
  - Pencil marks (Phase 2)
- **Notifications**
  - Daily reminder
  - Streak warning
  - Achievement unlock
  - Time of daily reminder
- **Audio**
  - Sound effects
  - Haptic (mobile)
- **Account**
  - Display name
  - Change password
  - Linked accounts
  - Sign out
  - Delete account
- **About**
  - Version
  - Privacy policy
  - Terms
  - Credits

---

## 🪙 9. Win Modal

**Purpose:** Celebrate + show results + drive action

**Content:**
```
┌─────────────────────────────────┐
│       🎉 You won!                │
│                                 │
│         3,400 points             │
│       ⏱ 9:18   ❌ 0   💡 0       │
│                                 │
│  🏆 Daily Rank #142 / 8,432     │
│                                 │
│  Rewards:                       │
│  💎 +150 coins                  │
│  ⭐ +200 XP                      │
│  🏅 Achievement: Pure Skill      │
│                                 │
│ [ Share ] [ Leaderboard ]       │
│ [ Continue ]                    │
└─────────────────────────────────┘
```

**Features:**
- Animated counter for score
- Confetti for new best
- Share button (Wordle-style)
- Next quest progress preview

---

## 🚀 10. Onboarding

**Multi-step (4 screens):**

### Step 1: Welcome
- Logo + tagline
- "Get started"

### Step 2: Tutorial Game
- Mini puzzle (4×4)
- Guide tap → numpad → win
- Skip option

### Step 3: Daily Puzzle Intro
- "Play 1 puzzle / day to build streak"
- Show streak indicator

### Step 4: Profile Setup
- Choose display name
- Choose country (optional)
- "Start playing"

---

## 📱 11. Bottom Navigation

Persistent on Home / Leaderboard / Shop / Profile

```
┌─────────────────────────────────┐
│  🏠       🏆       🛍️      👤    │
│ Home  Leaderboard Shop Profile  │
└─────────────────────────────────┘
```

Hidden during: game screen, modals, onboarding

---

## 🎭 12. Modals & Overlays

| Modal | Trigger |
|---|---|
| Win Modal | Game complete |
| Pause Modal | Pause button |
| Confirmation | Destructive actions |
| Achievement toast | Unlock |
| Network indicator | Offline |
| Daily reset notice | Midnight UTC visit |
| Streak warning | Few hours before reset |
| Resume game | App open with saved game |

---

## 🔧 Component Library Needed

- `<Card>` — generic container
- `<Button variant="primary|secondary|ghost|danger">` 
- `<Modal>`
- `<Avatar size="sm|md|lg" />`
- `<CoinBadge amount />`
- `<XPBar current max />`
- `<StreakBadge days />`
- `<ItemCard item state />`
- `<LeaderboardRow user score time rank />`
- `<TabBar>`
- `<Toast>`
