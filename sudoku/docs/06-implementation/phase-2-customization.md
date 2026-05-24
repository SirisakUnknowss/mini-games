# 📦 Phase 2: Customization (Week 9-12)

> Themes + Avatar + Shop

## 🎯 Goal

> 60% ของ user ที่เล่นเกินวันที่ 3 ซื้อของอย่างน้อย 1 ชิ้น

---

## 🗓️ Week 9-10: Shop Foundation

### Task S.1: Shop tables + seed
- [ ] `shop_items`, `user_inventory`, `user_equipped`
- [ ] Seed 50+ items via `seed.sql`

### Task S.2: Shop API
- [ ] `GET /shop_items`
- [ ] Edge Fn `purchase-item`
- [ ] Edge Fn `equip-item`
- [ ] Transaction safety

### Task S.3: Shop UI
- [ ] Shop screen with tabs
- [ ] Item card states (avail/locked/owned/equipped)
- [ ] Item detail modal
- [ ] Purchase confirmation
- [ ] Insufficient funds UI

### Task S.4: Featured Section
- [ ] Daily deal logic
- [ ] New arrivals banner
- [ ] Bundle of the week

---

## 🗓️ Week 11: Themes + Backgrounds

### Task T.1: Theme engine
- [ ] CSS variable system
- [ ] `applyTheme(themeId)` function
- [ ] Persist + load on app start

### Task T.2: 10 Theme designs
- [ ] Classic, Paper, Dark (free)
- [ ] Pastel, Ocean, Forest (paid)
- [ ] Sunset, Neon, Sakura
- [ ] Thai Heritage, Mono Pro

### Task T.3: Background system
- [ ] Solid colors (5)
- [ ] Patterns (5 SVG)
- [ ] Photos (5 WebP, optimized)
- [ ] Animated (3 CSS)

### Task T.4: Preview mode
- [ ] Apply temporarily without purchase
- [ ] Revert button
- [ ] Persist preview across screens (until exit shop)

---

## 🗓️ Week 12: Avatar System

### Task A.1: Avatar render engine
- [ ] SVG composition
- [ ] Layer order (frame → pet → hat → eyes → body → face)
- [ ] Sizes: 32px, 64px, 128px

### Task A.2: Avatar asset library
- [ ] 65+ SVG items
- [ ] Lazy-load atlas
- [ ] Optimize file size

### Task A.3: Avatar editor screen
- [ ] Live preview
- [ ] Slot tabs
- [ ] Tap to equip
- [ ] "Owned only" filter

### Task A.4: Avatar in leaderboard
- [ ] Show avatar next to name
- [ ] 32px size
- [ ] Cache rendered avatars

### Task A.5: Avatar in profile
- [ ] Big avatar in profile screen
- [ ] Edit button

---

## ⚙️ Consumables

### Task C.1: Streak Freeze
- [ ] Buy in shop (200c)
- [ ] Show count in profile
- [ ] Auto-use in cron

### Task C.2: Hint Pack
- [ ] Buy +3 hints for next game (100c)
- [ ] Apply at game start
- [ ] One-time use

### Task C.3: Coin Boost 2×
- [ ] Buy 24h boost (500c)
- [ ] Apply to all coin gains
- [ ] Timer in header

---

## 🎁 Loot Box

### Task L.1: Mystery Box (300c)
- [ ] Buy in shop
- [ ] Open animation
- [ ] Random item from pool
- [ ] Pity system (rare guaranteed every 10 boxes)

---

## 📊 Acceptance Criteria

- [ ] 60+ items in shop
- [ ] All 10 themes work
- [ ] Avatar composes correctly
- [ ] Preview before buy
- [ ] Purchase atomic + safe
- [ ] Leaderboard shows avatars
- [ ] No coin economy bugs (audit trail clean)
- [ ] 60%+ of d3+ users own at least 1 item
