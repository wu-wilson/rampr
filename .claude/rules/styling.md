---
paths:
  - "client/src/**/*.tsx"
  - "client/src/**/*.css"
  - "client/tailwind.config.js"
---

# Styling

Light, warm-paper editorial aesthetic. No UI component libraries and no charting/rendering library (Recharts, Chart.js, full d3) — build every component from scratch with Tailwind and CSS. The one exception: the daily time-series charts (company trajectory, market index) use `d3-scale` for geometry only (`scaleBand` / `scaleLinear` / `scaleTime`, ticks, tick-formatting) while React renders the SVG; see `components/common/TrendBars.tsx`.

## Theming

- All colors via CSS custom properties / Tailwind semantic tokens. Never hardcode hex in components (no `bg-[#ABC]`).
- **Light mode only** — palette defined on `:root` in `index.css`. Never use Tailwind `dark:` prefixes; there is no dark mode and no theme toggle.
- Tokens are stored as **space-separated RGB channels** (e.g. `--ink: 27 33 28;`, hex in a comment) and consumed via `rgb(var(--token) / <alpha-value>)` in `tailwind.config.js`, so alpha modifiers like `text-ink/60` resolve. Direct `var(--token)` uses (SVG `fill`/`stroke`) must wrap as `rgb(var(--token))`.
- Surfaces: the paper app surface `--paper` fills the viewport; stat cards, gated panels, and hover `--raised`. Primary ink `--ink`; dark pills/rules/headers `--ink-strong`; muted-text ramp `--muted-1` → `--muted-3`. Borders tightest→lightest `--line-1` → `--line-4`. Brand green `--brand` (`--brand-dark`, `--brand-soft` for chart ramps).

## Visual Language

- Display/headlines and **every count/number** use **Archivo** (weights 500–800, `font-display`, `tabular-nums`). Labels, metadata, table cells, and badges use **IBM Plex Mono** (400–600, `font-mono`). Base 14px, line-height 1.5.
- The Board pairs an editorial headline (large Archivo) with a 2×2 cluster of market stat post-its (beside the headline on wide screens, stacked below on mobile) — big Archivo numbers over uppercase tracked-mono micro-labels.
- Square-ish corners, hairline borders from the border ramp, surface-tier shifts (`bg-paper` vs `bg-raised`) for depth — **prefer hairlines over shadows**. Never lean on a drop shadow where a `--line-*` border reads the section. The one deliberate exception: the Board stat post-its (`MarketHeadline`), where a soft shadow + slight tilt + torn tape sell the taped-note effect.
- Charts: the work-mix bar (Remote `--brand`, Hybrid `--brand-soft`, Onsite `--line-3`, Unknown residual `--muted-3`) and sector bars (ramp `--brand-dark` → `--brand` → `--brand-soft` → `--line-4`, ordered by count) are hand-rolled CSS. The two daily time-series charts are d3-scaled SVG via `TrendBars` (latest bar `--brand`, the rest `--brand-soft`; axes/gridlines from the `--line-*` and `--muted-*` ramps). SVG `fill`/`stroke` take a token as `rgb(var(--token))` — never a hex.

## Momentum status

- Never signal momentum by color alone. Always pair a glyph **and** text with the color: `↗ Ramping up` → `text-up`, `↘ Cooling down` → `text-down`, `→ flat` → `text-flat`. The glyph and word carry the meaning; color only reinforces.

## Texture

- The app surface carries a faint paper grain (`grain.png` over `bg-paper`, in `client/public/assets/`). Keep it subtle — layered once at low contrast, it must never reduce text contrast — not applied per-component.

## Interactive States

- Every clickable element has a hover state via a smooth `transition-colors` / `transition-[filter]` and a visible focus ring (`:focus-visible` box-shadow from the ink token). Row/link hovers use a translucent `bg-raised/60` (not opaque `bg-raised`) so the paper grain still shows through — leaderboard rows and market-mover links (each the width of its divider rules, so the highlight never overhangs the borders). No instant visual changes — all in-flow motion ≤300ms.

## Animation

- Duration constants from `constants/animations.ts` (`DURATION = { fast: 150, normal: 250, smooth: 300 }`); all in-flow ≤300ms. Prefer `transform`/`opacity`. Honor `prefers-reduced-motion` in `index.css` (disable keyframes, clamp transitions).
- Inline `style={{...}}` is reserved for values Tailwind can't cleanly express: JS-derived chart bar widths/heights, durations, animation delays, and fluid `clamp()` headline sizes. Fixed typographic values (`text-[11px]`, `tracking-[0.1em]`, `leading-[1.6]`) go in `className`, not `style`.
