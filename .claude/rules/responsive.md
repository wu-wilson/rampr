---
paths:
  - "client/src/**/*.tsx"
  - "client/src/**/*.css"
---

# Responsive Design

## Breakpoints

Mobile-first, with three Tailwind screens: `sm` **560px** (the facts rows go from two columns to four or five, the movers tables sit side by side), `md` **760px** (the masthead shows its centred nav, the company table shows its sector and 30-day columns, the company lead puts the figure beside the name), `lg` **900px** (the masthead stamp adds the long date, the hero's two panels sit side by side and snap to the rules, the Company two-column grid and the three breakdown columns form). Base styles target a phone-width column; layer the wider layouts above each screen.

## The rail and full-bleed regions

- Content sits in a centred **1200px rail** (`Rail` = `max-w-rail mx-auto`, `rail` = `1200px`) with a gutter of `px-5` (20px) on phones and `md:px-6` (24px) above. The white paper extends past the rail with nothing marking its edges.
- The hero band and its ledger rules run edge to edge at every width, including ultra-wide, because the masthead, main, and footer each centre their own `Rail` rather than sharing one wrapper. Never break out of a rail with `100vw` and a negative margin; it fights `overflow-x: hidden` and the scrollbar.
- The companies strip sits inside the rail from `md` and runs edge to edge below it, fading out at its ends through its mask.
- **Below `md` every hairline runs edge to edge** (tables, breakdown lists, Method rows, the facts row, the strip's rule, the footer's rule) by pulling the ruled element out by the 20px gutter (`-mx-5 md:mx-0`) while its text keeps the gutter (`px-5 md:px-0`, or `px-5 md:px-4` for table grids, whose 16px inset applies only inside the rail). Above `md` the rules stop at the rail.

## Typography

- Base body 15px (set on `body` in `index.css`), line-height 1.5, tabular figures.
- The lead figure, the company name and figure, and the Method heading are fluid `clamp()` sizes. Axis labels are 11.5px, table headers 12px, and small labels, source lines, and change notes 12.5px; captions are 15px. Only the search field's key hint goes smaller, at 11px, and it hides on touch screens (`pointer: coarse`), which have no key to press.

## Layout collapse

- **The company table** keeps its grid line at every width: below `md` it drops the sector and 30-day columns (`28px minmax(0,1fr) 64px 56px`, the number columns sized to their headers so a name keeps its room at 320px), above it shows all six (`32px minmax(0,1fr) 120px 100px 100px 100px`), set at the gutter on phones and inset 16px inside the rail above, like every table. The sector table drops its share and bar columns below `md`.
- **The hero** stacks the lead panel over the chart panel below `lg`, and the lead's facts wrap inside their columns rather than spill, since the panel is narrowest just above `lg`; the band keeps its 48px pads and uses a 47px gap so every panel edge sits on a rule, with one rule above the first panel and one below the last. The facts row is two columns below `sm`.
- **Company**: the figure drops beneath the name below `md`; the company chart and the daily table stack below `lg`; the three breakdowns stack below `lg` with no dividing hairlines.
- **Charts** contain their own inline size (`contain: inline-size`) so an already-drawn svg can never hold a panel wider than the viewport; every plot runs to the rail's right edge, the latest figure sits in the readout above the plot, and a line chart narrower than 480px runs at 72% height. The breadth chart keeps its height and instead shows only the last 30 releases below `sm` (`useMediaQuery`), with its source line naming the window.
- **Market**: the full series chart and the breadth chart are full width at every size; the sector table and the movers tables sit side by side only once each can have 520px (an auto-fit grid, so near the full rail), and the two movers tables stack below `sm`.
- **Method** rows put the key above the text below `sm`.
- **Masthead**: below `lg` the stamp keeps only the release number, so it never crowds the centred routes, and below `md` the routes collapse behind a toggle that drops a short list. That list pushes the page down rather than covering it, so it closes on every route change.

## Viewport

- Never use `h-screen` / `min-h-screen` (`100vh`) — use `min-h-dvh` (dynamic viewport).
- `index.html` viewport: `viewport-fit=cover` for notched devices.
- Respect safe-area insets on top/bottom edges (`env(safe-area-inset-*)`); the paper fills the insets.
- Never allow horizontal overflow — `overflow-x: hidden` on html, and the strip and hero band clip their own overflow.

## States

- Every state has designed UI: loading, empty ("No company matches"), error, **day-zero** ("Before the first release", `updatedAt: null`), a company not yet counted ("Not counted yet"), and the **gated** state (`GatedPanel`, "builds at 14 releases", N of 14 cells). The empty-ish states are distinct.

## Scrolling

- `overscroll-behavior: none` on body to prevent pull-to-refresh.
- Avoid `overflow-x-auto` on containers holding focus-ring-bearing children — the browser also clips `overflow-y`, cropping rings.
