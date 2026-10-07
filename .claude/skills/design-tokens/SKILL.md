---
name: design-tokens
description: rampr's exact color tokens, the typeface, animation constants, the rail and full-bleed regions, and the fixed dimensions of the release layout. Read before writing any client styling.
---

# rampr design tokens

rampr is a **daily statistical release**: white paper, ink, hairlines, light headings, tabular figures, titled tables and charts. No brand colour, no shadows, no radii beyond the 4px on the company marks, no gradient fills, no mono, no dark mode.

## Color tokens

Store every color as **space-separated RGB channels** on `:root` in `client/src/index.css` (hex in a comment), and consume it through `rgb(var(--token) / <alpha-value>)` in `tailwind.config.js` so Tailwind opacity modifiers resolve. Never hardcode hex in components. SVG and Web Animations code wrap a token as `rgb(var(--token))` (`token()` in `lib/chart.ts`).

```css
:root {
  /* Surfaces */
  --paper:   255 255 255;  /* #FFFFFF  the page */
  --hover:   247 248 250;  /* #F7F8FA  row hover */
  --weekend: 245 246 248;  /* #F5F6F8  weekend bands on the charts */

  /* Ink, strongest to faintest */
  --ink:   11 12 15;       /* #0B0C0F  text, lines, dots, links */
  --ink-2: 95 102 114;     /* #5F6672  secondary text */
  --ink-3: 154 160 170;    /* #9AA0AA  captions, axis labels, source lines */

  /* Hairlines */
  --line:   231 233 236;   /* #E7E9EC  table rules, panel borders, gridlines */
  --line-2: 240 241 243;   /* #F0F1F3  row dividers, the ledger rules at rest */
  --line-3: 201 204 209;   /* #C9CCD1  the zero axis, a bar that did not move, the stamp separator */
  --wave:   188 192 199;   /* #BCC0C7  a ledger rule at the crest of the wave */

  /* Change figures (the sign carries the direction, colour reinforces) */
  --up:   14 122 85;       /* #0E7A55  rose */
  --down: 196 61 47;       /* #C43D2F  fell */
  --flat: 154 160 170;     /* #9AA0AA  held */
}
```

`tailwind.config.js` maps these to semantic names via a channel helper:

```js
const ch = (name) => `rgb(var(${name}) / <alpha-value>)`;
// colors: paper, hover, ink, ink-2, ink-3, line, line-2, line-3, wave, up, down, flat (weekend is read straight from its custom property by the charts)
```

## Typeface

One stack, `font-sans`, the body default: `"Söhne", "Suisse Int'l", "Switzer", "Helvetica Neue", -apple-system, "SF Pro Text", Helvetica, Arial, sans-serif`. **Switzer** (Indian Type Foundry, ITF Free Font License) ships self-hosted as four woff2 files in `client/public/fonts/` (300, 400, 500, 600), declared with `@font-face` in `index.css` and preloaded in `index.html`. Söhne and Suisse lead the stack so a licensed face later is a file drop. No Google Fonts, no mono.

- Body 15px, line-height 1.5, `font-variant-numeric: tabular-nums`.
- Headings and big figures: weight **300**. Lead figure `clamp(76px, 10vw, 128px)`, tracking `-0.045em`, leading 0.92, pulled left `-0.15em` for the "1" bearing. Company name `clamp(44px, 6vw, 64px)`, tracking `-0.035em`. Company figure `clamp(64px, 8vw, 104px)`. Method heading `clamp(30px, 3.8vw, 44px)`.
- Lead sentences 19px weight 300 in `--ink-2`, emphasis weight 500 in ink. Names, counts, column labels weight 500. Wordmark 21px weight 600 tracking `-0.025em`.
- Captions 15px 500; table rows 14px (the company, sector, and movers tables) and 13.5px (the daily table, breakdowns) with names and counts at 500; table headers 12px 500 in `--ink-3`; axis labels 11.5px; meta and chart source lines 12.5px in `--ink-3`.

## The mark

A single step: `M3 17.5H10.5V6.5H21` in a 24 grid, stroke 2.2, round caps and joins, `currentColor` (`components/common/StepMark.tsx`). The favicon is the white step on an ink tile (`public/favicon.svg`).

## Layout dimensions

- Rail 1200px, gutter 20px on phones and 24px from `md`, or the side's safe-area inset when that is larger. Masthead row 68px over a hairline; the hero band lays its first rule over it. Screens end 96px above the footer's rule.
- Ledger rules every **32px** (`RULE_SPACING`) from the top of the hero band, which pads 32px and is sized to whole rule gaps. Panel edges sit at least **8px** (`RULE_CLEARANCE`) from a rule: side by side the panels share one height, and stacked (31px apart) each grows to `32k + 1`px so every edge sits halfway between two rules. A panel only grows, its extra going to the chart's plot or between the lead's blocks.
- Hero panel padding is even on all four sides: 40px for the lead from `lg`, 24px otherwise, with the vertical values trimmed by the half-leading of the first and last lines.
- Table rows 46px (company table), 42px (sector and movers tables), 36px (daily table), 38px (breakdowns); headers 38px on two hairlines. Section spacing `pt-14` (56px).
- Chart heights: hero fills its panel, full series 320px, breadth 150px, company 280px; every plot runs to the rail's right edge, the latest figure sits in the readout above the plot, and below 480px wide a line chart runs at 72% of its height (the breadth chart keeps its height and shows the last 30 releases on phones instead). Line 1.75px, endpoint dot r4, crosshair dot r4.
- Company marks 22px, radius 4px, 40px apart in the strip, from the 128px colour PNGs in `public/marks`.

## Animation

Constants live in `client/src/constants/animations.ts`.

```ts
export const DURATION = { normal: 200, smooth: 300 } as const;   // interaction motion
export const AMBIENT = { draw: 700, wave: 1400, waveStagger: 67, waveGap: 1500, waveLead: 1000 } as const;
export const EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';          // one curve for interaction
export const EASING_SYMMETRIC = 'cubic-bezier(0.45, 0, 0.55, 1)'; // the wave only
export const TRANSITION = { transitionDuration: '200ms', transitionTimingFunction: EASING }; // inline style for hovers and toggles
```

The section rise (500ms) and the companies strip loop (150s) are CSS in `index.css`; the strip pauses under the pointer. Honor `prefers-reduced-motion` in `index.css` and via `prefersReducedMotion()` in every Web Animations path; pause ambient motion while `document.hidden`.

## Interaction

Every clickable element gets a hover colour at `DURATION.normal`, a visible focus ring (`outline: 2px solid rgb(var(--ink)); outline-offset: 2px` via `:focus-visible`, inset to `-2px` on edge-to-edge rows), and no other change. Row hovers use `bg-hover`. Text links use `.link`.
