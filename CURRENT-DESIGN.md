# CURRENT-DESIGN.md

Design system audit for Hrein Gæði — documents what actually exists across all 9 HTML files. No changes recommended here; this is a reference for what's in the code.

---

## Colour Palette

### Core tokens (defined in every file)

| Token | Hex | Usage |
|-------|-----|-------|
| `--white` | `#ffffff` | Card/modal backgrounds |
| `--off` / `--off-white` | `#f7f8fa` | Page background, subtle fills |
| `--light` | `#eef0f5` | Dividers, tab backgrounds, empty states |
| `--mist` | `#dde1ea` | Borders, input outlines |
| `--steel` | `#8a95a8` | Muted labels, secondary icons |
| `--slate` | `#4a5568` | Secondary body text |
| `--navy` | `#111827` | Primary text, headings, dark buttons |
| `--accent` | `#1a56db` | Primary CTA, links, active states |
| `--accent-light` | `#eff6ff` | Accent tint backgrounds, badge fills |
| `--green` | `#057a55` | Success, confirmed status |
| `--green-light` | `#ecfdf5` | Success badge backgrounds |

### Tokens defined only in some files

| Token | Hex | Defined in |
|-------|-----|-----------|
| `--accent-hover` | `#1e429f` | index, services, about, contact only |
| `--amber` | `#d97706` | dashboard, worker only |
| `--amber-light` | `#fffbeb` | dashboard, worker only |
| `--red` | `#dc2626` | dashboard, login, signup only |
| `--red-light` | `#fef2f2` | dashboard, login, signup only |
| `--purple` | `#7c3aed` | dashboard only |
| `--purple-light` | `#f5f3ff` | dashboard only |

> **Inconsistency:** The marketing pages (index, services, about, contact) never define `--amber`, `--red`, or `--purple`, so those colours can't be used consistently on public pages without adding the vars. Booking.html also has no red/amber vars despite collecting card details.

### Hardcoded colours (never in any variable)

These are scattered across files with no token:

| Hex | Where used |
|-----|-----------|
| `#1e429f` | `.btn-sm:hover` (dashboard), `.btn-next:hover` (booking) — equivalent to `--accent-hover` but hardcoded |
| `#1e40af` | `.bulk-btn-primary:hover` (dashboard) — a third slightly different dark blue |
| `#046c4e` | `.btn-complete:hover` (worker) — darker green hover, no var exists |
| `#34d399` | Trust indicator dots, success illustrations |
| `#f59e0b` | Star rating colour in reviews |
| `#bfdbfe` | Info notice border (`.sling-notice` in dashboard) |
| `#d1d5db` | Discount code input border (booking), newsletter input border (index) |
| `#ef4444` | `.discount-remove-btn` bg (booking), `.bulk-btn-danger` bg (dashboard) |
| `rgb(220,38,38)` | `.bulk-btn-danger:hover` (dashboard) |
| `#475569` | Disabled bulk button background (dashboard) |

> The three "dark blues" for hover states: `#1e429f` (most files), `#1e40af` (dashboard bulk bar), and `rgba` of accent — these are visually similar but technically different values.

---

## Variable name inconsistency

`--off-white` and `--off` are two names for exactly the same colour (`#f7f8fa`):

| Name | Files |
|------|-------|
| `--off-white` | index, services, about, contact |
| `--off` | booking, login, signup, dashboard, worker |

---

## Typography

### Font families

**Public site + auth pages** (index, services, about, contact, booking, login, signup):
- Body: `'Outfit', sans-serif`
- Display/headings/prices: `'Cormorant Garamond', serif`

**Staff portal** (dashboard, worker):
- Body: `'Inter', sans-serif`
- Numbers/monospace: `'JetBrains Mono', monospace`

### Cormorant Garamond usage (public pages)

| Element | Size | Weight |
|---------|------|--------|
| Hero title (index) | `clamp(52px, 7vw, 88px)` | 300 |
| Section titles | `clamp(32px, 4vw, 52px)` | 300 |
| Page hero titles (inner pages) | `clamp(36px, 5vw, 56px)` | 300 |
| About/section headings | `clamp(28px–32px, 3–4vw, 42–56px)` | 300 |
| Logo/brand name | 20–26px | 400–500 |
| Prices and large numbers | 26–72px | 300 |
| Review quotes | 18px | 300 italic |
| Success titles | 34px | 300 |

### JetBrains Mono usage (staff portal)

Applied via class `.num` and directly on specific elements: stat values, booking refs, finance amounts, chart labels, date/time displays, nav badges. Always with `font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'`.

---

## Spacing & Layout

### Container widths
- Public pages: max-width varies by section (1100–1200px typically), centered with `margin: 0 auto`
- Booking flow: single-column card, `max-width: 560px`
- Worker portal: `max-width: 480px`
- Dashboard: full-width sidebar layout, main content `margin-left: 220px`

### Common spacing units
- Card padding: `1.25rem 1.5rem` (dashboard) / `1.5rem` (worker)
- Section padding: `6rem 2rem` (public desktop) → `4rem 1.25rem` (mobile)
- Gap between cards: `1.5rem` (dashboard grid)
- Gap between form fields: `1rem`

---

## Border Radii

Three distinct values for `--radius-lg` across files:

| Value | Files |
|-------|-------|
| `20px` | index, services, about, contact, booking, login, signup |
| `18px` | worker |
| `16px` | dashboard |

Two distinct values for `--radius`:

| Value | Files |
|-------|-------|
| `12px` | index, services, about, contact, booking, login, signup, worker |
| `10px` | dashboard |

Other radii used directly (not via variable):
- `50px` — pill buttons (almost universal)
- `8px` — discount code inputs (booking), newsletter popup (index), bulk action buttons (dashboard)
- `6px` — worker assign select, chart bars
- `24px 24px 0 0` — bottom sheet (worker)
- `7px` — active tab (dashboard)
- `5px` — checklist checkboxes (worker)
- `4px` — chart bars top corners, tooltips
- `2px` — progress ring, sheet handle

---

## Shadows

| Value | Files |
|-------|-------|
| `--shadow: 0 4px 32px rgba(17,24,39,0.08)` | public pages (index, services, about, contact, booking, login, signup) |
| `--shadow: 0 4px 24px rgba(17,24,39,0.08)` | worker |
| `--shadow: 0 2px 16px rgba(17,24,39,0.07)` | dashboard |
| `--shadow-lg: 0 16px 64px rgba(17,24,39,0.14)` | index, services, signup only |

---

## Transitions

Three distinct timing values in use:

| Value | Files |
|-------|-------|
| `0.35s cubic-bezier(0.4,0,0.2,1)` | index, services, about, contact |
| `0.3s cubic-bezier(0.4,0,0.2,1)` | login, signup, booking |
| `0.25s ease` | dashboard, worker |

Some transitions bypass the variable entirely:
- `.discount-apply-btn` (booking): `transition: background 0.15s`
- `.ring-fill` (worker): `transition: width 0.3s ease`
- `.toast` (dashboard): `transition: opacity 0.3s ease`
- `.chart-bar` (dashboard): uses `var(--transition)`

---

## Buttons

Every file defines its own button classes. There are 30 distinct button class names across the codebase. All use `border-radius: 50px` (pill) except a handful that use `8px`.

### Pill buttons — public pages

| Class | File(s) | Background | Text | Size | Padding |
|-------|---------|-----------|------|------|---------|
| `.btn-primary` | index | `--accent` | white | 15px | 15px 32px |
| `.btn-ghost` | index | `rgba(255,255,255,0.12)` | white | 15px | 15px 28px |
| `.btn-book-nav` | index/services/about/contact | `--accent` | white | 13px | 10px 22px |
| `.btn-cta` | index | `--navy` | white | 15px | 16px 36px |
| `.btn-cta` | about | `--accent` | white | 15px | 14px 32px |
| `.btn-cta-outline` | index | none | `--navy` | 15px | 16px 32px |
| `.pricing-hl-btn` | index | `--accent` | white | 14px | 13px 28px |
| `.btn-svc` | services | `--navy` | white | 14px | 12px 24px |
| `.btn-svc-outline` | services | none | `--navy` | 14px | 12px 24px |
| `.btn-submit` | services | `--accent` | white | 14px | 13px, full width |
| `.btn-send` | contact | `--navy` | white | 14px | 14px, full width |
| `.btn-back` | booking | none | `--slate` | 14px | 12px 24px |
| `.btn-next` | booking | `--accent` | white | 14px | 13px 24px |
| `.btn-outline` | booking | none | `--slate` | 14px | 12px 28px |
| `.btn-login` | login, signup | `--navy` | white | 14px | 13px, full width |
| `.btn-home` | signup | `--navy` | white | 14px | 11px 24px |

> **Inconsistency:** `.btn-cta` means navy background on index but accent background on about. Two completely different looks under the same name.

### Pill buttons — staff portal

| Class | File | Background | Text | Size |
|-------|------|-----------|------|------|
| `.btn-sm` | dashboard | `--accent` | white | 12px |
| `.btn-sm-outline` | dashboard | none | `--slate` | 12px |
| `.btn-action` | dashboard | `--off` | `--navy` | 13px |
| `.btn-action.confirm` | dashboard | `--green` | white | 13px |
| `.btn-action.done` | dashboard | `--accent` | white | 13px |
| `.btn-action.cancel` | dashboard | `--red-light` | `--red` | 13px |
| `.btn-full` | worker | — (base class) | — | 14px |
| `.btn-complete` | worker | `--green` | white | 14px |
| `.btn-maps` | worker | `--off` | `--navy` | 14px |

### Square/rounded buttons (border-radius: 8px, not pills)

| Class | File | Background | Notes |
|-------|------|-----------|-------|
| `.discount-apply-btn` | booking | `#1a56db` hardcoded | Discount code section |
| `.discount-remove-btn` | booking | `#ef4444` hardcoded | Discount removal |
| `.newsletter-popup-button` | index | `#1a56db` hardcoded | Newsletter popup |
| `.bulk-btn-primary` | dashboard | `#1a56db` hardcoded | Bulk action bar |
| `.bulk-btn-danger` | dashboard | `rgba(239,68,68,0.9)` hardcoded | Bulk action bar |
| `.bulk-btn-ghost` | dashboard | transparent | Bulk action bar |

> All 6 square buttons use hardcoded colours instead of CSS variables, and use `8px` instead of the standard pill shape.

### Hover state inconsistency

| Button | Hover goes to |
|--------|--------------|
| `.btn-book-nav`, `.btn-submit` | `--accent-hover` (`#1e429f`) via var |
| `.btn-sm` | `#1e429f` hardcoded |
| `.btn-next` | `#1e429f` hardcoded (not via var) |
| `.btn-primary` | `--accent-hover` via var |
| `.btn-login`, `.btn-send`, `.btn-svc` | `--accent` (lightens to same blue, not darker) |
| `.btn-cta` (index) | no explicit hover rule |
| `.bulk-btn-primary` | `#1e40af` hardcoded (different from all others) |
| `.btn-complete` | `#046c4e` hardcoded (darker green, no var) |

---

## Form Inputs

Consistent pattern across all files:

```css
padding: 11–12px 14px;
border: 1.5px solid var(--mist);
border-radius: var(--radius);   /* 12px everywhere except dashboard's 10px */
font-family: 'Outfit', sans-serif;  /* public */  /  'Inter', sans-serif  /* staff */
font-size: 14px;
color: var(--navy);
background: var(--white);
```

Focus state (public pages): `border-color: var(--accent)` — no glow  
Focus state (dashboard modal inputs): `border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,86,219,0.08)` — adds subtle ring

Exception: Discount code input (booking) uses `border: 1px solid #d1d5db` with `border-radius: 8px` — out of pattern on both counts.

---

## Badges / Status Labels

Two separate badge systems exist on dashboard:

### Booking badges (`.badge-*`)
```css
.badge          — base: inline-flex, 11px, 3px 9px, border-radius: 50px
.badge-pending  — amber-light bg, amber text
.badge-confirmed — green-light bg, green text
.badge-done     — accent-light bg, accent text
.badge-cancelled — red-light bg, red text
```

### Quote status badges (`.status-*`)
```css
.status-badge   — same base as .badge (inline-flex, 11px, 3px 9px, border-radius: 50px)
.status-new      — amber-light bg, amber text
.status-contacted — accent-light bg, accent text
.status-closed   — light bg, steel text
```

Identical visual structure, different class names. Worker portal re-defines `.badge-pending`, `.badge-confirmed`, `.badge-done` with the same values as dashboard.

---

## Overlays & Modals

**Dashboard modals** (`.modal-overlay` / `.modal`):
- Overlay: `rgba(17,24,39,0.5)`, z-index 200
- Modal: white bg, `border-radius: var(--radius-lg)` (16px), `padding: 2rem`, max-width 520px, max-height 80vh

**Worker bottom sheet** (`.sheet-overlay` / `.sheet`):
- Overlay: same rgba, z-index 100
- Sheet: white bg, `border-radius: 24px 24px 0 0`, slides up from bottom, max-width 480px, max-height 85vh

---

## Layout Patterns

### Dashboard sidebar
- `width: 220px`, fixed position, full height, `background: var(--white)`, `border-right: 1px solid var(--light)`
- Main content: `margin-left: 220px`
- Nav items: 40px height, `border-radius: var(--radius)` (10px), hover `background: var(--off)`

### Dashboard stat grid
```css
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
```
Each stat card: white bg, `border: 1px solid var(--mist)`, `border-radius: var(--radius-lg)` (16px)

### Dashboard content grid
```css
.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.dashboard-grid.three { grid-template-columns: 2fr 1fr; }
```

### Public page sections
Alternating `background: var(--white)` and `background: var(--off-white)` sections, full-width with internal max-width container.

---

## Responsive breakpoints

| Breakpoint | What changes |
|-----------|-------------|
| `max-width: 1024px` | Dashboard: stats go 2-col; grids go 1-col |
| `max-width: 768px` | Public: nav hidden, hamburger shown; Dashboard: sidebar hidden |
| `max-width: 640px` | Booking: step layout adjusts |
| `max-width: 480px` | Various internal adjustments |

---

## Language toggle

All pages implement IS/EN toggling:

```css
span.is, span.en { display: none; }
body.lang-is span.is { display: inline; }
body.lang-en span.en { display: inline; }
```

Public pages: `.lang-btn` with active class toggled via JS  
Dashboard: `.dash-lang-btn` — slight visual variation (active = navy bg on dashboard vs. just border change on public)

---

## Summary of inconsistencies

1. **`--off-white` vs `--off`** — same colour, two variable names across the codebase
2. **`--radius-lg`** — three values: 20px / 18px / 16px
3. **`--radius`** — two values: 12px / 10px
4. **`--transition`** — three timings: 0.35s / 0.3s / 0.25s
5. **`--accent-hover`** — defined on 4 public pages only; hardcoded as `#1e429f` elsewhere
6. **`--red` / `--amber`** — not available on public pages or booking.html
7. **`.btn-cta`** — navy on index, accent on about
8. **Square buttons** — 6 button classes use `border-radius: 8px` and hardcoded colours; sit visually apart from the pill design system
9. **Hardcoded blues** — `#1a56db`, `#1e429f`, `#1e40af` all used in place of `--accent` / `--accent-hover`
10. **Green hover** — `#046c4e` hardcoded; no `--green-hover` var exists
11. **30 distinct button classes** — no shared base class; padding, sizing, and colours redefined per-file
12. **`--shadow`** — three different blur/opacity values across file groups
13. **`--purple`** — only in dashboard; unused on any public-facing page
