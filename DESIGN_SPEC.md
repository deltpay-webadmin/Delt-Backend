# Delt Backend — Design Spec

Source of truth for the project's visual system. Every value is cited to a file path (and line where useful) so it can be re-verified.

The repo is a Figma Make export using **Tailwind v4** + Vite + React. There is **no `tailwind.config.*` file** — Tailwind v4 uses a CSS-first `@theme` block. All design tokens live in `src/styles/default_theme.css` (single source of truth); `src/styles/globals.css` owns only the base layer and default element typography.

---

## 1. Tooling / config

| Concern | Location |
|---|---|
| Tailwind version | `package.json` — `@tailwindcss/vite@4.1.12`, `tailwindcss@4.1.12` |
| Vite plugin wiring | `vite.config.ts:44` — `tailwindcss()` |
| PostCSS | `postcss.config.mjs` — empty (`export default {}`); Tailwind v4 does not need PostCSS |
| Style entry | `src/main.tsx:4` → `src/styles/index.css` |
| Stylesheet chain | `src/styles/index.css:1-5` — imports `tailwindcss source(none)`, globs `../../**/*.{js,ts,jsx,tsx}`, then `tw-animate-css`, then `default_theme.css`, then `globals.css` |
| `@theme` block | `src/styles/default_theme.css` (single source of truth) |

No `tailwind.config.{js,ts,mjs}` exists. Tokens are defined as CSS custom properties under `:root` / `.dark` in `default_theme.css` and exposed to Tailwind via `@theme inline { --color-*: var(--*); ... }` in the same file. `globals.css` owns only `@custom-variant dark`, the DM Sans `@import`, the base layer, and default element typography.

---

## 2. Font families & weights

### Family

- **DM Sans** (Google Fonts, variable `opsz 9..40`, weight `100..1000`, italic + roman).
- Import — `src/styles/globals.css:3`:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
  ```
- Exposed to Tailwind as `--font-sans` in `default_theme.css` (inside `@theme inline`): `'DM Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`.
- Applied at the app shell via the `font-sans` utility — `src/app/components/backend/DeltBackendLayout.tsx:442`. Preview `<pre>` blocks in `BackendOutreach.tsx` also use `font-sans` to opt out of the browser monospace default.
- The print/PDF export uses an OS-level fallback stack only: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` — `src/app/components/ExportDealReport.tsx:19`.

### Weight tokens

Defined in `src/styles/default_theme.css` (light and dark blocks kept in sync):

| Token | Value |
|---|---|
| `--font-weight-normal` | `400` |
| `--font-weight-medium` | `500` |
| `--font-weight-semibold` | `600` |
| `--font-weight-bold` | `700` |
| `--font-weight-extrabold` | `800` |

### Weights actually used in markup

Counted across `src/app/components/backend/**`:

| Class | Weight | Occurrences |
|---|---|---|
| `font-medium` | 500 | 695 |
| `font-semibold` | 600 | 645 |
| `font-bold` | 700 | 451 |
| `font-normal` | 400 | 9 |
| `font-extrabold` | 800 | 8 |

### Default element typography

Applied only when no ancestor has a `text-*` class — `src/styles/globals.css:140-183`:

| Selector | Size | Weight | Line-height |
|---|---|---|---|
| `h1` | `var(--text-2xl)` | `--font-weight-medium` (500) | 1.5 |
| `h2` | `var(--text-xl)` | 500 | 1.5 |
| `h3` | `var(--text-lg)` | 500 | 1.5 |
| `h4` | `var(--text-base)` | 500 | 1.5 |
| `label` | `var(--text-base)` | 500 | 1.5 |
| `button` | `var(--text-base)` | 500 | 1.5 |
| `input` | `var(--text-base)` | `--font-weight-normal` (400) | 1.5 |

---

## 3. Type scale

- Root: `html { font-size: var(--font-size); }` where `--font-size: 16px` — `src/styles/globals.css:6,186` and `default_theme.css:4`.
- Tailwind v4 inherited scale (no overrides): `text-xs` 12 / `text-sm` 14 / `text-base` 16 / `text-lg` 18 / `text-xl` 20 / `text-2xl` 24 / `text-3xl` 30 / etc.

### Arbitrary pixel sizes used in the Backend UI

| Class | Typical use |
|---|---|
| `text-[8px]` | Micro-labels inside dense tables |
| `text-[9px]` | Dispute stage labels (`BackendDisputes.tsx:522`) |
| `text-[10px]` | Uppercase group headers, `<kbd>` keys, tiny metadata |
| `text-[11px]` | Secondary meta, sidebar email/role |
| `text-[13px]` | **Primary nav/body size of the backend shell** (sidebar items, search, palette, breadcrumbs) |
| `text-[15px]` | Brand wordmark, large inline labels |

---

## 4. Spacing / sizing scale

Tailwind v4 default `--spacing` step (`0.25rem = 4px`) is in effect — no override.

### Padding / margin / gap steps used in the shell

- Padding / margin: `0, 1, 2, 3, 4, 5, 6, 8, 12` → `0, 4, 8, 12, 16, 20, 24, 32, 48 px`.
- Gap: `1, 2, 3, 4, 5` → `4, 8, 12, 16, 20 px`.
- Half-step utilities are common: `py-1.5` (6 px), `py-2.5` (10 px), `py-3.5` (14 px), `gap-2.5` (10 px).
- Hand-tuned arbitrary values in the shell (`DeltBackendLayout.tsx`):
  - `py-[7px]` — nav item vertical padding
  - `py-[6px]` — sub-nav item vertical padding

### Icon sizing convention

| Role | Size |
|---|---|
| Sidebar nav icons | `w-[16px] h-[16px]` |
| Small chevrons | `w-3.5 h-3.5` (14 px) |
| Top-bar icons | `w-[18px] h-[18px]` |
| Brand badge | `w-7 h-7` (28 px) |
| User avatar | `w-8 h-8` (32 px) |

### Border radius

| Token | Value | Source |
|---|---|---|
| `--radius` | `0.625rem` (10 px) | `default_theme.css:33` / `globals.css:35` |
| `--radius-sm` | `calc(var(--radius) - 4px)` = 6 px | `default_theme.css:108` |
| `--radius-md` | `calc(var(--radius) - 2px)` = 8 px | `default_theme.css:109` |
| `--radius-lg` | `var(--radius)` = 10 px | `default_theme.css:110` |
| `--radius-xl` | `calc(var(--radius) + 4px)` = 14 px | `default_theme.css:111` |

Arbitrary radii used in the backend UI: `rounded-[2px]`, `rounded-[4px]`, `rounded-[5px]`, `rounded-[6px]` (buttons, nav items), `rounded-[8px]` (cards, inputs), `rounded-[12px]` (command palette).

### Fixed layout widths

| Name | Value | Source |
|---|---|---|
| Sidebar (desktop shell) | `220px` | `DeltBackendLayout.tsx:445` |
| Mobile sidebar drawer | `260px` | `DeltBackendLayout.tsx:718` |
| Command palette | `max-w-lg` (32 rem / 512 px) | `DeltBackendLayout.tsx:846` |
| Search input | `w-72` (288 px) | `DeltBackendLayout.tsx:641` |
| Top bar / header height | `h-14` (56 px) | `DeltBackendLayout.tsx:620, 719` |
| `ui/sidebar.tsx` tokens (shadcn primitive, unused by live shell) | `SIDEBAR_WIDTH = 16rem`, `SIDEBAR_WIDTH_MOBILE = 18rem`, `SIDEBAR_WIDTH_ICON = 3rem` | `src/app/components/ui/sidebar.tsx:30-32` |

---

## 5. Color tokens

All tokens are CSS custom properties on `:root` / `.dark`, mirrored onto Tailwind via `@theme inline`. Single source of truth: `src/styles/default_theme.css`.

### Light theme (`:root`)

| Token | Value |
|---|---|
| `--background` | `#ffffff` |
| `--foreground` | `oklch(0.145 0 0)` |
| `--card` | `#ffffff` |
| `--card-foreground` | `oklch(0.145 0 0)` |
| `--popover` | `oklch(1 0 0)` |
| `--popover-foreground` | `oklch(0.145 0 0)` |
| `--primary` | `#030213` |
| `--primary-foreground` | `oklch(1 0 0)` |
| `--secondary` | `oklch(0.95 0.0058 264.53)` |
| `--secondary-foreground` | `#030213` |
| `--muted` | `#ececf0` |
| `--muted-foreground` | `#717182` |
| `--accent` | `#e9ebef` |
| `--accent-foreground` | `#030213` |
| `--destructive` | `#d4183d` |
| `--destructive-foreground` | `#ffffff` |
| `--border` | `rgba(0, 0, 0, 0.1)` |
| `--input` | `transparent` |
| `--input-background` | `#f3f3f5` |
| `--switch-background` | `#cbced4` |
| `--ring` | `oklch(0.708 0 0)` |
| `--chart-1` | `oklch(0.646 0.222 41.116)` |
| `--chart-2` | `oklch(0.6 0.118 184.704)` |
| `--chart-3` | `oklch(0.398 0.07 227.392)` |
| `--chart-4` | `oklch(0.828 0.189 84.429)` |
| `--chart-5` | `oklch(0.769 0.188 70.08)` |
| `--sidebar` | `oklch(0.985 0 0)` |
| `--sidebar-foreground` | `oklch(0.145 0 0)` |
| `--sidebar-primary` | `#030213` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` |
| `--sidebar-accent` | `oklch(0.97 0 0)` |
| `--sidebar-accent-foreground` | `oklch(0.205 0 0)` |
| `--sidebar-border` | `oklch(0.922 0 0)` |
| `--sidebar-ring` | `oklch(0.708 0 0)` |
| `--brand` | `#4318FF` |
| `--brand-hover` | `#3311DD` |
| `--brand-light` | `#7B61FF` |
| `--canvas` | `#F8FAFC` |
| `--canvas-muted` | `#FAFBFD` |
| `--info` | `#0284C7` |
| `--info-hover` | `#0369A1` |

### Dark theme (`.dark`)

Deltas vs. light (see `default_theme.css:44-79` for the full list):

| Token | Value |
|---|---|
| `--background` | `oklch(0.145 0 0)` |
| `--foreground` | `oklch(0.985 0 0)` |
| `--card` | `oklch(0.145 0 0)` |
| `--card-foreground` | `oklch(0.985 0 0)` |
| `--popover` | `oklch(0.145 0 0)` |
| `--popover-foreground` | `oklch(0.985 0 0)` |
| `--primary` | `oklch(0.985 0 0)` |
| `--primary-foreground` | `oklch(0.205 0 0)` |
| `--secondary` | `oklch(0.269 0 0)` |
| `--secondary-foreground` | `oklch(0.985 0 0)` |
| `--muted` | `oklch(0.269 0 0)` |
| `--muted-foreground` | `oklch(0.708 0 0)` |
| `--accent` | `oklch(0.269 0 0)` |
| `--accent-foreground` | `oklch(0.985 0 0)` |
| `--destructive` | `oklch(0.396 0.141 25.723)` |
| `--destructive-foreground` | `oklch(0.637 0.237 25.331)` |
| `--border` | `oklch(0.269 0 0)` |
| `--input` | `oklch(0.269 0 0)` |
| `--ring` | `oklch(0.439 0 0)` |
| `--chart-1` | `oklch(0.488 0.243 264.376)` |
| `--chart-2` | `oklch(0.696 0.17 162.48)` |
| `--chart-3` | `oklch(0.769 0.188 70.08)` |
| `--chart-4` | `oklch(0.627 0.265 303.9)` |
| `--chart-5` | `oklch(0.645 0.246 16.439)` |
| `--sidebar` | `oklch(0.205 0 0)` |
| `--sidebar-foreground` | `oklch(0.985 0 0)` |
| `--sidebar-primary` | `oklch(0.488 0.243 264.376)` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` |
| `--sidebar-accent` | `oklch(0.269 0 0)` |
| `--sidebar-accent-foreground` | `oklch(0.985 0 0)` |
| `--sidebar-border` | `oklch(0.269 0 0)` |
| `--sidebar-ring` | `oklch(0.439 0 0)` |
| `--brand` | `#4318FF` (constant across themes) |
| `--brand-hover` | `#3311DD` (constant across themes) |
| `--brand-light` | `#7B61FF` (constant across themes) |
| `--canvas` | `oklch(0.145 0 0)` |
| `--canvas-muted` | `oklch(0.19 0 0)` |
| `--info` | `#0284C7` (constant) |
| `--info-hover` | `#0369A1` (constant) |

### `@theme inline` → Tailwind utilities

The `@theme inline` block in `default_theme.css` maps every token above into a Tailwind color / radius / font slot:

- Semantic surface / text: `bg-background`, `text-foreground`
- `bg-card`, `text-card-foreground`
- `bg-popover`, `text-popover-foreground`
- `bg-primary`, `text-primary-foreground`
- `bg-secondary`, `text-secondary-foreground`
- `bg-muted`, `text-muted-foreground`
- `bg-accent`, `text-accent-foreground`
- `bg-destructive`, `text-destructive-foreground`
- `border-border`, `bg-input`, `bg-input-background`, `bg-switch-background`
- `ring-ring`
- `text-chart-1 … chart-5`
- `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-primary`, `text-sidebar-primary-foreground`, `bg-sidebar-accent`, `text-sidebar-accent-foreground`, `border-sidebar-border`, `ring-sidebar-ring`
- **Delt product tokens:** `bg-brand`, `text-brand`, `border-brand`, `ring-brand`, `from-brand`, `to-brand`, plus alpha modifiers (`bg-brand/10`, `bg-brand/[0.06]`, etc.); `bg-brand-hover`, `text-brand-hover`; `bg-brand-light`, `to-brand-light`; `bg-canvas`, `bg-canvas-muted`; `bg-info`, `text-info`, `bg-info-hover`.
- Radii: `rounded-sm` (6 px), `rounded-md` (8 px), `rounded-lg` (10 px), `rounded-xl` (14 px)
- Font: `font-sans` → DM Sans stack

### Brand / product token usage

The `[#4318FF]` / `[#3311DD]` / `[#7B61FF]` / `[#F8FAFC]` / `[#FAFBFD]` / `[#0284C7]` / `[#0369A1]` / `[#3614d0]` / `[#6B5BFF]` arbitrary classes that previously littered the backend have been migrated to these tokens in the patterns below.

| Old arbitrary class | Token class |
|---|---|
| `bg-[#4318FF]`, `text-[#4318FF]`, `border-[#4318FF]`, `ring-[#4318FF]`, `from-[#4318FF]` | `bg-brand`, `text-brand`, `border-brand`, `ring-brand`, `from-brand` |
| `bg-[#4318FF]/10`, `bg-[#4318FF]/[0.06]`, etc. | `bg-brand/10`, `bg-brand/[0.06]`, etc. |
| `bg-[#3311DD]`, `bg-[#3614d0]`, `hover:bg-[#3311DD]`, `hover:bg-[#3614d0]` | `bg-brand-hover`, `hover:bg-brand-hover` (the two near-identical deep shades were unified) |
| `to-[#6B5BFF]`, `to-[#7B61FF]` | `to-brand-light` (unified) |
| `bg-[#F8FAFC]` | `bg-canvas` |
| `bg-[#FAFBFD]` | `bg-canvas-muted` |
| `bg-[#0284C7]`, `text-[#0284C7]` | `bg-info`, `text-info` |
| `bg-[#0369A1]`, `hover:bg-[#0369A1]` | `bg-info-hover`, `hover:bg-info-hover` |

### Other colors (left as literal hex or Tailwind defaults)

Status families and other palettes that are still referenced as arbitrary classes or inline styles — not worth tokenizing given sparse, scattered use:

| Family | Representative hexes | Role |
|---|---|---|
| Success green | `#10B981`, `#059669`, `#22C55E`, `#0E9F6E`, `#0FAF62`, `#6BAF3D`, `#2D5016` | Status chips, KPI deltas |
| Warning amber | `#D97706`, `#E3A008`, `#E8850C`, `#B45309`, `#644712` | Alerts, totals |
| Danger red | `#DC2E3A`, `#E11D48`, `#EF4444`, `#B91C1C` | Destructive, errors |
| Extra info | `#06B6D4`, `#4A90D9` | Occasional info chips |
| Indigo accents | `#6366F1`, `#818CF8` | Secondary brand |
| Purple accents | `#A855F7`, `#6B21A8` | Tag variants |
| Slate text / borders | `#334155`, `#94A3B8`, `#E2E8F0`, `#E5E7EB` | Body / borders |
| Payment brand swatches | `#006fcf`, `#1A1F36`, `#041e42`, `#1a1f71`, `#1E3A5F` | Card brand badges |

Neutral grays are used via Tailwind's default palette (`text-gray-900`, `bg-gray-50`, `border-gray-200`, …) rather than tokens.

---

## 6. Container max-widths

All page roots in `src/app/components/backend/pages/*.tsx` follow the pattern `max-w-[…] mx-auto px-6 py-5|6`:

| Max-width | Pages |
|---|---|
| `max-w-[1440px]` | Dashboard, Capital, Outreach, Disputes, Lens AI, Bundles, Residuals (list), Merchant Residual Detail, Deal Detail |
| `max-w-[1400px]` | Analysis |
| `max-w-[1280px]` | Settings |
| `max-w-[1200px]` | Agent Residuals view |

Smaller component-level clamps (non-layout): `max-w-[600px]`, `max-w-[500px]`, `max-w-[400px]`, `max-w-[200px]`, `max-w-[180px]`, `max-w-[160px]`, `max-w-[60px]`, `max-w-[28px]`, `max-w-[24px]`.

No global Tailwind `container` config.

---

## 7. Breakpoints

No custom breakpoints — Tailwind v4 defaults are used everywhere:

| Prefix | Min width |
|---|---|
| `sm:` | 640 px |
| `md:` | 768 px |
| `lg:` | 1024 px |
| `xl:` | 1280 px |
| `2xl:` | 1536 px |

Shell usage:

- `md:` — show desktop search input (`DeltBackendLayout.tsx:641`), hide mobile search icon.
- `lg:` — switch sidebar from overlay drawer to persistent rail (`DeltBackendLayout.tsx:445, 622`).
- `sm:` — show role-toggle pill in header (`DeltBackendLayout.tsx:661`).

**JS-side breakpoint:** `MOBILE_BREAKPOINT = 768` in `src/app/components/ui/use-mobile.ts:3` (matches Tailwind `md`).

---

## 8. Miscellaneous globals

- `src/styles/globals.css:1` — `@custom-variant dark (&:is(.dark *));` (dark mode variant)
- `src/styles/globals.css` — `@apply border-border outline-ring/50;` global reset on `*`
- `src/styles/globals.css` — `body { @apply bg-background text-foreground; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }`
- `src/styles/index.css:3` — animation library `tw-animate-css`
- PDF/print export uses its own font stack (`ExportDealReport.tsx:19`) and is not part of the UI shell.
