---
name: design-tokens
description: rampr's exact color tokens, fonts, paper texture, animation durations, and the ultra-wide rail. Read before writing any client styling.
---

# rampr design tokens

rampr is a **light, warm-paper editorial** board: paper surfaces, hairline borders (never shadows-as-crutch), square-ish corners, a green accent, and mono labels/numbers. No dark mode, no theme toggle.

## Color tokens

Store every color as **space-separated RGB channels** on `:root` in `client/src/index.css` (hex in a comment), and consume it through `rgb(var(--token) / <alpha-value>)` in `tailwind.config.js` so Tailwind opacity modifiers (`text-ink/60`) resolve. Never hardcode hex in components.

```css
:root {
  /* Surfaces */
  --paper:  252 251 247;  /* #FCFBF7  the app surface — fills the whole viewport */
  --raised: 245 244 236;  /* #F5F4EC  stat cards, gated panels, hover */

  /* Ink */
  --ink:        27 33 28;   /* #1B211C  primary text */
  --ink-strong: 35 40 31;   /* #23281F  dark pills, rules, headers */

  /* Brand green */
  --brand:      31 157 91;  /* #1F9D5B */
  --brand-dark: 22 107 62;  /* #166B3E */
  --brand-soft: 143 203 168;/* #8FCBA8  work-mix hybrid slice */

  /* Muted text ramp, lightest use to faintest */
  --muted-1: 86 91 79;      /* #565B4F  body-muted */
  --muted-2: 117 120 108;   /* #75786C  labels */
  --muted-3: 155 158 144;   /* #9B9E90  faint meta */

  /* Borders, tightest to lightest */
  --line-1: 234 232 221;    /* #EAE8DD  row divider */
  --line-2: 228 226 215;    /* #E4E2D7  section rule */
  --line-3: 216 214 203;    /* #D8D6CB  card border / onsite slice */
  --line-4: 201 199 187;    /* #C9C7BB  control border */

  /* Momentum status (always paired with a glyph + text, never color alone) */
  --up:   31 122 72;        /* #1F7A48  ↗ ramping up */
  --down: 160 91 34;        /* #A05B22  ↘ cooling down */
  --flat: 155 158 144;      /* #9B9E90  → flat */
}
```

`tailwind.config.js` maps these to semantic names via a channel helper:

```js
const ch = (name) => `rgb(var(${name}) / <alpha-value>)`;
// colors: paper, raised, ink, ink-strong, brand, brand-dark, brand-soft,
//         muted: {1,2,3}, line: {1,2,3,4}, up, down, flat
```

## Fonts

- **Archivo** (weights 500–800) — display headings, names, and every count/number. `font-display`. **The `body` defaults to Archivo** — it's the common case for content.
- **IBM Plex Mono** (400–600) — labels, metadata, table cells, badges. Apply `font-mono` explicitly; it's the labeled exception, not the default.

Load via the same Google Fonts `@import` at the top of `index.css`. Base body size `14px`.

## Paper texture

The app surface carries a faint grain: `background-image: url('/assets/grain.png')` over `bg-paper`. Put `grain.png` in `client/public/assets/`. Keep it subtle (the wireframe layers it at full but low-contrast); it must never reduce text contrast.

## Momentum semantics

- `↗ Ramping up` → `text-up`
- `↘ Cooling down` → `text-down`
- `→ flat` → `text-flat`

The arrow is rendered by the `MomentumArrow` SVG component (rotated per direction) — the `↗ ↘ →` here are illustrative shorthand. The glyph and the word carry the meaning; color only reinforces.

## Work-mix + sector colors

- Work mix bar: Remote `--brand`, Hybrid `--brand-soft`, Onsite `--line-3`, Unknown (residual, only if > 0) `--muted-3`.
- Sector bars: every bar the same `--brand`, ordered by count — rank reads from bar length, not from dimming a live sector.

## Animation

Durations live in `client/src/constants/animations.ts` as named constants; keep everything ≤ 300ms and prefer `transform`/`opacity`.

```ts
export const DURATION = { fast: 150, normal: 250, smooth: 300 } as const;
```

Honor `prefers-reduced-motion` in `index.css` (disable keyframes, clamp transitions).

## Ultra-wide rail

The paper surface (`bg-paper` + grain) fills the whole viewport; **content and the sectioning hairlines stay in a centered 1280px rail**. Nothing marks the rail's edges — the paper simply extends past it. Implement as `.app-surface` on the full-viewport shell with a `max-w-rail mx-auto` content container inside (`rail` = `1280px`, mapped in `tailwind.config.js`); the hairlines live on the bands within that container, so they cap at the rail.

## Interaction

Every clickable element gets a hover state, a visible focus ring (`box-shadow: 0 0 0 1px rgb(var(--ink) / 0.6)` via `:focus-visible`), and a transition. Row/link hovers use a translucent `bg-raised/60` so the paper grain still shows through.
