# Delt Backend — UI Standards

One color, one radius scale, one set of primitives. Import primitives from
`components/backend/ui` instead of hand-writing button/tab/badge/card markup.

## Tokens

**Primary color** — the semantic `brand` token, currently indigo `#4f46e5`.
Never use raw `indigo-*` classes in the backend; use the `brand` ramp so a
rebrand is a one-line change in `styles/default_theme.css`.

| Use | Class |
| --- | --- |
| Primary surface (buttons, active states) | `bg-brand`, hover `bg-brand-hover` |
| Accent text / icons / links | `text-brand` |
| Accent border / active tab | `border-brand` |
| Tint backgrounds | `bg-brand-50`, `bg-brand-100` |
| Mid borders | `border-brand-200` |
| Focus ring | `ring-brand-500/40` |

Ramp available: `brand-50 … brand-700`, plus `brand` (=600), `brand-hover`
(=700), `brand-light` (=500).

**Radius** — three tiers only:

| Tier | Class | Used for |
| --- | --- | --- |
| Controls & cards | `rounded-[8px]` | buttons, inputs, selects, cards, panels |
| Pills | `rounded-full` | badges, avatars, toggles |
| Large surfaces | `rounded-[12px]` | modals, sheets |

## Primitives

```tsx
import { Button, IconButton, Tabs, Badge, Card } from '@/app/components/backend/ui';
```

- **Button** — `variant`: `primary` \| `secondary` \| `danger` \| `ghost`;
  `size`: `sm` \| `md` \| `lg`; `icon` / `trailingIcon`; `block`.
- **IconButton** — square icon-only action; `variant`: `ghost` \| `solid` \|
  `danger`. Requires `aria-label`.
- **Tabs** — underline tab bar; `tabs`, `active`, `onChange`, optional per-tab
  `icon` / `count`.
- **Badge** — status/category pill; `tone`: `gray` \| `brand` \| `green` \|
  `amber` \| `red` \| `blue` \| `violet` \| `sky`; optional `bordered`, `icon`.
- **Card** — standard white surface; `padded` (default true).

## Rules of thumb

1. Reach for a primitive first. Only drop to raw markup for genuinely one-off UI.
2. Primary action per view = one `Button variant="primary"`. Everything else is
   `secondary` / `ghost`.
3. Status colors come from `Badge` tones — don't invent new bg/text pairs.
4. Don't reintroduce `indigo-*`, `rounded-md/lg/xl`, or `rounded-[6px]`.
