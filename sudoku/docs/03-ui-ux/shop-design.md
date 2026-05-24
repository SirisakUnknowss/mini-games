# 🛍️ Shop UX

> Detailed UX สำหรับ shop screen

## 🎯 Goals

1. ค้นของง่าย — กรองตาม category + rarity
2. Preview before buy — ใส่ดูก่อนซื้อ
3. Smooth purchase — 2 tap from browse to own
4. Showcase new items — drive impulse buy

---

## 🗺️ Information Architecture

```
Shop
├── Featured (top, rotating)
│   ├── Today's deal
│   ├── New arrival
│   └── Bundle of the week
├── Categories
│   ├── Themes (10+ items)
│   ├── Backgrounds (20+ items)
│   ├── Avatar
│   │   ├── Face
│   │   ├── Hat
│   │   ├── Eyes
│   │   ├── Body
│   │   ├── Pet
│   │   └── Frame
│   ├── Consumables
│   │   ├── Streak Freeze
│   │   ├── Hint Pack
│   │   └── Coin Boost
│   └── Bundles
└── Search / Filter
```

---

## 📱 Screen Layout

### Main Shop View

```
┌──────────────────────────────────────┐
│ 🛍️ Shop                    💰 540    │
├──────────────────────────────────────┤
│ ┌──────────────────────────────┐    │
│ │ ⭐ FEATURED                   │    │
│ │  ┌──────────┬──────────┐     │    │
│ │  │ Bundle   │ New theme│     │    │
│ │  │ 50% off  │ "Sakura" │     │    │
│ │  └──────────┴──────────┘     │    │
│ └──────────────────────────────┘    │
│                                      │
│ [Themes][BG][Avatar][Bundle][Other] │
├──────────────────────────────────────┤
│ All Themes  · Sort: Newest ▾        │
│                                      │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │      │ │      │ │      │         │
│ │      │ │      │ │      │         │
│ │Sakura│ │Dark  │ │Neon  │         │
│ │600💰 │ │OWNED│ │500💰│          │
│ └──────┘ └──────┘ └──────┘         │
│                                      │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │  🔒   │ │      │ │      │         │
│ │ Lv 20 │ │Ocean │ │Forest│         │
│ │      │ │300💰 │ │300💰 │         │
│ └──────┘ └──────┘ └──────┘         │
└──────────────────────────────────────┘
```

---

## 🃏 Item Card States

### 1. Available
```
┌──────────┐
│ [Preview]│
│          │
│ Sakura   │
│ 600 💰   │
└──────────┘
```
Tap → Detail modal

### 2. Owned (not equipped)
```
┌──────────┐
│ [Preview]│
│  ✓ OWNED │
│ Sakura   │
│ [Equip]  │
└──────────┘
```

### 3. Equipped
```
┌▣▣▣▣▣▣▣▣▣▣┐ (border highlight)
│ [Preview]│
│ EQUIPPED │
│ Sakura   │
│[Unequip] │
└▣▣▣▣▣▣▣▣▣▣┘
```

### 4. Insufficient Coins
```
┌──────────┐
│ [Preview]│
│ (grayed) │
│ Sakura   │
│ 600 💰⚠️ │
└──────────┘
```

### 5. Locked (level/achievement gated)
```
┌──────────┐
│   🔒      │
│Unlock    │
│at Lvl 20 │
│Sakura    │
└──────────┘
```

### 6. New badge
```
┌────🆕────┐
│ [Preview]│
│ Sakura   │
│ 600 💰   │
└──────────┘
```

---

## 🔍 Item Detail Modal

```
┌──────────────────────────────────┐
│ × Close                          │
├──────────────────────────────────┤
│                                  │
│      [ Large preview ]           │
│                                  │
├──────────────────────────────────┤
│ Sakura Theme               EPIC   │
│ A serene pink theme inspired by  │
│ cherry blossoms.                 │
│                                  │
│ 💰 600 coins                     │
│                                  │
│ ┌─────────────┬───────────────┐ │
│ │ Try Preview │  Buy Now      │ │
│ └─────────────┴───────────────┘ │
└──────────────────────────────────┘
```

### Preview Mode
- Apply theme/avatar item temporarily
- Show "Preview mode — Buy to keep" banner
- "Revert" button
- Buy button still works

### Buy Flow
1. Tap Buy
2. Confirmation modal: "Buy Sakura Theme for 600 💰?"
3. Tap Confirm
4. Loading spinner
5. Success animation + new balance
6. "Equip now?" prompt → equip + close

---

## 💳 Purchase Confirmation

```
┌─────────────────────────────┐
│  Confirm Purchase            │
│                              │
│  [Item preview thumbnail]    │
│                              │
│  Sakura Theme                │
│  Price:    600 💰            │
│                              │
│  Your balance:               │
│  540 💰  →  340 💰  (after) │
│  ⚠️ Insufficient!            │
│                              │
│ [ Cancel ] [ Buy 600 💰 ]    │
└─────────────────────────────┘
```

---

## ⚠️ Insufficient Funds

ถ้าคลิก buy แล้วเงินไม่พอ:

```
┌─────────────────────────────┐
│  Not enough coins             │
│                              │
│  Need 60 more 💰             │
│                              │
│  Ways to earn:               │
│  • Play daily puzzle (+50)   │
│  • Complete quests (+80)     │
│  • Watch ad (+20) [Future]   │
│                              │
│  [ Close ]                   │
└─────────────────────────────┘
```

---

## 🎯 Filtering & Sorting

### Filter chips
- All / Owned / Available / Locked
- Rarity: Common / Rare / Epic
- Price range

### Sort
- Newest first
- Price: low → high
- Price: high → low
- Rarity: epic → common

---

## 🌟 Featured Section

### Today's Deal
- 1 item daily 25-50% off
- Countdown timer
- Limit 1 purchase/day

### New Arrivals
- Items added in last 7 days
- "NEW" badge

### Bundles
- Curated combos
- "Save X%" indicator

### Loot Box (Mystery)
- 300c per box
- Random item
- Higher chance for rare if hasn't gotten one in 10 boxes (pity system)

---

## 🎨 Visual Treatments by Rarity

```css
.item-common {
  border: 1px solid var(--neutral-300);
}
.item-rare {
  border: 2px solid #2196f3;
  background: linear-gradient(135deg, rgba(33,150,243,0.1), transparent);
}
.item-epic {
  border: 2px solid #9c27b0;
  background: linear-gradient(135deg, rgba(156,39,176,0.15), transparent);
  box-shadow: 0 0 12px rgba(156,39,176,0.3);
}
.item-legendary {
  border: 2px solid var(--color-gold);
  animation: legendary-glow 3s ease-in-out infinite;
}

@keyframes legendary-glow {
  0%, 100% { box-shadow: 0 0 12px rgba(255,215,0,0.3); }
  50% { box-shadow: 0 0 24px rgba(255,215,0,0.8); }
}
```

---

## 🎁 Onboarding Hooks

- ผู้เล่นใหม่ → ปลดล็อก theme "Dark" ที่ level 3 → push notif "ไปเอา theme ใหม่ได้แล้ว!"
- หลังจบ daily ครั้งแรก → toast "ดูร้านสิ! มีของให้แต่ง"
- เก็บเงินถึง 200c ครั้งแรก → push "พอซื้อ theme ใหม่ได้แล้ว!"

---

## 🔍 Acceptance Criteria

- [ ] Browse + filter + sort works
- [ ] Preview mode applies temporarily
- [ ] Purchase flow with confirmation
- [ ] Insufficient funds UI
- [ ] Owned/equipped states clear
- [ ] Locked items show condition
- [ ] Featured section rotates daily
- [ ] Rarity visual treatment
