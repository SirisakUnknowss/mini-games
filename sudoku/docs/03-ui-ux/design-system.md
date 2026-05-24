# 🎨 Design System

> Design tokens — single source ของ color/typography/spacing

## 🎨 Colors

### Brand
```css
--brand-primary:   #667eea;  /* main */
--brand-secondary: #764ba2;
--brand-gradient:  linear-gradient(135deg, #667eea, #764ba2);
```

### Semantic
```css
--color-success:  #43a047;  /* green */
--color-warning:  #ff9800;
--color-error:    #e53935;
--color-info:     #1976d2;
--color-gold:     #ffd700;  /* coin */
--color-xp:       #ffeb3b;
```

### Neutral (light theme)
```css
--neutral-50:  #fafafa;
--neutral-100: #f5f5f5;
--neutral-200: #eeeeee;
--neutral-300: #e0e0e0;
--neutral-400: #bdbdbd;
--neutral-500: #9e9e9e;
--neutral-600: #757575;
--neutral-700: #616161;
--neutral-800: #424242;
--neutral-900: #212121;
```

### Game Board (default theme)
```css
--cell-bg:           #ffffff;
--cell-bg-given:     #f5f5f5;
--cell-bg-selected:  #bbdefb;
--cell-bg-related:   #e3f2fd;
--cell-bg-same:      #c5cae9;
--cell-bg-conflict:  #ffebee;
--cell-text:         #1a1a2e;
--cell-text-user:    #1976d2;
--cell-text-hint:    #43a047;
--cell-text-conflict:#e53935;
--border-thick:      #1a1a2e;
--border-thin:       #dddddd;
```

ทุก theme override variable เหล่านี้ — ดู [`01-game-design/customization.md`](../01-game-design/customization.md)

---

## ✍️ Typography

### Font Family
```css
--font-base: -apple-system, BlinkMacSystemFont, "Segoe UI", "Sarabun",
             "Roboto", "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
--font-display: 'Poppins', var(--font-base);  /* Phase 2 */
```

**Note:** Sarabun สำหรับภาษาไทย (Google Fonts)

### Scale
| Token | Size | Usage |
|---|---|---|
| `--text-xs` | 11px | Footnote, badge |
| `--text-sm` | 13px | Body small |
| `--text-base` | 15px | Body default |
| `--text-md` | 17px | Body larger |
| `--text-lg` | 20px | Subheading |
| `--text-xl` | 24px | Heading |
| `--text-2xl` | 32px | Page title |
| `--text-3xl` | 40px | Hero |
| `--text-4xl` | 56px | Splash |

### Weight
- `--font-regular: 400`
- `--font-medium: 500`
- `--font-bold: 700`

### Line Height
- `--leading-tight: 1.2`
- `--leading-normal: 1.5`
- `--leading-relaxed: 1.75`

---

## 📐 Spacing

8px-based scale:
| Token | Value |
|---|---|
| `--space-0` | 0 |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

---

## 📦 Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Small inputs |
| `--radius-md` | 8px | Default |
| `--radius-lg` | 12px | Cards |
| `--radius-xl` | 16px | Big cards |
| `--radius-2xl` | 20px | Modal |
| `--radius-full` | 9999px | Pills, avatar |

---

## 🌫️ Shadow

| Token | Value |
|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` |
| `--shadow-2xl` | `0 25px 50px rgba(0,0,0,0.25)` |
| `--shadow-modal` | `0 20px 60px rgba(0,0,0,0.5)` |

---

## ⏱️ Motion

| Token | Value | Usage |
|---|---|---|
| `--duration-fast` | 100ms | Hover |
| `--duration-base` | 200ms | Transition |
| `--duration-slow` | 400ms | Modal open |
| `--duration-slower` | 800ms | Page transition |

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 📱 Breakpoints

Mobile-first:
| Token | Min width |
|---|---|
| `--bp-sm` | 640px |
| `--bp-md` | 768px |
| `--bp-lg` | 1024px |
| `--bp-xl` | 1280px |

```css
@media (min-width: 640px) { ... }
```

---

## 🎯 Z-index

| Token | Value |
|---|---|
| `--z-base` | 0 |
| `--z-dropdown` | 10 |
| `--z-sticky` | 20 |
| `--z-fixed` | 30 |
| `--z-modal-bg` | 100 |
| `--z-modal` | 110 |
| `--z-toast` | 200 |
| `--z-tooltip` | 300 |

---

## 🔘 Component Tokens

### Button
```css
.btn {
  height: 44px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  transition: all var(--duration-fast) var(--ease-default);
}

.btn--primary {
  background: var(--color-error);  /* red CTA */
  color: white;
}

.btn--secondary {
  background: rgba(255,255,255,0.2);
  color: white;
}

.btn--ghost {
  background: transparent;
  color: var(--brand-primary);
}
```

### Card
```css
.card {
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
}
```

### Input
```css
.input {
  height: 44px;
  padding: 0 var(--space-4);
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.1);
  color: white;
}
```

---

## ♿ Accessibility

### Touch Targets
- Min 44×44px (iOS HIG)
- 48×48px Android Material

### Contrast
- Body text: AAA (7:1) ใน theme default
- Large text: AA (3:1) minimum
- Test ทุก theme

### Focus
```css
:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}
```

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen reader
- All buttons have `aria-label`
- Live regions for score updates: `aria-live="polite"`
- Board cells: `aria-label="Row 3, Column 5, value 7"`

---

## 🎨 Iconography

### Style
- Emoji สำหรับ feature/category icons
- Lucide icons สำหรับ UI controls (back, settings, menu)

### Sizes
- Inline: 16px
- Button: 20px
- Section header: 24px
- Hero: 32px

---

## 📋 Implementation Files

```
src/ui/styles/
├── tokens.css         # ทั้งหมดด้านบน
├── themes/
│   ├── default.css
│   ├── dark.css
│   ├── sakura.css
│   └── ...
├── reset.css
├── components/
│   ├── button.css
│   ├── card.css
│   ├── input.css
│   └── ...
└── utilities.css
```
