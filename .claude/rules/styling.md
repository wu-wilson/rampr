---
paths:
  - "client/src/**/*.tsx"
  - "client/src/**/*.css"
  - "client/tailwind.config.js"
---

# Styling

rampr reads as a daily statistical release: white paper, ink, hairlines, light headings, tabular figures, titled tables and charts. No UI component libraries and no charting/rendering library (Recharts, Chart.js, full d3) — build every component from scratch with Tailwind and CSS. The one exception: chart geometry uses `d3-scale` (`scaleLinear`, `.nice()`, `.ticks()`) inside `lib/chart.ts` while React renders the SVG; see `components/common/LineChart.tsx` and `BreadthChart.tsx`.

## Theming

- All colors via CSS custom properties / Tailwind semantic tokens. Never hardcode hex in components (no `bg-[#ABC]`). Hex appears only in the public assets (`favicon.svg`, `og.png`), the `theme-color` meta in `index.html`, and the black of the strip's fade mask in `index.css`.
- **Light mode only** — palette defined on `:root` in `index.css`. Never use Tailwind `dark:` prefixes; there is no dark mode and no theme toggle.
- Tokens are stored as **space-separated RGB channels** (e.g. `--ink: 11 12 15;`, hex in a comment) and consumed via `rgb(var(--token) / <alpha-value>)` in `tailwind.config.js`, so alpha modifiers like `text-ink/60` resolve. Direct uses (SVG `fill`/`stroke`, Web Animations keyframes) must wrap as `rgb(var(--token))` — the `token()` helper in `lib/chart.ts` does this. Never animate between hex literals: animate the opacity of a token-coloured element instead (see `RulingBackdrop`).
- Surfaces: `--paper` (white) is the page; `--hover` for row hover; `--weekend` for the chart weekend bands. Ink ramp `--ink` (text, lines, dots, links) → `--ink-2` (secondary text) → `--ink-3` (captions, axis labels, source lines). Hairlines `--line` (table rules, panel borders, gridlines), `--line-2` (row dividers, the ledger rules at rest), `--line-3` (the zero axis, a bar that did not move, the masthead stamp's separator), `--wave` (a ledger rule at the crest of the wave). Change colours `--up`, `--down`, `--flat`.
- **There is no brand colour.** Lines, dots, bars, links, and the active tab are ink. Green and red appear only on change figures and never fill a surface.

## Visual Language

- One typeface: the `font-sans` stack (Söhne, Suisse Int'l, then the self-hosted **Switzer** in 300/400/500/600 from `public/fonts`, then Helvetica Neue and the system faces). No mono, no display face, no Google Fonts. Body 15px, line-height 1.5, `tabular-nums` on `body`.
- Headings and the big figures are **weight 300** with tight tracking (the lead figure `clamp(76px, 10vw, 128px)` at `-0.045em`; company name `clamp(44px, 6vw, 64px)`; Method heading `clamp(30px, 3.8vw, 44px)`). Names, counts, and column labels are weight 500. Captions are 15px at weight 500 in ink; source lines are 12.5px in `--ink-3`. A figure or name that a line of secondary text turns on goes through `components/common/Emphasis.tsx` (weight 500 in ink).
- Tables and charts carry a titled caption via `Caption`, except the hero chart and the breakdown lists, which carry their own inline headings. All three render an `h2`, so every visible section title sits in the page's heading outline under its one `h1`. Explanations live on the Method page.
- Each screen renders exactly one `h1`: the Board's eyebrow above the figure, the company name, the Method heading, or a visually hidden one on Market. The empty states (day-zero, not yet counted, not found) carry their own, and they replace a screen rather than sit inside it, so the two never both render.
- **No shadows, no radius, no gradient fills, no pills, no chips.** (The strip's fade mask and the select chevron are drawn with hard-edged gradients, which is not a fill.) Sections are separated by space and hairlines only. The one radius on the site is 4px on the company marks in the strip. Controls are text on a hairline: the sector select, the search field, the range tabs with a sliding underline, and sortable column headers with a 10px chevron.
- Charts: a 1.75px ink line with an ink endpoint dot, hairline gridlines, weekend columns in `--weekend`, a value axis fitted to the series (never forced to zero), and a text readout above the plot that shows the latest release until the pointer picks another, when a crosshair follows it. No figure is drawn on the plot itself. Breadth bars are `--up`/`--down`/`--line-3` on a `--line-3` zero axis. Sector bars are a 6px ink bar. Nothing on a chart is any colour but ink, the two change colours, and the hairline greys.
- Company marks in the strip (`public/marks`, 128px PNGs) render in colour at 22px.

## Change figures

- A change is a signed figure: `+34`, `−22` (a true minus, U+2212, from `formatDelta`), or a grey `0`. The **sign carries the direction**; the colour (`text-up` / `text-down` / `text-flat`) reinforces it and is never load-bearing. The direction word ("Rose" / "Fell" / "Held") rides along as the hover title. No arrows, triangles, or glyphs. Render through `components/common/Change.tsx`; a gated change reads "new".

## Copy

- Plain sentences a person would write. No em dashes, no middle dots, no semicolons, no jargon in anything the viewer reads. Numbers in sentences are formatted with `formatCount`; dates are spoken (`September 21`) in sentences and short (`Sep 21`) in tables and axes.

## Interactive States

- Every clickable element has a hover state via `transition-colors` at `DURATION.normal` on `EASING` (the shared `TRANSITION` style), and a visible focus ring (`:focus-visible` 2px ink outline, 2px offset, drawn inset on rows and drawer links that run to the screen edge so it can't be clipped). Row hovers use `bg-hover`, the width of the row's rules so the highlight never overhangs. Text links use the `.link` class (ink text, grey underline that darkens).

## Animation

- Duration constants from `constants/animations.ts`. Interaction motion (`DURATION`: 200 / 300ms) stays at or below 300ms. Ambient and reveal motion (the 500ms section rise and the strip loop in `index.css`; `AMBIENT`: the 700ms chart draw and the ledger wave) runs on its own clock or once as a section enters, never in response to a pointer. One curve for interaction, `EASING` (`cubic-bezier(0.25, 1, 0.5, 1)`); `EASING_SYMMETRIC` only for motion that rises and returns.
- Nothing above the fold animates on load: the first frame is complete. Sections that start below the fold rise 10px once as they enter (`Reveal`), and a chart inside draws its line as its section appears (`useDrawReveal`, a clip-path reveal, never a dash). Sorting the company table slides rows to their places (`useFlipReorder`). Range changes crossfade. The crosshair follows the pointer with no easing.
- Prefer `transform`/`opacity`. Honor `prefers-reduced-motion` both in `index.css` (transitions and keyframes off) and in every Web Animations code path via `prefersReducedMotion()`, which CSS cannot reach. Ambient motion also pauses while `document.hidden`.
- Inline `style={{...}}` is reserved for values Tailwind can't cleanly express: JS-derived chart geometry, the snap-to-rules heights, durations, and fluid `clamp()` sizes. Fixed typographic values (`text-[11px]`, `tracking-[0.1em]`, `leading-[1.6]`) go in `className`, not `style`.
