# 🎨 Customization Catalog

> ทุก theme, background, avatar item ที่มีในเกม

## 📋 Categories

```
Customization
├── Theme (board + UI color scheme)
├── Background (page background)
└── Avatar
    ├── Base (skin tone, face shape)
    ├── Hat
    ├── Eyes
    ├── Body / Outfit
    ├── Pet (next to avatar)
    └── Frame (border รอบ avatar)
```

---

## 🎨 Theme Catalog

Theme กำหนด **ทั้งกระดาน + UI color** ผ่าน CSS variables

### Free Themes (3)
| ID | Name | Primary | Accent | Cell BG | Locked |
|---|---|---|---|---|---|
| `theme_classic` | Classic | #667eea | #764ba2 | #ffffff | unlock |
| `theme_paper` | Paper | #8b7355 | #d4a574 | #faf0e6 | unlock |
| `theme_dark` | Dark Mode | #1a1a2e | #16213e | #0f3460 | level 3 |

### Paid Themes (เหรียญในเกม)
| ID | Name | Description | Price |
|---|---|---|---|
| `theme_pastel` | Pastel Dream | สีหวานๆ pink/blue/yellow | 200c |
| `theme_ocean` | Ocean | โทนน้ำเงิน-เขียวใส | 300c |
| `theme_forest` | Forest | โทนเขียวธรรมชาติ | 300c |
| `theme_sunset` | Sunset | โทนส้ม-ม่วง | 400c |
| `theme_neon` | Neon Night | สีนีออนเข้มมืด | 500c |
| `theme_sakura` | Sakura | สีชมพูซากุระ | 600c |
| `theme_thai` | Thai Heritage | ลายไทย ทอง-แดง | 800c |
| `theme_mono` | Mono Pro | ขาวดำพรีเมียม | 1000c |

### Exclusive (achievement reward)
| ID | Unlock condition |
|---|---|
| `theme_champion` | Top #1 daily ครั้งแรก |
| `theme_streak_master` | Streak 100 |
| `theme_grandmaster` | ผ่านทุก level 100% |
| `theme_legendary` | Level 100 |

### Implementation

```css
/* themes/classic.css */
:root[data-theme="classic"] {
  --color-primary: #667eea;
  --color-accent: #764ba2;
  --color-bg-gradient: linear-gradient(135deg, #667eea, #764ba2);
  --color-cell-bg: #ffffff;
  --color-cell-given: #f5f5f5;
  --color-cell-text: #1a1a2e;
  --color-cell-user: #1976d2;
  --color-cell-hint: #43a047;
  --color-cell-selected: #bbdefb;
  --color-cell-related: #e3f2fd;
  --color-cell-conflict: #ffebee;
  --color-cell-conflict-text: #e53935;
  --color-border-thick: #1a1a2e;
  --color-border-thin: #ddd;
}
```

Swap theme = `document.documentElement.dataset.theme = 'sakura'`

---

## 🖼️ Background Catalog

Background ต่างจาก theme — ใช้ทั้งหน้า, ไม่กระทบสีกระดาน

### Free (2)
| ID | Type | Description |
|---|---|---|
| `bg_default` | gradient | Default theme gradient |
| `bg_blank_white` | solid | ขาวล้วน |

### Solid Colors (5) — 100c
| ID | Color |
|---|---|
| `bg_solid_navy` | #1e3a8a |
| `bg_solid_forest` | #064e3b |
| `bg_solid_burgundy` | #7f1d1d |
| `bg_solid_charcoal` | #1f2937 |
| `bg_solid_lavender` | #5b21b6 |

### Patterns (5) — 200c
| ID | Pattern |
|---|---|
| `bg_pattern_dots` | Dot grid |
| `bg_pattern_grid` | Square grid |
| `bg_pattern_diagonal` | Diagonal stripes |
| `bg_pattern_waves` | Wavy lines |
| `bg_pattern_geometric` | Geometric shapes |

### Photo Backgrounds (5) — 400c
| ID | Description |
|---|---|
| `bg_photo_mountain` | ภูเขาหิมะ |
| `bg_photo_beach` | ชายหาด |
| `bg_photo_forest` | ป่า |
| `bg_photo_city_night` | เมืองกลางคืน |
| `bg_photo_space` | อวกาศ + ดาว |

### Animated (3) — 1000c
| ID | Description |
|---|---|
| `bg_anim_rain` | ฝนตก (CSS animation) |
| `bg_anim_stars` | ดาวกระพริบ |
| `bg_anim_aurora` | แสงเหนือ |

**Storage:** เป็น CSS class ใน `backgrounds.css` หรือ image file ใน `/public/bg/`

---

## 👤 Avatar System

### Base Avatar
- **Shape:** วงกลม 80×80px ใน profile, 32×32px ใน leaderboard
- **Composition:** ซ้อน layer ตามลำดับ (Z-index): Frame > Pet > Hat > Eyes > Body > Face > Skin

### Slots & Item Counts (MVP)

| Slot | Common (50c) | Rare (200c) | Epic (500-1000c) | Total |
|---|---|---|---|---|
| Face (expression) | 5 | 3 | 2 | 10 |
| Hat | 8 | 4 | 3 | 15 |
| Eyes | 5 | 3 | 2 | 10 |
| Body/Outfit | 6 | 4 | 3 | 13 |
| Pet | 3 | 3 | 2 | 8 |
| Frame | 4 | 3 | 2 | 9 |
| **Total** | **31** | **20** | **14** | **65** items |

### Sample Items

#### Face
- 😊 Happy (default, free)
- 😎 Cool
- 🥱 Sleepy
- 🤔 Thinking
- 😇 Angel
- 🤓 Nerd (rare)
- 🦁 Lion face (epic)
- 🐱 Cat face (epic)

#### Hat
- None (default)
- 🎩 Top hat
- 🧢 Cap
- 👑 Crown (epic)
- 🎓 Graduation
- 🪖 Helmet
- 🎅 Santa (seasonal)

#### Pet
- None (default)
- 🐶 Dog
- 🐱 Cat
- 🐰 Bunny
- 🐲 Dragon (epic)
- 🦊 Fox

#### Frame
- None (default)
- Bronze ring
- Silver ring
- Gold ring (rare)
- Animated rainbow (epic)
- Diamond (exclusive)

### Implementation

```ts
type Avatar = {
  baseColor: string;       // hex skin color
  face: string;            // item ID
  hat: string | null;
  eyes: string | null;
  body: string;
  pet: string | null;
  frame: string | null;
};

// Render
function renderAvatar(avatar: Avatar): HTMLElement {
  return composeLayers([
    avatar.frame && getItem(avatar.frame),
    getItem(avatar.body),
    getItem(avatar.face),
    avatar.eyes && getItem(avatar.eyes),
    avatar.hat && getItem(avatar.hat),
    avatar.pet && getItem(avatar.pet),
  ]);
}
```

**Storage:** SVG sprites (preferred) หรือ PNG ใน `/public/avatar/`

---

## 🗄️ Storage

```sql
-- catalog (seeded data, read-only for users)
CREATE TABLE shop_items (
  id TEXT PRIMARY KEY,             -- 'theme_sakura', 'avatar_hat_crown'
  category TEXT NOT NULL,           -- 'theme', 'background', 'avatar'
  subcategory TEXT,                 -- 'face', 'hat', 'eyes' for avatar
  name TEXT NOT NULL,
  description TEXT,
  price_coin INTEGER NOT NULL,
  rarity TEXT,                      -- 'common', 'rare', 'epic'
  unlock_type TEXT NOT NULL,        -- 'free', 'shop', 'level', 'achievement'
  unlock_value TEXT,                -- level number or achievement ID
  asset_url TEXT,                   -- SVG/CSS reference
  preview_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- user inventory (what user owns)
CREATE TABLE user_inventory (
  user_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acquired_from TEXT,               -- 'shop', 'reward', 'achievement'
  PRIMARY KEY (user_id, item_id)
);

-- equipped (what user is using now)
CREATE TABLE user_equipped (
  user_id UUID PRIMARY KEY,
  theme_id TEXT,
  background_id TEXT,
  avatar JSONB,  -- { face, hat, eyes, body, pet, frame, baseColor }
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 🎨 Asset Pipeline

### Themes
- CSS variable swap → instant
- Bundled in JS as object
- ~1KB per theme

### Backgrounds
- Solid/Pattern: CSS only
- Photo: WebP, 1920×1080, < 200KB
- Animated: CSS animation (preferred) หรือ Lottie

### Avatar Items
- **Format:** SVG (vector — scalable)
- **Size:** 64×64 viewBox
- **Naming:** `avatar/hat/crown.svg`
- **Lazy load** — load เฉพาะที่ user เห็น

---

## 🔍 Acceptance Criteria

- [ ] 10+ themes ทำงาน
- [ ] 20+ backgrounds
- [ ] 65+ avatar items
- [ ] Preview before buy
- [ ] Equip/unequip ทันที
- [ ] Avatar render ใน leaderboard correct
- [ ] Asset lazy load
